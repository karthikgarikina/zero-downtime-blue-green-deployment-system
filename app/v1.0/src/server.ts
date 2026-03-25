import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
});

let shuttingDown = false;

// ---------- TYPES ----------
interface User {
  id: number;
  username: string;
  email: string;
}

// ---------- HELPERS ----------
const success = (res: Response, message: string, data?: unknown) => {
  res.json({ success: true, message, data });
};

const error = (res: Response, message: string, code = 400) => {
  res.status(code).json({ success: false, message });
};

// ---------- HEALTH ----------
app.get("/health", (_: Request, res: Response) =>
  success(res, "Service healthy")
);

app.get("/health/live", (_: Request, res: Response) =>
  success(res, "Service live")
);

app.get("/health/ready", (_: Request, res: Response) => {
  if (shuttingDown) return error(res, "Shutting down", 503);
  success(res, "Service ready");
});

// ---------- VERSION ----------
app.get("/api/version", (_: Request, res: Response) => {
  success(res, "Version info", {
    version: "1.0.0",
    environment: "blue",
  });
});

// ---------- CRUD ----------
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    if (!username || !email)
      return error(res, "username and email are required");

    const result = await pool.query<User>(
      "INSERT INTO users(username,email) VALUES($1,$2) RETURNING *",
      [username, email]
    );

    success(res, "User created successfully", result.rows[0]);
  } catch {
    error(res, "Failed to create user", 500);
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<User>(
      "SELECT * FROM users WHERE id=$1",
      [req.params.id]
    );

    if (!result.rows.length) return error(res, "User not found", 404);

    success(res, "User fetched", result.rows[0]);
  } catch {
    error(res, "Failed to fetch user", 500);
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    const result = await pool.query<User>(
      "UPDATE users SET username=$1,email=$2 WHERE id=$3 RETURNING *",
      [username, email, req.params.id]
    );

    if (!result.rows.length) return error(res, "User not found", 404);

    success(res, "User updated", result.rows[0]);
  } catch {
    error(res, "Failed to update user", 500);
  }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) return error(res, "User not found", 404);

    success(res, "User deleted");
  } catch {
    error(res, "Failed to delete user", 500);
  }
});

// ---------- GLOBAL ERROR HANDLER ----------
app.use((_: Request, res: Response) => {
  error(res, "Route not found", 404);
});

// ---------- GRACEFUL SHUTDOWN ----------
process.on("SIGTERM", () => {
  shuttingDown = true;
  setTimeout(() => process.exit(0), 30000);
});

app.listen(8080, () => console.log("Blue running on 8080"));