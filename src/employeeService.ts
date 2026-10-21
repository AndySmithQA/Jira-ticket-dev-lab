import type { Employee, EmployeeInput } from "./models/employee.js";
import { DEPARTMENTS } from "./models/employee.js";
import {
  EmployeeRepository,
  type EmployeeSearch
} from "./employeeRepository.js";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export class EmployeeService {
  constructor(private readonly repository: EmployeeRepository) {}

  searchDirectory(filter: EmployeeSearch): Employee[] {
    return this.repository.search(filter);
  }

  getForDirectory(id: string): Employee {
    const employee = this.requireEmployee(id);
    if (!employee.active) {
      throw new HttpError(404, `Employee ${id} was not found`);
    }
    return employee;
  }

  listForAdmin(): Employee[] {
    return this.repository.findAll();
  }

  getForAdmin(id: string): Employee {
    return this.requireEmployee(id);
  }

  create(body: unknown): Employee {
    return this.repository.create(this.validate(body));
  }

  update(id: string, body: unknown): Employee {
    this.requireEmployee(id);
    return this.repository.update(id, this.validate(body))!;
  }

  delete(id: string): void {
    this.requireEmployee(id);
    this.repository.remove(id);
  }

  private requireEmployee(id: string): Employee {
    const employee = this.repository.findById(id);
    if (!employee) throw new HttpError(404, `Employee ${id} was not found`);
    return employee;
  }

  private validate(body: unknown): EmployeeInput {
    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Request body must be an object");
    }

    const value = body as Record<string, unknown>;
    const required = ["firstName", "lastName", "email", "department"] as const;
    for (const field of required) {
      if (typeof value[field] !== "string" || !value[field].trim()) {
        throw new HttpError(400, `${field} is required`);
      }
    }
    if (!value.email!.toString().includes("@")) {
      throw new HttpError(400, "email must be valid");
    }
    if (!DEPARTMENTS.includes(value.department as (typeof DEPARTMENTS)[number])) {
      throw new HttpError(400, "department is not recognised");
    }

    return {
      firstName: value.firstName as string,
      lastName: value.lastName as string,
      email: value.email as string,
      department: value.department as EmployeeInput["department"]
    };
  }
}
