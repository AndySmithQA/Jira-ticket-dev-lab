import type { Employee } from "./models/employee.js";

export const seedEmployees: Employee[] = [
  {
    id: "emp-1",
    firstName: "Alice",
    lastName: "Chen",
    email: "alice.chen@example.com",
    department: "Engineering",
    active: true
  },
  {
    id: "emp-2",
    firstName: "Ben",
    lastName: "Ortiz",
    email: "ben.ortiz@example.com",
    department: "People",
    active: true
  },
  {
    id: "emp-3",
    firstName: "Cara",
    lastName: "Singh",
    email: "cara.singh@example.com",
    department: "Engineering",
    active: true
  }
];
