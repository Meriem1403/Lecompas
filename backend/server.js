import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { ensureUserSchema, USER_SELECT_FIELDS } from "./db/schema.js";

const app = express();
const port = Number(process.env.PORT || 8000);
const apiPrefix = process.env.API_PREFIX || "/make-server-cfb78916";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const corsOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  corsOrigins.length > 0
    ? cors({ origin: corsOrigins, credentials: true })
    : cors(),
);
app.use(express.json({ limit: "50mb" }));

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

const kvDelete = async (key) => {
  await pool.query("DELETE FROM kv_store_cfb78916 WHERE key = $1", [key]);
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
      SELECT u.id, u.email, u.name, u.role, u.service, u.domain, u.location,
             u.first_name, u.last_name, u.position, u.category, u.inm, u.created_at
      FROM auth_tokens t
      JOIN users u ON u.id = t.user_id
      WHERE t.token = $1
      LIMIT 1
    `,
    [token],
  );
  return rows[0] ?? null;
};

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (String(stored).startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};

const upgradePasswordHash = async (userId, plain) => {
  const hashed = await hashPassword(plain);
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashed,
    userId,
  ]);
};

const mapUserRowToPublic = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  service: row.service,
  domain: row.domain ?? "",
  location: row.location ?? "",
  firstName: row.first_name ?? "",
  lastName: row.last_name ?? "",
  position: row.position ?? "",
  category: row.category ?? "",
  inm: row.inm ?? null,
  createdAt: row.created_at
    ? new Date(row.created_at).toISOString()
    : new Date().toISOString(),
});

const requireAuth = async (req, res) => {
  const token = getBearerToken(req.header("Authorization"));
  if (!token) {
    res.status(401).json({ error: "No authorization token" });
    return null;
  }
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
};

const requireAdmin = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return null;
  }
  return user;
};

const splitCsvValues = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const hasIntersection = (left, right) =>
  left.some((item) => right.includes(item));

const canUserAccessRisk = (userProfile, risk) => {
  if (!userProfile) return false;
  if (userProfile.role === "admin") return true;

  const userServices = splitCsvValues(userProfile.service);
  const userDomains = splitCsvValues(userProfile.domain);
  const userLocations = splitCsvValues(userProfile.location);

  const riskServices = splitCsvValues(risk.service);
  const riskDomains = splitCsvValues(risk.domain || risk.unite);
  const riskLocations = splitCsvValues(risk.site);

  const serviceMatch =
    userServices.length === 0 || hasIntersection(userServices, riskServices);
  const domainMatch =
    userDomains.length === 0 || hasIntersection(userDomains, riskDomains);
  const locationMatch =
    userLocations.length === 0 ||
    hasIntersection(userLocations, riskLocations);

  return serviceMatch && domainMatch && locationMatch;
};

const mountKvEntityRoutes = ({
  pathSegment,
  listKey,
  itemKeyPrefix,
  collectionKey,
  singularKey,
}) => {
  app.post(`${apiPrefix}/${pathSegment}`, async (req, res) => {
    try {
      const token = getBearerToken(req.header("Authorization"));
      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bodyId =
        typeof req.body?.id === "string" && req.body.id.trim()
          ? req.body.id.trim()
          : null;
      const entityId = bodyId || crypto.randomUUID();
      const now = new Date().toISOString();
      const entity = {
        ...req.body,
        id: entityId,
        createdBy: user.id,
        createdAt: req.body?.createdAt || now,
        updatedAt: now,
      };

      await kvSet(`${itemKeyPrefix}${entityId}`, entity);
      const entityList = (await kvGet(listKey)) || [];
      const nextList = entityList.includes(entityId)
        ? entityList
        : [...entityList, entityId];
      await kvSet(listKey, nextList);

      return res.json({ [singularKey]: entity });
    } catch (_error) {
      return res.status(500).json({
        error: `Server error creating ${pathSegment}`,
      });
    }
  });

  app.get(`${apiPrefix}/${pathSegment}`, async (req, res) => {
    try {
      const token = getBearerToken(req.header("Authorization"));
      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const entityList = (await kvGet(listKey)) || [];
      const items = await kvMget(
        entityList.map((id) => `${itemKeyPrefix}${id}`),
      );
      return res.json({ [collectionKey]: items });
    } catch (_error) {
      return res.status(500).json({
        error: `Server error getting ${pathSegment}`,
      });
    }
  });

  app.put(`${apiPrefix}/${pathSegment}/:id`, async (req, res) => {
    try {
      const token = getBearerToken(req.header("Authorization"));
      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const entityId = req.params.id;
      const existing = await kvGet(`${itemKeyPrefix}${entityId}`);
      if (!existing) {
        return res.status(404).json({ error: `${singularKey} not found` });
      }

      const updated = {
        ...existing,
        ...req.body,
        id: entityId,
        updatedAt: new Date().toISOString(),
      };
      await kvSet(`${itemKeyPrefix}${entityId}`, updated);
      return res.json({ [singularKey]: updated });
    } catch (_error) {
      return res.status(500).json({
        error: `Server error updating ${pathSegment}`,
      });
    }
  });

  app.delete(`${apiPrefix}/${pathSegment}/:id`, async (req, res) => {
    try {
      const token = getBearerToken(req.header("Authorization"));
      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const entityId = req.params.id;
      const existing = await kvGet(`${itemKeyPrefix}${entityId}`);
      if (!existing) {
        return res.status(404).json({ error: `${singularKey} not found` });
      }

      await kvDelete(`${itemKeyPrefix}${entityId}`);
      const entityList = (await kvGet(listKey)) || [];
      await kvSet(
        listKey,
        entityList.filter((id) => id !== entityId),
      );

      return res.json({ success: true, id: entityId });
    } catch (_error) {
      return res.status(500).json({
        error: `Server error deleting ${pathSegment}`,
      });
    }
  });
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

    const passwordHash = await hashPassword(password);
    await pool.query(
      `
        INSERT INTO users(id, email, password, name, role, service)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [id, email, passwordHash, name, role, user.service],
    );
    const publicUser = mapUserRowToPublic({
      id,
      email,
      name,
      role,
      service: user.service,
      domain: "",
      location: "",
      first_name: "",
      last_name: "",
      position: "",
      category: "",
      inm: null,
      created_at: new Date(),
    });
    await kvSet(`user:${id}`, publicUser);

    return res.json({ user: publicUser });
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
      `
        SELECT id, email, password, name, role, service, domain, location,
               first_name, last_name, position, category, inm, created_at
        FROM users WHERE email = $1 LIMIT 1
      `,
      [email],
    );
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!String(row.password).startsWith("$2")) {
      await upgradePasswordHash(row.id, password);
    }

    const user = mapUserRowToPublic(row);
    await kvSet(`user:${row.id}`, user);

    const token = crypto.randomUUID();
    await pool.query("INSERT INTO auth_tokens(token, user_id) VALUES ($1, $2)", [
      token,
      row.id,
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
    const merged = userData
      ? { ...mapUserRowToPublic(user), ...userData }
      : mapUserRowToPublic(user);
    return res.json({ user: merged });
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

    const bodyId =
      typeof req.body?.id === "string" && req.body.id.trim()
        ? req.body.id.trim()
        : null;
    const riskId = bodyId || crypto.randomUUID();
    const now = new Date().toISOString();
    const risk = {
      ...req.body,
      id: riskId,
      createdBy: user.id,
      createdAt: req.body?.createdAt || now,
      updatedAt: now,
    };

    await kvSet(`risk:${riskId}`, risk);
    const risksList = (await kvGet("risks:list")) || [];
    const nextList = risksList.includes(riskId)
      ? risksList
      : [...risksList, riskId];
    await kvSet("risks:list", nextList);

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

    const userProfile = (await kvGet(`user:${user.id}`)) || user;
    const risksList = (await kvGet("risks:list")) || [];
    const risks = await kvMget(risksList.map((id) => `risk:${id}`));
    const visibleRisks = risks.filter((risk) =>
      canUserAccessRisk(userProfile, risk),
    );
    return res.json({ risks: visibleRisks });
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

app.delete(`${apiPrefix}/risks/:id`, async (req, res) => {
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

    await kvDelete(`risk:${riskId}`);
    const list = (await kvGet("risks:list")) || [];
    const nextList = list.filter((id) => id !== riskId);
    await kvSet("risks:list", nextList);

    return res.json({ success: true, id: riskId });
  } catch (_error) {
    return res.status(500).json({ error: "Server error deleting risk" });
  }
});

mountKvEntityRoutes({
  pathSegment: "accidents",
  listKey: "accidents:list",
  itemKeyPrefix: "accident:",
  collectionKey: "accidents",
  singularKey: "accident",
});

mountKvEntityRoutes({
  pathSegment: "actions",
  listKey: "actions:list",
  itemKeyPrefix: "action:",
  collectionKey: "actions",
  singularKey: "action",
});

mountKvEntityRoutes({
  pathSegment: "notifications",
  listKey: "notifications:list",
  itemKeyPrefix: "notification:",
  collectionKey: "notifications",
  singularKey: "notification",
});

mountKvEntityRoutes({
  pathSegment: "action-returns",
  listKey: "actionReturns:list",
  itemKeyPrefix: "actionReturn:",
  collectionKey: "actionReturns",
  singularKey: "actionReturn",
});

const APP_DATA_REGISTRY = {
  organization: { adminOnlyWrite: true },
  accessProfiles: { adminOnlyWrite: true },
  riskReferences: { adminOnlyWrite: false },
  securitySheets: { adminOnlyWrite: false },
  awarenessRecords: { adminOnlyWrite: false },
  suppressedAwarenessKeys: { adminOnlyWrite: false },
  safetyProtocols: { adminOnlyWrite: false },
  deletedProtocols: { adminOnlyWrite: false },
  preventionPlans: { adminOnlyWrite: false },
  papripactSignatures: { adminOnlyWrite: false },
  registreBenignAccidents: { adminOnlyWrite: false },
  documentsLibrary: { adminOnlyWrite: false },
  archivesLibrary: { adminOnlyWrite: false },
  actualites: { adminOnlyWrite: false },
  cerbereApplications: { adminOnlyWrite: false },
  cerbereRequests: { adminOnlyWrite: false },
  medicalVisits: { adminOnlyWrite: false },
  sstRegistryRemarks: { adminOnlyWrite: false },
  adminRoles: { adminOnlyWrite: true },
  mercuryCampaigns: { adminOnlyWrite: false },
  asbestosInterventions: { adminOnlyWrite: false },
  asbestosAttestations: { adminOnlyWrite: false },
  asbestosDeclarations: { adminOnlyWrite: false },
  rhArriveesDepartsDemandes: { adminOnlyWrite: false },
  rhArriveesDepartsQuestionnaires: { adminOnlyWrite: false },
  notificationPreferencesByUser: { adminOnlyWrite: false },
  resourceReservations: { adminOnlyWrite: false },
  asbestosSuiviRegister: { adminOnlyWrite: false },
  asbestosSitesDta: { adminOnlyWrite: false },
  accidentSuiviIndicateurs: { adminOnlyWrite: false },
};

app.get(`${apiPrefix}/app-data/:key`, async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const key = req.params.key;
    if (!APP_DATA_REGISTRY[key]) {
      return res.status(400).json({ error: "Unknown app data key" });
    }

    const value = await kvGet(`appdata:${key}`);
    return res.json({ value: value ?? null });
  } catch (_error) {
    return res.status(500).json({ error: "Server error reading app data" });
  }
});

app.put(`${apiPrefix}/app-data/:key`, async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const key = req.params.key;
    const registry = APP_DATA_REGISTRY[key];
    if (!registry) {
      return res.status(400).json({ error: "Unknown app data key" });
    }
    if (registry.adminOnlyWrite && user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    if (!Object.prototype.hasOwnProperty.call(req.body, "value")) {
      return res.status(400).json({ error: "Missing value" });
    }

    await kvSet(`appdata:${key}`, req.body.value);
    return res.json({ ok: true });
  } catch (_error) {
    return res.status(500).json({ error: "Server error saving app data" });
  }
});

const userBodyToColumns = (body) => ({
  email: String(body.email || "").trim(),
  name:
    String(body.name || "").trim() ||
    `${body.firstName || ""} ${body.lastName || ""}`.trim(),
  role: String(body.role || "agent"),
  service: String(body.service || ""),
  domain: String(body.domain || ""),
  location: String(body.location || ""),
  first_name: String(body.firstName || ""),
  last_name: String(body.lastName || ""),
  position: String(body.position || ""),
  category: String(body.category || ""),
  inm:
    body.inm === null || body.inm === undefined || body.inm === ""
      ? null
      : Number(body.inm),
});

app.get(`${apiPrefix}/users`, async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { rows } = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users ORDER BY email`,
    );
    return res.json({ users: rows.map(mapUserRowToPublic) });
  } catch (_error) {
    return res.status(500).json({ error: "Server error listing users" });
  }
});

app.post(`${apiPrefix}/users`, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const cols = userBodyToColumns(req.body);
    if (!cols.email) {
      return res.status(400).json({ error: "Email required" });
    }
    const plainPassword = req.body.password;
    if (!plainPassword || String(plainPassword).length < 4) {
      return res.status(400).json({ error: "Password required (min 4 chars)" });
    }

    const id =
      typeof req.body.id === "string" && req.body.id.trim()
        ? req.body.id.trim()
        : crypto.randomUUID();
    const passwordHash = await hashPassword(String(plainPassword));

    await pool.query(
      `
        INSERT INTO users(
          id, email, password, name, role, service, domain, location,
          first_name, last_name, position, category, inm
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `,
      [
        id,
        cols.email,
        passwordHash,
        cols.name || cols.email,
        cols.role,
        cols.service,
        cols.domain,
        cols.location,
        cols.first_name,
        cols.last_name,
        cols.position,
        cols.category,
        cols.inm,
      ],
    );

    const { rows } = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = $1`,
      [id],
    );
    const publicUser = mapUserRowToPublic(rows[0]);
    await kvSet(`user:${id}`, publicUser);
    return res.status(201).json({ user: publicUser });
  } catch (error) {
    if (String(error.message).includes("users_email_key")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Server error creating user" });
  }
});

app.put(`${apiPrefix}/users/:id`, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const userId = req.params.id;
    const { rows: existingRows } = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [userId],
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const cols = userBodyToColumns(req.body);
    const plainPassword = req.body.password;

    if (plainPassword && String(plainPassword).length >= 4) {
      const passwordHash = await hashPassword(String(plainPassword));
      await pool.query(
        `
          UPDATE users SET
            email = $2, name = $3, role = $4, service = $5, domain = $6, location = $7,
            first_name = $8, last_name = $9, position = $10, category = $11, inm = $12,
            password = $13
          WHERE id = $1
        `,
        [
          userId,
          cols.email,
          cols.name,
          cols.role,
          cols.service,
          cols.domain,
          cols.location,
          cols.first_name,
          cols.last_name,
          cols.position,
          cols.category,
          cols.inm,
          passwordHash,
        ],
      );
    } else {
      await pool.query(
        `
          UPDATE users SET
            email = $2, name = $3, role = $4, service = $5, domain = $6, location = $7,
            first_name = $8, last_name = $9, position = $10, category = $11, inm = $12
          WHERE id = $1
        `,
        [
          userId,
          cols.email,
          cols.name,
          cols.role,
          cols.service,
          cols.domain,
          cols.location,
          cols.first_name,
          cols.last_name,
          cols.position,
          cols.category,
          cols.inm,
        ],
      );
    }

    const { rows } = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = $1`,
      [userId],
    );
    const publicUser = mapUserRowToPublic(rows[0]);
    await kvSet(`user:${userId}`, publicUser);
    return res.json({ user: publicUser });
  } catch (error) {
    if (String(error.message).includes("users_email_key")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Server error updating user" });
  }
});

app.delete(`${apiPrefix}/users/:id`, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const userId = req.params.id;
    if (userId === admin.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      userId,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    await kvDelete(`user:${userId}`);
    return res.json({ success: true, id: userId });
  } catch (_error) {
    return res.status(500).json({ error: "Server error deleting user" });
  }
});

const start = async () => {
  try {
    await ensureUserSchema(pool);
    console.log("[Lecompas] Schéma utilisateurs à jour");
  } catch (error) {
    console.error("[Lecompas] Migration schéma utilisateurs", error);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(
      `Local backend listening on http://0.0.0.0:${port}${apiPrefix}`,
    );
  });
};

void start();
