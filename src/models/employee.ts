export const DEPARTMENTS = ["Engineering", "People", "Finance", "Operations"] as const;

export type Department = (typeof DEPARTMENTS)[number];

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  active: boolean;
};

export type EmployeeInput = Omit<Employee, "id" | "active">;
