import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
const CONFIG_FILE = path.join(process.cwd(), "data", "config.json");

export type Role = "admin" | "user";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  active: boolean;
  permissions: string[]; // button IDs
}

export interface UsersData {
  users: User[];
}

export function readUsers(): UsersData {
  const raw = fs.readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(raw);
}

export function writeUsers(data: UsersData): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function authenticateUser(
  email: string,
  password: string
): User | null {
  const { users } = readUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password && u.active
  );
  return user || null;
}

export function readConfig() {
  const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(raw);
}

export function writeConfig(data: object): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}
