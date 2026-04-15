import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { Pool } from "pg";

const app = express();
const port = Number(process.env.PORT || 8000);
const apiPrefix = process.env.API_PREFIX || "/make-server-cfb78916";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

const kvGet = async (key) => {
  const { rows } = await pool.query(
    "SELECT value FROM kv_store_cfb78916 WHERE key = $1 LIMIT 1",
    [key],
  );
  return rows[0]?.value ?? null;
};

const kvSet = async (key, value) => {
  await pool.query(
    `
      INSERT INTO kv_store_cfb78916(key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
    [key, JSON.stringify(value)],
  );
};

const kvMget = async (keys) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    return [];
  }
  const { rows } = await pool.query(
    "SELECT key, value FROM kv_store_cfb78916 WHERE key = ANY($1::text[])",
    [keys],
  );
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return keys.map((key) => map.get(key)).filter(Boolean);
};

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.slice(7).trim();
};

const getUserFromToken = async (token) => {
  if (!token) {
    return null;
  }
  const { rows } = await pool.query(
    `
      SELECT u.id, u.email, u.name, u.role, u.service
      FROM auth_tokens t
      JOIN users u ON u.id = t.user_id
      WHERE t.token = $1
      LIMIT 1
    `,
    [token],
  );
  return rows[0] ?? null;
};

app.get(`${apiPrefix}/health`, (_req, res) => {
  res.json({ status: "ok", mode: "local" });
});

app.post(`${apiPrefix}/signup`, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = crypto.randomUUID();
    const user = {
      id,
      email,
      name,
      role,
      service: "Direction",
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `
        INSERT INTO users(id, email, password, name, role, service)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [id, email, password, name, role, user.service],
    );
    await kvSet(`user:${id}`, user);

    return res.json({ user });
  } catch (error) {
    if (String(error.message).includes("users_email_key")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Server error during signup" });
  }
});

app.post(`${apiPrefix}/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { rows } = await pool.query(
      "SELECT id, email, name, role, service FROM users WHERE email = $1 AND password = $2 LIMIT 1",
      [email, password],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = crypto.randomUUID();
    await pool.query("INSERT INTO auth_tokens(token, user_id) VALUES ($1, $2)", [
      token,
      user.id,
    ]);
    return res.json({ access_token: token, user });
  } catch (_error) {
    return res.status(500).json({ error: "Server error during login" });
  }
});

app.get(`${apiPrefix}/profile`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    if (!token) {
      return res.status(401).json({ error: "No authorization token" });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userData = await kvGet(`user:${user.id}`);
    return res.json({ user: userData || user });
  } catch (_error) {
    return res.status(500).json({ error: "Server error getting profile" });
  }
});

app.post(`${apiPrefix}/risks`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const riskId = crypto.randomUUID();
    const now = new Date().toISOString();
    const risk = {
      id: riskId,
      ...req.body,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    };

    await kvSet(`risk:${riskId}`, risk);
    const risksList = (await kvGet("risks:list")) || [];
    await kvSet("risks:list", [...risksList, riskId]);

    return res.json({ risk });
  } catch (_error) {
    return res.status(500).json({ error: "Server error creating risk" });
  }
});

app.get(`${apiPrefix}/risks`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const risksList = (await kvGet("risks:list")) || [];
    const risks = await kvMget(risksList.map((id) => `risk:${id}`));
    return res.json({ risks });
  } catch (_error) {
    return res.status(500).json({ error: "Server error getting risks" });
  }
});

app.put(`${apiPrefix}/risks/:id`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const riskId = req.params.id;
    const existingRisk = await kvGet(`risk:${riskId}`);
    if (!existingRisk) {
      return res.status(404).json({ error: "Risk not found" });
    }

    const updatedRisk = {
      ...existingRisk,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`risk:${riskId}`, updatedRisk);
    return res.json({ risk: updatedRisk });
  } catch (_error) {
    return res.status(500).json({ error: "Server error updating risk" });
  }
});

app.post(`${apiPrefix}/accidents`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accidentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const accident = {
      id: accidentId,
      ...req.body,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    };

    await kvSet(`accident:${accidentId}`, accident);
    const accidentsList = (await kvGet("accidents:list")) || [];
    await kvSet("accidents:list", [...accidentsList, accidentId]);
    return res.json({ accident });
  } catch (_error) {
    return res.status(500).json({ error: "Server error creating accident" });
  }
});

app.get(`${apiPrefix}/accidents`, async (req, res) => {
  try {
    const token = getBearerToken(req.header("Authorization"));
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accidentsList = (await kvGet("accidents:list")) || [];
    const accidents = await kvMget(accidentsList.map((id) => `accident:${id}`));
    return res.json({ accidents });
  } catch (_error) {
    return res.status(500).json({ error: "Server error getting accidents" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Local backend listening on http://0.0.0.0:${port}${apiPrefix}`);
});
