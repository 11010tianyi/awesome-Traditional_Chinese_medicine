import http from "node:http";
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./app", import.meta.url));
const enrichScript = fileURLToPath(new URL("./scripts/enrich-go-kegg.R", import.meta.url));
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

function runCommand(command, args, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { timeout: timeoutMs });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function enrichmentStatus() {
  try {
    const check = await runCommand("Rscript", ["-e", "quit(status=if (requireNamespace('clusterProfiler', quietly=TRUE) && requireNamespace('org.Hs.eg.db', quietly=TRUE) && requireNamespace('ggplot2', quietly=TRUE)) 0 else 2)"]);
    if (check.code === 0) {
      return { available: true, engine: "clusterProfiler", organism: "Homo sapiens", reason: "本地服务会调用 R/clusterProfiler 和 org.Hs.eg.db，并用 ggplot2 画出条形图、气泡图和基因重叠网络。" };
    }
    return { available: false, engine: null, reason: "已找到 Rscript，但 clusterProfiler、org.Hs.eg.db 或 ggplot2 未安装。" };
  } catch (error) {
    const missing = error.code === "ENOENT";
    return { available: false, engine: null, reason: missing ? "未安装 Rscript，无法在本地运行 clusterProfiler。" : error.message };
  }
}

function cleanGenes(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter((item) => /^[A-Za-z][A-Za-z0-9.-]{0,31}$/.test(item)))].slice(0, 200);
}

async function runClusterProfiler(genes) {
  const dir = await mkdtemp(join(tmpdir(), "tcm-enrich-"));
  const input = join(dir, "input.json");
  const output = join(dir, "output.json");
  try {
    await writeFile(input, JSON.stringify({ genes }));
    const result = await runCommand("Rscript", [enrichScript, input, output], 180000);
    try {
      return JSON.parse(await readFile(output, "utf8"));
    } catch {
      const detail = `${result.stderr || result.stdout}`.trim().slice(0, 700);
      return { ok: false, error: detail || `Rscript 退出码 ${result.code}` };
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function enrichGenes(request, response) {
  try {
    const input = JSON.parse(await readBody(request));
    const genes = cleanGenes(input.genes);
    if (genes.length < 2) return sendJson(response, 400, { ok: false, error: "至少需要 2 个当前处方里的人类基因符号。" });
    const status = await enrichmentStatus();
    if (!status.available) return sendJson(response, 503, { ok: false, available: false, reason: status.reason });
    const payload = await runClusterProfiler(genes);
    sendJson(response, payload.ok ? 200 : 502, payload);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
}

async function handler(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  if (url.pathname === "/api/enrichment" && request.method === "GET") {
    return sendJson(response, 200, await enrichmentStatus());
  }
  if (url.pathname === "/api/enrichment" && request.method === "POST") {
    return enrichGenes(request, response);
  }
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
