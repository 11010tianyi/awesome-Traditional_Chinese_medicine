import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./app", import.meta.url));
const customFormulasPath = join(root, "data", "custom-formulas.json");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function slugify(value) {
  return String(value || "formula")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "formula";
}

async function readCustomFormulas() {
  try {
    return JSON.parse(await readFile(customFormulasPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(join(root, "data"), { recursive: true });
    await writeFile(customFormulasPath, "[]\n");
    return [];
  }
}

async function saveCustomFormula(request, response) {
  try {
    const input = JSON.parse(await readBody(request));
    const name = String(input.name || "").trim();
    const herbs = Array.isArray(input.herbs) ? [...new Set(input.herbs.map((item) => String(item).trim()).filter(Boolean))] : [];
    if (!name) return sendJson(response, 400, { error: "处方名不能为空" });
    if (!herbs.length) return sendJson(response, 400, { error: "处方药味不能为空" });

    const formulas = await readCustomFormulas();
    const existing = formulas.find((formula) => formula.name === name);
    const formula = {
      id: existing?.id || `custom-${Date.now()}-${slugify(name)}`,
      name,
      source: String(input.source || "手动添加").trim() || "手动添加",
      indication: String(input.indication || "自定义处方").trim() || "自定义处方",
      herbs,
      tags: Array.isArray(input.tags) && input.tags.length ? input.tags.map((tag) => String(tag).trim()).filter(Boolean) : ["自定义"],
      custom: true,
      updatedAt: new Date().toISOString()
    };
    const next = existing ? formulas.map((item) => item.id === existing.id ? formula : item) : [...formulas, formula];
    await writeFile(customFormulasPath, `${JSON.stringify(next, null, 2)}\n`);
    sendJson(response, 200, { formula, formulas: next });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

async function handler(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  if (url.pathname === "/api/formulas" && request.method === "GET") {
    return sendJson(response, 200, { formulas: await readCustomFormulas() });
  }
  if (url.pathname === "/api/formulas" && request.method === "POST") {
    return saveCustomFormula(request, response);
  }
  const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(root, safePath === "/" ? "index.html" : safePath);
  const filePath = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, "index.html");
  response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}

async function listen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

for (let port = 4173; port <= 4190; port += 1) {
  try {
    await listen(port);
    console.log(`TCM Insight MVP running at http://127.0.0.1:${port}`);
    break;
  } catch (error) {
    if (error.code !== "EADDRINUSE" || port === 4190) throw error;
  }
}
