import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-cfb78916/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint
app.post("/make-server-cfb78916/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log(`Authorization error while creating user during signup: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store additional user info in KV store
    await kv.set(`user:${userData.user.id}`, {
      id: userData.user.id,
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      user: {
        id: userData.user.id,
        email,
        name,
        role
      }
    });
  } catch (error) {
    console.log(`Error during signup: ${error}`);
    return c.json({ error: 'Server error during signup' }, 500);
  }
});

// Get user profile
app.get("/make-server-cfb78916/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.log(`Authorization error while getting user profile: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData });
  } catch (error) {
    console.log(`Error getting profile: ${error}`);
    return c.json({ error: 'Server error getting profile' }, 500);
  }
});

// Create risk
app.post("/make-server-cfb78916/risks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const riskData = await c.req.json();
    const riskId = crypto.randomUUID();
    const risk = {
      id: riskId,
      ...riskData,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`risk:${riskId}`, risk);
    
    // Add to risks list
    const risksList = await kv.get('risks:list') || [];
    risksList.push(riskId);
    await kv.set('risks:list', risksList);

    return c.json({ risk });
  } catch (error) {
    console.log(`Error creating risk: ${error}`);
    return c.json({ error: 'Server error creating risk' }, 500);
  }
});

// Get all risks
app.get("/make-server-cfb78916/risks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const risksList = await kv.get('risks:list') || [];
    const risks = await kv.mget(risksList.map((id: string) => `risk:${id}`));

    return c.json({ risks });
  } catch (error) {
    console.log(`Error getting risks: ${error}`);
    return c.json({ error: 'Server error getting risks' }, 500);
  }
});

// Update risk
app.put("/make-server-cfb78916/risks/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const riskId = c.req.param('id');
    const updates = await c.req.json();
    const existingRisk = await kv.get(`risk:${riskId}`);

    if (!existingRisk) {
      return c.json({ error: 'Risk not found' }, 404);
    }

    const updatedRisk = {
      ...existingRisk,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`risk:${riskId}`, updatedRisk);

    return c.json({ risk: updatedRisk });
  } catch (error) {
    console.log(`Error updating risk: ${error}`);
    return c.json({ error: 'Server error updating risk' }, 500);
  }
});

// Create accident
app.post("/make-server-cfb78916/accidents", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accidentData = await c.req.json();
    const accidentId = crypto.randomUUID();
    const accident = {
      id: accidentId,
      ...accidentData,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`accident:${accidentId}`, accident);
    
    // Add to accidents list
    const accidentsList = await kv.get('accidents:list') || [];
    accidentsList.push(accidentId);
    await kv.set('accidents:list', accidentsList);

    return c.json({ accident });
  } catch (error) {
    console.log(`Error creating accident: ${error}`);
    return c.json({ error: 'Server error creating accident' }, 500);
  }
});

// Get all accidents
app.get("/make-server-cfb78916/accidents", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accidentsList = await kv.get('accidents:list') || [];
    const accidents = await kv.mget(accidentsList.map((id: string) => `accident:${id}`));

    return c.json({ accidents });
  } catch (error) {
    console.log(`Error getting accidents: ${error}`);
    return c.json({ error: 'Server error getting accidents' }, 500);
  }
});

Deno.serve(app.fetch);
