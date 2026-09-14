import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { EmployeeRepository } from "../employeeRepository.js";
import { seedEmployees } from "../seed.js";

describe("PEOPLE-142 acceptance criteria", () => {
  let repository: EmployeeRepository;

  beforeEach(() => {
    repository = new EmployeeRepository(seedEmployees);
  });

  it("AC1: delete marks the stored employee inactive", async () => {
    const response = await request(createApp({ repository }))
      .delete("/admin/employees/emp-2")
      .set("x-role", "admin");

    expect(response.status).toBe(204);
    expect(repository.findById("emp-2")).toMatchObject({ active: false });
  });

  it("AC2: directory searches hide inactive employees", async () => {
    const app = createApp({ repository });
    await request(app).delete("/admin/employees/emp-3").set("x-role", "admin");

    const all = await request(app).get("/employees").set("x-role", "employee");
    const filtered = await request(app)
      .get("/employees?q=cara&department=Engineering")
      .set("x-role", "employee");

    expect(all.body.employees.map((employee: { id: string }) => employee.id)).not.toContain(
      "emp-3"
    );
    expect(filtered.body.employees).toEqual([]);
  });

  it("AC3: directory lookup returns 404 for an inactive employee", async () => {
    const app = createApp({ repository });
    await request(app).delete("/admin/employees/emp-2").set("x-role", "admin");

    const response = await request(app)
      .get("/employees/emp-2")
      .set("x-role", "employee");

    expect(response.status).toBe(404);
  });

  it("AC4: administrators can list and retrieve inactive employees", async () => {
    const app = createApp({ repository });
    await request(app).delete("/admin/employees/emp-2").set("x-role", "admin");

    const list = await request(app)
      .get("/admin/employees")
      .set("x-role", "admin");
    const detail = await request(app)
      .get("/admin/employees/emp-2")
      .set("x-role", "admin");

    expect(list.body.employees).toContainEqual(
      expect.objectContaining({ id: "emp-2", active: false })
    );
    expect(detail.body).toMatchObject({ id: "emp-2", active: false });
  });

  it("AC5: deleting an already inactive employee is idempotent", async () => {
    const app = createApp({ repository });

    expect(
      (await request(app).delete("/admin/employees/emp-2").set("x-role", "admin")).status
    ).toBe(204);
    expect(
      (await request(app).delete("/admin/employees/emp-2").set("x-role", "admin")).status
    ).toBe(204);
    expect(repository.findById("emp-2")).toMatchObject({ active: false });
  });
});
