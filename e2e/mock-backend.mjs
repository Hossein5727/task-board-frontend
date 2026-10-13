// TEST-ONLY in-memory stand-in for the NestJS API, implementing the *provisional* contract in README.
// It exists so E2E tests and local UI review can exercise the real Next.js proxy + HttpOnly cookie flow.
// It is not the backend and enforces only enough rules to make the UI flows realistic.
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4000);
const PASSWORD = "Password123!";

const users = [
  { id: "u-owner", email: "owner@example.com", fullName: "سارا محمدی", role: "owner", isActive: true },
  { id: "u-manager", email: "manager@example.com", fullName: "علی رضایی", role: "manager", isActive: true },
  { id: "u-member", email: "member@example.com", fullName: "نگار کریمی", role: "member", isActive: true },
];
const passwords = new Map(users.map((u) => [u.id, PASSWORD]));
const summary = (id) => {
  const u = users.find((x) => x.id === id);
  return u ? { id: u.id, fullName: u.fullName, email: u.email } : null;
};
const doc = (text) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const now = () => new Date().toISOString();
const makeTask = (t) => ({ priority: "medium", dueDate: null, assigneeId: null, createdAt: now(), updatedAt: now(), ...t });
let tasks = [
  makeTask({ id: randomUUID(), title: "طراحی صفحهٔ ورود", status: "done", priority: "high", assigneeId: "u-member", createdById: "u-manager", description: doc("فرم ورود با پشتیبانی کامل از راست‌به‌چپ.") }),
  makeTask({ id: randomUUID(), title: "پیاده‌سازی فیلتر وظایف", status: "in_progress", assigneeId: "u-manager", createdById: "u-owner", dueDate: "2026-10-20", description: doc("فیلتر بر اساس وضعیت و مسئول.") }),
  makeTask({ id: randomUUID(), title: "نوشتن مستندات استقرار", status: "todo", priority: "low", createdById: "u-member", dueDate: "2026-10-01", description: doc("") }),
  makeTask({ id: randomUUID(), title: "بازبینی امنیتی کوکی‌ها", status: "todo", priority: "high", assigneeId: "u-owner", createdById: "u-owner", description: { type: "doc", content: [{ type: "paragraph" }] } }),
];

const access = new Map(); // token -> userId
const refresh = new Map();

const withRelations = (t) => ({ ...t, assignee: summary(t.assigneeId), createdBy: summary(t.createdById) });
const canSee = (user, t) => user.role !== "member" || t.createdById === user.id || t.assigneeId === user.id;

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function cookie(name, value, maxAge, path = "/") {
  return `${name}=${value}; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=${maxAge}`;
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}
const error = (res, status, message) => send(res, status, { statusCode: status, message, error: message });

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function issueSession(res, userId) {
  const a = randomUUID();
  const r = randomUUID();
  access.set(a, userId);
  refresh.set(r, userId);
  res.setHeader("Set-Cookie", [cookie("access_token", a, 900), cookie("refresh_token", r, 604800, "/api/v1/auth")]);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;
  const cookies = parseCookies(req);

  if (method === "POST" && path === "/__test__/expire-access") {
    access.clear();
    return send(res, 204);
  }
  if (method === "POST" && path === "/auth/login") {
    const body = await readBody(req);
    const user = users.find((u) => u.email === body?.email);
    if (!user || passwords.get(user.id) !== body?.password) return error(res, 401, "Invalid credentials");
    if (!user.isActive) return error(res, 403, "User disabled");
    issueSession(res, user.id);
    return send(res, 200, user);
  }
  if (method === "POST" && path === "/auth/refresh") {
    const userId = refresh.get(cookies.refresh_token);
    const user = users.find((u) => u.id === userId);
    if (!user?.isActive) return error(res, 401, "Invalid refresh token");
    refresh.delete(cookies.refresh_token);
    issueSession(res, user.id);
    return send(res, 204);
  }
  if (method === "POST" && path === "/auth/logout") {
    access.delete(cookies.access_token);
    refresh.delete(cookies.refresh_token);
    res.setHeader("Set-Cookie", [cookie("access_token", "", 0), cookie("refresh_token", "", 0, "/api/v1/auth")]);
    return send(res, 204);
  }

  const me = users.find((u) => u.id === access.get(cookies.access_token));
  if (!me || !me.isActive) return error(res, 401, "Unauthorized");

  if (method === "GET" && path === "/auth/me") return send(res, 200, me);

  if (path === "/users" || path.startsWith("/users/")) {
    if (me.role !== "owner") return error(res, 403, "Forbidden");
    if (method === "GET" && path === "/users") return send(res, 200, users);
    if (method === "POST" && path === "/users") {
      const body = await readBody(req);
      if (users.some((u) => u.email === body.email)) return error(res, 409, "Email exists");
      const user = { id: randomUUID(), email: body.email, fullName: body.fullName, role: body.role, isActive: true };
      users.push(user);
      passwords.set(user.id, body.password);
      return send(res, 201, user);
    }
    const user = users.find((u) => u.id === path.split("/")[2]);
    if (method === "PATCH" && user) {
      const body = await readBody(req);
      const activeOwners = users.filter((u) => u.role === "owner" && u.isActive);
      const demotes = user.role === "owner" && ((body.role && body.role !== "owner") || body.isActive === false);
      if (demotes && activeOwners.length === 1) return error(res, 400, "Last owner");
      Object.assign(user, body);
      if (body.isActive === false) {
        for (const [t, id] of access) if (id === user.id) access.delete(t);
        for (const [t, id] of refresh) if (id === user.id) refresh.delete(t);
      }
      return send(res, 200, user);
    }
    return error(res, 404, "Not found");
  }

  if (path === "/todos") {
    if (method === "GET") return send(res, 200, tasks.filter((t) => canSee(me, t)).map(withRelations));
    if (method === "POST") {
      const body = await readBody(req);
      if (!body?.title) return error(res, 400, "title required");
      if (me.role === "member" && body.assigneeId && body.assigneeId !== me.id) return error(res, 403, "Forbidden");
      const task = makeTask({ ...body, id: randomUUID(), createdById: me.id });
      tasks.push(task);
      return send(res, 201, withRelations(task));
    }
  }
  if (path.startsWith("/todos/")) {
    const task = tasks.find((t) => t.id === path.split("/")[2]);
    if (!task || !canSee(me, task)) return error(res, 404, "Not found");
    if (method === "GET") return send(res, 200, withRelations(task));
    if (method === "PATCH") {
      const body = await readBody(req);
      if (me.role === "member" && body.assigneeId && body.assigneeId !== me.id) return error(res, 403, "Forbidden");
      Object.assign(task, body, { updatedAt: now() });
      return send(res, 200, withRelations(task));
    }
    if (method === "DELETE") {
      if (me.role === "member" && task.createdById !== me.id) return error(res, 403, "Forbidden");
      tasks = tasks.filter((t) => t !== task);
      return send(res, 204);
    }
  }
  return error(res, 404, "Not found");
});

server.listen(PORT, () => console.log(`mock backend listening on http://localhost:${PORT}`));
