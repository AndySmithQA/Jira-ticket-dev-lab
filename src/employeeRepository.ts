import type { Employee, EmployeeInput } from "./models/employee.js";

export type EmployeeSearch = {
  q?: string;
  department?: string;
};

function copy(employee: Employee): Employee {
  return { ...employee };
}

export class EmployeeRepository {
  private readonly employees = new Map<string, Employee>();

  constructor(seed: Employee[] = []) {
    this.reset(seed);
  }

  reset(seed: Employee[]): void {
    this.employees.clear();
    seed.forEach((employee) => this.employees.set(employee.id, copy(employee)));
  }

  findAll(): Employee[] {
    return [...this.employees.values()].map(copy);
  }

  findById(id: string): Employee | undefined {
    const employee = this.employees.get(id);
    return employee ? copy(employee) : undefined;
  }

  search({ q, department }: EmployeeSearch): Employee[] {
    const term = q?.trim().toLowerCase();
    return this.findAll().filter((employee) => {
      const matchesDepartment =
        !department || employee.department.toLowerCase() === department.toLowerCase();
      const haystack =
        `${employee.firstName} ${employee.lastName} ${employee.email}`.toLowerCase();
      return matchesDepartment && (!term || haystack.includes(term));
    });
  }

  create(input: EmployeeInput): Employee {
    const employee: Employee = {
      id: crypto.randomUUID(),
      ...input,
      email: input.email.toLowerCase(),
      active: true
    };
    this.employees.set(employee.id, employee);
    return copy(employee);
  }

  update(id: string, input: EmployeeInput): Employee | undefined {
    const current = this.employees.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...input, email: input.email.toLowerCase() };
    this.employees.set(id, updated);
    return copy(updated);
  }

  // Current shipped behaviour: deleting permanently removes the record.
  remove(id: string): boolean {
    return this.employees.delete(id);
  }
}
