import express, { type NextFunction, type Request, type Response } from "express";
import { EmployeeRepository } from "./employeeRepository.js";
import { EmployeeService, HttpError } from "./employeeService.js";
import { seedEmployees } from "./seed.js";

export type AppDependencies = {
  repository?: EmployeeRepository;
};

function requireRole(role?: "admin") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const supplied = req.header("x-role");
    if (supplied !== "employee" && supplied !== "admin") {
      res.status(401).json({ error: "Use x-role: employee or x-role: admin" });
      return;
    }
    if (role === "admin" && supplied !== "admin") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    next();
  };
}

export function createApp({ repository = new EmployeeRepository(seedEmployees) }: AppDependencies = {}) {
  const app = express();
  const service = new EmployeeService(repository);
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
      <html lang="en">
        <head><meta charset="utf-8"><title>Employee Directory API</title>
        <style>body{font:16px system-ui;max-width:760px;margin:3rem auto;padding:0 1rem}code{background:#eee;padding:.15rem .35rem}li{margin:.6rem}</style></head>
        <body>
          <h1>Employee Directory API</h1>
          <p>The service is running. Authenticate API requests with <code>x-role: employee</code> or <code>x-role: admin</code>.</p>
          <h2>Current endpoints</h2>
          <ul>
            <li><code>GET /employees</code> — search with optional <code>q</code> and <code>department</code></li>
            <li><code>GET /employees/:id</code> — view a colleague</li>
            <li><code>GET /admin/employees</code> — admin list</li>
            <li><code>POST /admin/employees</code>, <code>PUT /admin/employees/:id</code>, <code>DELETE /admin/employees/:id</code></li>
          </ul>
          <p>Health: <a href="/health">/health</a></p>
        </body>
      </html>`);
  });

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.get("/employees", requireRole(), (req, res) => {
    res.json({
      employees: service.searchDirectory({
        q: typeof req.query.q === "string" ? req.query.q : undefined,
        department:
          typeof req.query.department === "string" ? req.query.department : undefined
      })
    });
  });

  app.get("/employees/:id", requireRole(), (req, res) => {
    res.json(service.getForDirectory(String(req.params.id)));
  });

  app.get("/admin/employees", requireRole("admin"), (_req, res) => {
    res.json({ employees: service.listForAdmin() });
  });

  app.get("/admin/employees/:id", requireRole("admin"), (req, res) => {
    res.json(service.getForAdmin(String(req.params.id)));
  });

  app.post("/admin/employees", requireRole("admin"), (req, res) => {
    res.status(201).json(service.create(req.body));
  });

  app.put("/admin/employees/:id", requireRole("admin"), (req, res) => {
    res.json(service.update(String(req.params.id), req.body));
  });

  app.delete("/admin/employees/:id", requireRole("admin"), (req, res) => {
    service.delete(String(req.params.id));
    res.status(204).send();
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
