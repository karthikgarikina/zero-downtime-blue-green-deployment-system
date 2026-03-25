import express, { Request, Response } from "express";
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

// ---------- FEATURES ----------
let features = {
  phoneNumber: process.env.FEATURE_PHONE_NUMBER === "true",
  profilePicture: process.env.FEATURE_PROFILE_PICTURE === "true",
};

// ---------- TYPES ----------
interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  profile_picture_url?: string;
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
    version: "2.0.0",
    environment: "green",
    features,
  });
});

// ---------- FEATURE FLAGS ----------
app.get("/api/features", (_: Request, res: Response) => {
  success(res, "Feature flags", features);
});

app.put("/api/features/:name", (req: Request, res: Response) => {
  const { name } = req.params;
  const { enabled } = req.body as { enabled: boolean };

  if (!(name in features))
    return error(res, "Invalid feature name", 400);

  (features as any)[name] = enabled;

  success(res, `Feature ${name} updated`, features);
});

// ---------- CRUD ----------
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    let { username, email, phone_number, profile_picture_url } = req.body;

    if (!username || !email)
      return error(res, "username and email are required");

    if (!features.phoneNumber) phone_number = null;
    if (!features.profilePicture) profile_picture_url = null;

    const result = await pool.query<User>(
      `INSERT INTO users(username,email,phone_number,profile_picture_url)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [username, email, phone_number, profile_picture_url]
    );

    success(res, "User created", result.rows[0]);
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

    let user = result.rows[0];

    if (!features.phoneNumber) delete user.phone_number;
    if (!features.profilePicture) delete user.profile_picture_url;

    success(res, "User fetched", user);
  } catch {
    error(res, "Failed to fetch user", 500);
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    let { username, email, phone_number, profile_picture_url } = req.body;

    if (!features.phoneNumber) phone_number = null;
    if (!features.profilePicture) profile_picture_url = null;

    const result = await pool.query<User>(
      `UPDATE users SET username=$1,email=$2,
       phone_number=$3,profile_picture_url=$4 WHERE id=$5 RETURNING *`,
      [username, email, phone_number, profile_picture_url, req.params.id]
    );

    if (!result.rows.length) return error(res, "User not found", 404);

    success(res, "User updated", result.rows[0]);
  } catch {
    error(res, "Failed to update user", 500);
  }
});

// ---------- NOT FOUND ----------
app.use((_: Request, res: Response) => {
  error(res, "Route not found", 404);
});

// ---------- GRACEFUL SHUTDOWN ----------
process.on("SIGTERM", () => {
  shuttingDown = true;
  setTimeout(() => process.exit(0), 30000);
});

app.listen(8080, () => console.log("Green running on 8080"));