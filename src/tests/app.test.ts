import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { EmployeeRepository } from "../employeeRepository.js";
import { seedEmployees } from "../seed.js";

describe("Employee Directory API baseline", () => {
  let repository: EmployeeRepository;

  beforeEach(() => {
    repository = new EmployeeRepository(seedEmployees);
  });

  it("reports health without authentication", async () => {
    const response = await request(createApp({ repository })).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("requires a recognised role for the directory", async () => {
    const response = await request(createApp({ repository })).get("/employees");
    expect(response.status).toBe(401);
  });

  it("searches employees by text and department", async () => {
    const response = await request(createApp({ repository }))
      .get("/employees?q=car&department=Engineering")
      .set("x-role", "employee");

    expect(response.status).toBe(200);
    expect(response.body.employees.map((employee: { id: string }) => employee.id)).toEqual([
      "emp-3"
    ]);
  });

  it("prevents employees from using admin endpoints", async () => {
    const response = await request(createApp({ repository }))
      .get("/admin/employees")
      .set("x-role", "employee");
    expect(response.status).toBe(403);
  });

  it("creates an active employee", async () => {
    const response = await request(createApp({ repository }))
      .post("/admin/employees")
      .set("x-role", "admin")
      .send({
        firstName: "Dina",
        lastName: "Okafor",
        email: "Dina.Okafor@example.com",
        department: "Operations"
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      firstName: "Dina",
      email: "dina.okafor@example.com",
      active: true
    });
  });

  it("currently deletes an employee permanently", async () => {
    const app = createApp({ repository });
    const deleted = await request(app)
      .delete("/admin/employees/emp-2")
      .set("x-role", "admin");

    expect(deleted.status).toBe(204);
    expect(repository.findById("emp-2")).toBeUndefined();
  });
});
