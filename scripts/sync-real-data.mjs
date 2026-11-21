import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  compoundSeeds,
  diseaseSeeds,
  formulaCorrections,
  formulaSeeds,
  herbAnnotations,
  herbSeeds,
  markerLinks,
  pathwaySeeds,
  targetSeeds
} from "./catalog-seeds.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "app", "data");
const cacheDir = path.join(root, "scripts", ".cache", "sync");
const generatedAt = new Date().toISOString();

const HERB_API = "http://herb.ac.cn/chedi/api/";
const ETCM_API = "http://www.tcmip.cn:18124";
const SYMMAP_BASE = "http://www.symmap.org";
const TCMSP_BASE = "https://old.tcmsp-e.com";
const TCMSP_PORTAL = "https://www.tcmsp-e.com";

if (process.argv.includes("--help")) {
  console.log("Usage: npm run sync:data");
  console.log("Merges scripts/catalog-seeds.mjs and refreshes public HERB, SymMap, TCMSP and ETCM ids.");
  process.exit(0);
}

const sourceStatus = [];
const gaps = [];
const fixes = [];
const endpointReport = {
  HERB: { name: "HERB", endpoint: HERB_API, ok: false, checkedAt: generatedAt, note: "尚未成功返回检索表" },
  SymMap: { name: "SymMap", endpoint: `${SYMMAP_BASE}/search/`, ok: false, checkedAt: generatedAt, note: "尚未成功返回检索表" },
  TCMSP: {
    name: "TCMSP",
    endpoint: `${TCMSP_BASE}/tcmspsearch.php`,
    ok: false,
    checkedAt: generatedAt,
    note: `${TCMSP_PORTAL}/tcmspsearch.php 在 2026-11-21 返回门户页，不再是旧检索表格。同步改读遗留站，并使用 tcmsp.php 页面上的公开表单 token。`
  },
  ETCM: { name: "ETCM", endpoint: `${ETCM_API}/home/homeEsSearch/`, ok: false, checkedAt: generatedAt, note: "尚未成功返回检索 JSON" }
};
const failureCount = { HERB: 0, SymMap: 0, TCMSP: 0, ETCM: 0 };
const sourceHealth = { HERB: "unknown", SymMap: "unknown", TCMSP: "unknown", ETCM: "unknown" };
let tcmspToken = "";
let formulaInserts = 0;

const herbQueryMap = {
  金银花: "JIN YIN HUA",
  连翘: "LIAN QIAO",
  薄荷: "BO HE",
  荆芥: "JING JIE",
  牛蒡子: "NIU BANG ZI",
  桔梗: "JIE GENG",
  甘草: "GAN CAO",
  淡豆豉: "DAN DOU CHI",
  竹叶: "ZHU YE",
  芦根: "LU GEN",
  麻黄: "MA HUANG",
  桂枝: "GUI ZHI",
  杏仁: "XING REN",
  白芍: "BAI SHAO",
  生姜: "SHENG JIANG",
  人参: "REN SHEN",
  黄芩: "HUANG QIN",
  黄连: "HUANG LIAN",
  黄芪: "HUANG QI",
  厚朴: "Houpu",
  枳壳: "Zhike",
  五味子: "Beiwuweizi",
  附子: "Fuzi",
  干姜: "Ganjiang",
  细辛: "Xixin",
  黄柏: "Huangbo"
};

function noteGap(message) {
  if (gaps.length < 120) gaps.push(message);
}

function nextId(prefix, rows) {
  let index = rows.length + 1;
  const existing = new Set(rows.map((row) => row.id));
  while (existing.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

function entityKey(entity) {
  return entity.symbol || entity.name;
}

function norm(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function nameKey(value) {
  const stripped = norm(value)
    .replace(/\s*\([^)]*\)\s*$/g, " ")
    .replace(/\s*\[[^\]]*\]\s*$/g, " ");
  return stripped.replace(/[^a-z0-9]+/g, "").replace(/(content|8ci|usan|ban|inn|jan)+$/g, "");
}

function namesMatch(left, right) {
  if (left == null || right == null) return false;
  if (norm(left) === norm(right)) return true;
  const a = nameKey(left);
  const b = nameKey(right);
  return a.length >= 4 && a === b;
}

function namesMatchAny(value, candidates) {
  return candidates.filter(Boolean).some((candidate) => namesMatch(value, candidate));
}

function unionRefs(current = [], incoming = []) {
  const seen = new Map();
  for (const item of [...current, ...incoming]) {
    const key = `${item.url || ""}|${item.title || ""}|${item.source || ""}|${item.item || ""}|${item.doi || ""}`;
    seen.set(key, item);
  }
  return [...seen.values()];
}

function upsertByName(rows, seeds, prefix, normalizeSeed) {
  let inserted = 0;
  for (const seed of seeds) {
    const existing = rows.find((row) => norm(entityKey(row)) === norm(entityKey(seed)));
    if (existing) {
      const normalized = normalizeSeed(seed, existing.id);
      const previousSources = existing.sources || [];
      Object.assign(existing, {
        ...normalized,
        ...existing,
        sources: [...new Set([...(normalized.sources || []), ...previousSources])],
        references: unionRefs(existing.references, normalized.references || seed.references)
      });
      for (const field of ["aliases", "nameAliases", "acceptedSynonyms", "targetLinks", "notes", "caution", "kegg", "url"]) {
        if (existing[field] == null && seed[field] != null) existing[field] = seed[field];
      }
      if (Array.isArray(seed.aliases) && (!existing.aliases || existing.aliases.length === 0)) existing.aliases = seed.aliases;
      if (Array.isArray(seed.nameAliases)) existing.nameAliases = [...new Set([...(existing.nameAliases || []), ...seed.nameAliases])];
      if (Array.isArray(seed.acceptedSynonyms)) {
        existing.acceptedSynonyms = [...new Set([...(existing.acceptedSynonyms || []), ...seed.acceptedSynonyms])];
      }
      if (Array.isArray(seed.targetLinks) && !existing.targetLinks) existing.targetLinks = seed.targetLinks;
      continue;
    }
    rows.push(normalizeSeed(seed, nextId(prefix, rows)));
    inserted += 1;
  }
  return inserted;
}

function applyCatalogSeeds({ formulas, herbs, compounds, targets }) {
  const formulaInserted = upsertByName(formulas, formulaSeeds, "f", (seed, id) => ({
    id,
    source: seed.source || "扩展种子目录",
    indication: seed.indication || "待补充",
    herbs: seed.herbs || [],
    tags: seed.tags || ["扩展"],
    sources: ["经典方书", "ETCM"],
    externalIds: {},
    sourceDetails: {},
    ...seed
  }));
  upsertByName(herbs, herbSeeds, "h", (seed, id) => ({
    id,
    nature: seed.nature || "待补充",
    flavors: seed.flavors || [],
    meridians: seed.meridians || [],
    effects: seed.effects || [],
    compounds: [],
    sources: seed.sources || ["HERB"],
    externalIds: {},
    sourceDetails: {},
    ...seed
  }));
  upsertByName(compounds, compoundSeeds, "c", (seed, id) => ({
    id,
    cn: seed.cn || seed.name,
    ob: seed.ob ?? null,
    dl: seed.dl ?? null,
    targets: seed.targets || {},
    externalIds: {},
    sourceDetails: {},
    ...seed
  }));
  upsertByName(targets, targetSeeds, "t", (seed, id) => ({
    id,
    pathways: seed.pathways || [],
    diseases: seed.diseases || [],
    externalIds: {},
    sourceDetails: {},
    ...seed
  }));
  formulaInserts = formulaInserted;
}

function mergeCatalogRows(rows, seeds, prefix) {
  let inserted = 0;
  for (const seed of seeds) {
    const existing = rows.find((row) => (seed.id && row.id === seed.id) || norm(row.name) === norm(seed.name));
    if (!existing) {
      rows.push({ id: seed.id || nextId(prefix, rows), score: null, ...seed });
      inserted += 1;
      continue;
    }
    for (const [key, value] of Object.entries(seed)) {
      if (key === "id") continue;
      if (existing[key] == null || existing[key] === "" || (Array.isArray(existing[key]) && existing[key].length === 0 && Array.isArray(value) && value.length)) {
        existing[key] = value;
      }
    }
    if (seed.references) existing.references = unionRefs(existing.references, seed.references);
  }
  return inserted;
}

function applyCorrections(formulas) {
  for (const correction of formulaCorrections) {
    const formula = formulas.find((item) => item.name === correction.name);
    if (!formula) continue;
    const before = (formula.herbs || []).join("、");
    const after = correction.herbs.join("、");
    formula.herbs = correction.herbs;
    if (correction.notes && !String(formula.notes || "").includes(correction.notes)) {
      formula.notes = [formula.notes, correction.notes].filter(Boolean).join(" ");
    }
    formula.references = unionRefs(formula.references, correction.references);
    if (before !== after) fixes.push(`${correction.name} 药味由「${before}」改为「${after}」。`);
  }
}

function applyHerbAnnotations(herbs) {
  for (const note of herbAnnotations) {
    const herb = herbs.find((item) => item.name === note.name);
    if (!herb) continue;
    if (note.caution) herb.caution = note.caution;
    if (note.notes && !String(herb.notes || "").includes(note.notes)) herb.notes = [herb.notes, note.notes].filter(Boolean).join(" ");
    if (note.nameAliases) herb.nameAliases = [...new Set([...(herb.nameAliases || []), ...note.nameAliases])];
    herb.references = unionRefs(herb.references, note.references);
  }
}

function applyMarkerLinks(herbs, compounds) {
  const byName = new Map(compounds.map((compound) => [norm(compound.name), compound]));
  for (const link of markerLinks) {
    const herb = herbs.find((item) => item.name === link.herb);
    if (!herb) {
      noteGap(`药材「${link.herb}」不在目录，未挂接成分。`);
      continue;
    }
    herb.compounds ||= [];
    for (const compoundName of link.compounds) {
      const compound = byName.get(norm(compoundName));
      if (!compound) {
        noteGap(`成分「${compoundName}」不在目录，未挂到${link.herb}。`);
        continue;
      }
      if (!herb.compounds.includes(compound.id)) herb.compounds.push(compound.id);
    }
  }
}

function applyTargetLinks(compounds, targets) {
  const bySymbol = new Map(targets.map((target) => [target.symbol, target]));
  for (const compound of compounds) {
    compound.targets ||= {};
    for (const link of compound.targetLinks || []) {
      const target = bySymbol.get(link.symbol);
      if (!target) {
        noteGap(`靶点 ${link.symbol} 不在目录，未写入${compound.name}。`);
        continue;
      }
      if (compound.targets[target.id] == null) compound.targets[target.id] = link.score;
    }
  }
}

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf8"));
}

async function writeJson(filename, value) {
  await fs.writeFile(path.join(dataDir, filename), `${JSON.stringify(value, null, 2)}\n`);
}

function cacheFile(key) {
  const digest = crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
  return path.join(cacheDir, `${digest}.txt`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = Object.fromEntries(
      Object.entries({
        "User-Agent": "Mozilla/5.0 research catalog sync",
        Accept: "application/json,text/html,*/*",
        ...(options.headers || {})
      }).filter(([, value]) => value !== undefined)
    );
    const response = await fetch(url, { ...options, signal: controller.signal, headers });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 160)}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCached(key, loader) {
  const file = cacheFile(key);
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    const text = await loader();
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(file, text);
    return text;
  }
}

function isTransportError(error) {
  return /abort|timeout|econn|enotfound|eai_again|fetch failed|network|socket|502|503|504/i.test(String(error?.message || error));
}

function markFailure(source, error) {
  const message = String(error?.message || error);
  if (/no result grid/i.test(message)) return;
  if (!isTransportError(error) && !/token not found/i.test(message)) return;
  failureCount[source] += 1;
  if (failureCount[source] >= 3) {
    sourceHealth[source] = "down";
    endpointReport[source].ok = false;
    endpointReport[source].note = `${endpointReport[source].note} 本轮连续失败后停止请求：${error.message}`;
  }
}

function markSuccess(source, note) {
  sourceHealth[source] = "up";
  endpointReport[source].ok = true;
  endpointReport[source].checkedAt = generatedAt;
  if (note) endpointReport[source].note = note;
}

async function postJson(url, body, timeoutMs, cacheKey) {
  const text = await fetchCached(cacheKey, () => fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: url.includes("herb.ac.cn") ? "http://herb.ac.cn/Search/" : undefined
    },
    body: JSON.stringify(body)
  }, timeoutMs));
  try {
    return JSON.parse(text);
  } catch (error) {
    await fs.rm(cacheFile(cacheKey), { force: true });
    throw error;
  }
}

async function postForm(url, fields, timeoutMs, cacheKey) {
  const body = new URLSearchParams(fields);
  const text = await fetchCached(cacheKey, () => fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: `${SYMMAP_BASE}/search/`
    },
    body
  }, timeoutMs));
  return JSON.parse(text);
}

function scalar(value) {
  if (value && typeof value === "object" && "title" in value) return value.title;
  return value;
}

function parseTable(resData) {
  if (!Array.isArray(resData) || !Array.isArray(resData[0])) return [];
  const headers = resData[0];
  return resData.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, scalar(row[index])])));
}

function herbCandidates(herb) {
  return [...new Set([herb.name, ...(herb.nameAliases || []), herbQueryMap[herb.name], herb.pinyin].filter(Boolean))];
}

function hasExternalId(entity, source) {
  const value = entity.externalIds?.[source];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function countExternal(rows, source) {
  return rows.filter((row) => hasExternalId(row, source)).length;
}

async function herbSearch(keyword, label) {
  const data = await postJson(HERB_API, { func_name: "search_api", keyword, label }, 15000, `herb:${label}:${keyword}`);
  markSuccess("HERB", "公开前端 JSON 仍返回 Herb/Ingredient/Target 表格。匹配要求中文名、拼音或成分名精确相等，不再取第一行。");
  return parseTable(data.res_data);
}

async function syncSymMap(tableName, key) {
  const data = await postForm(`${SYMMAP_BASE}/search/`, { table_name: tableName, key }, 15000, `symmap:${tableName}:${key}`);
  markSuccess("SymMap", "表单检索仍返回 data/columns。药材优先用中文名；紧凑拼音常无结果，适配器会再试中文名和带空格拼音。");
  return data;
}

async function syncEtcmSearch(searchText) {
  const cacheKey = `etcm:${searchText}`;
  const data = await postJson(`${ETCM_API}/home/homeEsSearch/`, { search_text: searchText, type: "search" }, 15000, cacheKey);
  if (!Array.isArray(data.result) || /fail/i.test(String(data.msg || ""))) {
    await fs.rm(cacheFile(cacheKey), { force: true });
    throw new Error(`ETCM search failed: ${data.msg || "empty result"}`);
  }
  markSuccess("ETCM", "homeEsSearch 仍返回分组 options。只保留药材或方剂分组里的精确拼音命中，不再把中成药自动补全写进外部 ID。Search failed 会丢弃缓存并不覆盖已有 ID。");
  return data;
}

function parseTcmspGridData(html) {
  const empty = html.match(/data:\s*null\b/);
  const match = html.match(/data:\s*\[/);
  if (empty && (!match || empty.index < match.index)) return [];
  if (!match) throw new Error("TCMSP page has no result grid");
  const arrayStart = match.index + match[0].length - 1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < html.length; index += 1) {
    const char = html[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return JSON.parse(html.slice(arrayStart, index + 1));
  }
  throw new Error("TCMSP result grid was truncated");
}

async function getTcmspToken(force = false) {
  if (tcmspToken && !force) return tcmspToken;
  const html = await fetchWithTimeout(`${TCMSP_BASE}/tcmsp.php`, {
    headers: { Referer: `${TCMSP_BASE}/tcmsp.php` }
  }, 20000);
  const match = html.match(/name="token" value="([a-f0-9]+)"/);
  if (!match) throw new Error("TCMSP public form token not found");
  tcmspToken = match[1];
  return tcmspToken;
}

async function syncTcmsp(qs, q, attempt = 0) {
  const token = await getTcmspToken(attempt > 0);
  const url = `${TCMSP_BASE}/tcmspsearch.php?${new URLSearchParams({ qs, q, token })}`;
  const key = `tcmsp:${qs}:${q}`;
  const html = await fetchCached(key, () => fetchWithTimeout(url, {
    headers: { Referer: `${TCMSP_BASE}/tcmsp.php` }
  }, 20000));
  try {
    const rows = parseTcmspGridData(html);
    markSuccess("TCMSP", endpointReport.TCMSP.note);
    return rows;
  } catch (error) {
    await fs.rm(cacheFile(key), { force: true });
    if (attempt === 0) {
      tcmspToken = "";
      return syncTcmsp(qs, q, 1);
    }
    throw error;
  }
}

function moleculeCandidates(compound) {
  return [...new Set([compound.name, ...(compound.acceptedSynonyms || [])].filter(Boolean))];
}

function moleculeRowMatches(compound, row) {
  return namesMatchAny(row?.molecule_synonyms, moleculeCandidates(compound));
}

function targetCandidates(target) {
  return [...new Set([target.symbol, target.name, ...(target.aliases || [])].filter(Boolean))];
}

function targetRowMatches(target, row) {
  return namesMatchAny(row?.target_name, targetCandidates(target));
}

function herbRowMatches(herb, row) {
  const names = [herb.name, ...(herb.nameAliases || [])];
  const chinese = row?.herb_cn_name || row?.["Herb Chinese name"];
  return names.some((name) => norm(chinese) === norm(name));
}

function preferHerbRow(herb, rows) {
  const own = rows.filter((row) => norm(row?.herb_cn_name || row?.["Herb Chinese name"]) === norm(herb.name));
  const exact = own.length ? own : rows.filter((row) => herbRowMatches(herb, row));
  const pinyinKeys = [herb.pinyin, herbQueryMap[herb.name]].filter(Boolean).map((value) => nameKey(value));
  return exact.find((row) => pinyinKeys.includes(nameKey(row.herb_pinyin || row["Herb pinyin name"]))) || exact[0];
}

function sourceAvailable(source) {
  return sourceHealth[source] !== "down";
}

async function runSource(source, action) {
  if (!sourceAvailable(source)) {
    const error = new Error(`${source} unreachable in this run`);
    error.skipped = true;
    throw error;
  }
  try {
    return await action();
  } catch (error) {
    markFailure(source, error);
    throw error;
  }
}

function rememberRejection(entity, source, previous, note) {
  entity.externalIds ||= {};
  delete entity.externalIds[source];
  entity.sourceDetails[source] = {
    unmatched: true,
    note,
    previous: previous || undefined
  };
}

async function enrichHerbs(herbs) {
  let herbHits = 0;
  let symMapHits = 0;
  let tcmspHits = 0;
  let etcmHits = 0;
  let index = 0;

  for (const herb of herbs) {
    index += 1;
    herb.externalIds ||= {};
    herb.sourceDetails ||= {};
    if (index % 20 === 0) console.log(`herbs ${index}/${herbs.length}`);

    const storedHerbName = herb.sourceDetails.HERB?.chinese;
    const acceptedHerbNames = [herb.name, ...(herb.nameAliases || [])];
    const storedHerbAccepted = storedHerbName && acceptedHerbNames.some((name) => norm(name) === norm(storedHerbName));
    if (!hasExternalId(herb, "HERB") || (storedHerbName && !storedHerbAccepted)) {
      try {
        let hit;
        for (const keyword of herbCandidates(herb)) {
          const rows = await runSource("HERB", () => herbSearch(keyword, "Herb"));
          hit = preferHerbRow(herb, rows);
          if (hit) break;
        }
        if (hit) {
          const previousId = herb.externalIds.HERB;
          herb.externalIds.HERB = hit["Herb id"];
          herb.sourceDetails.HERB = {
            herbId: hit["Herb id"],
            pinyin: hit["Herb pinyin name"],
            chinese: hit["Herb Chinese name"],
            english: hit["Herb English name"],
            latin: hit["Herb Latin name"],
            url: `http://herb.ac.cn/Detail/?v=${hit["Herb id"]}&label=Herb`
          };
          herb.sources = [...new Set([...(herb.sources || []), "HERB"])];
          if (previousId !== hit["Herb id"]) herbHits += 1;
        } else if (storedHerbName && !storedHerbAccepted) {
          const previous = herb.externalIds.HERB;
          rememberRejection(herb, "HERB", { id: previous, chinese: storedHerbName }, "HERB 没有与药材中文名或已声明异名精确相等的行，已去掉同音或异名误配。");
          fixes.push(`${herb.name} 去掉 HERB ${previous}（${storedHerbName}），因为中文名不精确。`);
        }
      } catch (error) {
        if (!error.skipped) herb.sourceDetails.HERB = { error: error.message };
      }
    }

    if (!hasExternalId(herb, "SymMap")) {
      try {
        let hit;
        for (const keyword of herbCandidates(herb)) {
          const data = await runSource("SymMap", () => syncSymMap("Herb", keyword));
          hit = (data.data || []).find((row) => herbRowMatches(herb, { herb_cn_name: row.Chinese_name }));
          if (hit) break;
        }
        if (hit) {
          herb.externalIds.SymMap = hit.Herb_id;
          herb.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${hit.Herb_id}` };
          herb.sources = [...new Set([...(herb.sources || []), "SymMap"])];
          symMapHits += 1;
        }
      } catch (error) {
        if (!error.skipped) herb.sourceDetails.SymMap = { error: error.message };
      }
    }

    const tcmspHerbOk = herbRowMatches(herb, herb.sourceDetails.TCMSP || {});
    if (!hasExternalId(herb, "TCMSP") || !tcmspHerbOk) {
      try {
        let hit;
        for (const keyword of herbCandidates(herb)) {
          const rows = await runSource("TCMSP", () => syncTcmsp("herb_all_name", keyword));
          hit = preferHerbRow(herb, rows);
          if (hit) break;
        }
        const previous = herb.externalIds.TCMSP;
        if (hit) {
          herb.externalIds.TCMSP = hit.herb_en_name || hit.herb_pinyin;
          herb.sourceDetails.TCMSP = hit;
          herb.sources = [...new Set([...(herb.sources || []), "TCMSP"])];
          tcmspHits += 1;
        } else if (previous && !tcmspHerbOk) {
          rememberRejection(herb, "TCMSP", previous, "重新检索后没有与中文名精确相等的 TCMSP 药材行。");
        }
      } catch (error) {
        if (!error.skipped && !hasExternalId(herb, "TCMSP")) herb.sourceDetails.TCMSP = { error: error.message };
      }
    }

    if (!hasExternalId(herb, "ETCM") || herb.sourceDetails.ETCM?.unmatched !== false) {
      try {
        let hit;
        let sawSuccess = false;
        let lastError;
        for (const keyword of [herb.pinyin, herbQueryMap[herb.name], ...(herb.nameAliases || []), herb.name].filter(Boolean)) {
          try {
            const data = await runSource("ETCM", () => syncEtcmSearch(String(keyword).toLowerCase()));
            sawSuccess = true;
            const groups = Array.isArray(data.result) ? data.result : [];
            const options = groups.filter((group) => group.label === "herb").flatMap((group) => group.options || []);
            hit = options.find((option) => namesMatch(option.value, herb.pinyin) || namesMatchAny(option.value, herb.nameAliases || []));
            if (hit) break;
          } catch (error) {
            if (error.skipped) throw error;
            lastError = error;
          }
        }
        if (hit) {
          herb.externalIds.ETCM = [hit.label];
          herb.sourceDetails.ETCM = { unmatched: false, matches: [hit] };
          herb.sources = [...new Set([...(herb.sources || []), "ETCM"])];
          etcmHits += 1;
        } else if (sawSuccess) {
          const previous = herb.externalIds.ETCM;
          if (previous) {
            rememberRejection(herb, "ETCM", previous, "ETCM 药材分组没有与拼音精确相等的命中，已去掉非精确 ID。");
          } else {
            herb.sourceDetails.ETCM = { unmatched: true, note: "ETCM 药材自动补全没有与拼音精确相等的命中。" };
          }
        } else if (lastError && !hasExternalId(herb, "ETCM")) {
          herb.sourceDetails.ETCM = { error: lastError.message };
        }
      } catch (error) {
        if (!error.skipped && !hasExternalId(herb, "ETCM")) herb.sourceDetails.ETCM = { error: error.message };
      }
    }
  }

  sourceStatus.push({ source: "HERB", entity: "herbs", matched: countExternal(herbs, "HERB"), total: herbs.length, refreshed: herbHits });
  sourceStatus.push({ source: "SymMap", entity: "herbs", matched: countExternal(herbs, "SymMap"), total: herbs.length, refreshed: symMapHits });
  sourceStatus.push({ source: "TCMSP", entity: "herbs", matched: countExternal(herbs, "TCMSP"), total: herbs.length, refreshed: tcmspHits });
  sourceStatus.push({ source: "ETCM", entity: "herbs", matched: countExternal(herbs, "ETCM"), total: herbs.length, refreshed: etcmHits });
}

async function enrichCompounds(compounds) {
  let herbHits = 0;
  let symMapHits = 0;
  let tcmspHits = 0;

  for (const compound of compounds) {
    compound.externalIds ||= {};
    compound.sourceDetails ||= {};

    if (!hasExternalId(compound, "HERB")) {
      try {
        let hit;
        for (const keyword of moleculeCandidates(compound)) {
          const rows = await runSource("HERB", () => herbSearch(keyword, "Ingredient"));
          hit = rows.find((row) => namesMatchAny(row["Ingredient name"], moleculeCandidates(compound)));
          if (hit) break;
        }
        if (hit) {
          compound.externalIds.HERB = hit["Ingredient id"];
          compound.sourceDetails.HERB = {
            ingredientId: hit["Ingredient id"],
            name: hit["Ingredient name"],
            alias: String(hit.Alias || "").slice(0, 400),
            url: `http://herb.ac.cn/Detail/?v=${hit["Ingredient id"]}&label=Ingredient`
          };
          herbHits += 1;
        }
      } catch (error) {
        if (!error.skipped) compound.sourceDetails.HERB = { error: error.message };
      }
    }

    if (!hasExternalId(compound, "SymMap")) {
      try {
        let hit;
        for (const keyword of moleculeCandidates(compound)) {
          const data = await runSource("SymMap", () => syncSymMap("Mol", keyword));
          hit = (data.data || []).find((row) => namesMatchAny(row.Molecule_name, moleculeCandidates(compound)));
          if (hit) break;
        }
        if (hit) {
          const molId = hit.Mol_id || hit.MOL_id;
          compound.externalIds.SymMap = molId;
          compound.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${molId}` };
          if ((compound.ob == null || compound.ob === "") && hit.OB_score != null && Number.isFinite(Number(hit.OB_score))) {
            compound.ob = Math.round(Number(hit.OB_score) * 10) / 10;
            compound.obSource = "SymMap";
          }
          symMapHits += 1;
        }
      } catch (error) {
        if (!error.skipped) compound.sourceDetails.SymMap = { error: error.message };
      }
    }

    const tcmspOk = moleculeRowMatches(compound, compound.sourceDetails.TCMSP || {});
    if (!hasExternalId(compound, "TCMSP") || !tcmspOk) {
      try {
        let hit;
        let sawGrid = false;
        for (const keyword of moleculeCandidates(compound)) {
          try {
            const rows = await runSource("TCMSP", () => syncTcmsp("molecule_name", keyword));
            sawGrid = true;
            hit = rows.find((row) => moleculeRowMatches(compound, row));
            if (hit) break;
          } catch (error) {
            if (error.skipped) throw error;
          }
        }
        const previous = { id: compound.externalIds.TCMSP, synonym: compound.sourceDetails.TCMSP?.molecule_synonyms };
        if (hit) {
          if (previous.id && previous.id !== hit.MOL_ID) {
            fixes.push(`${compound.name} 的 TCMSP 成分由 ${previous.id}（${previous.synonym || "无同义词"}）改为 ${hit.MOL_ID}（${hit.molecule_synonyms}）。`);
          }
          compound.externalIds.TCMSP = hit.MOL_ID || hit.molecule_ID || hit.molecule_synonyms;
          compound.sourceDetails.TCMSP = hit;
          tcmspHits += 1;
        } else if (sawGrid && previous.id) {
          rememberRejection(compound, "TCMSP", previous, "重新检索后没有与成分名或已声明同义词精确相等的 TCMSP 行，已去掉原先的非精确命中。");
          fixes.push(`${compound.name} 去掉不精确的 TCMSP 成分 ${previous.id}（${previous.synonym || "无同义词"}）。`);
        } else if (sawGrid && !previous.id) {
          compound.sourceDetails.TCMSP = { unmatched: true, note: "TCMSP 成分表没有精确同义词。" };
        }
      } catch (error) {
        if (!error.skipped && !hasExternalId(compound, "TCMSP")) compound.sourceDetails.TCMSP = { error: error.message };
      }
    }
  }

  sourceStatus.push({ source: "HERB", entity: "compounds", matched: countExternal(compounds, "HERB"), total: compounds.length, refreshed: herbHits });
  sourceStatus.push({ source: "SymMap", entity: "compounds", matched: countExternal(compounds, "SymMap"), total: compounds.length, refreshed: symMapHits });
  sourceStatus.push({ source: "TCMSP", entity: "compounds", matched: countExternal(compounds, "TCMSP"), total: compounds.length, refreshed: tcmspHits });
}

async function enrichTargets(targets) {
  let herbHits = 0;
  let symMapHits = 0;
  let tcmspHits = 0;

  for (const target of targets) {
    target.externalIds ||= {};
    target.sourceDetails ||= {};

    if (!hasExternalId(target, "HERB")) {
      try {
        let hit;
        for (const keyword of [target.symbol, target.name].filter(Boolean)) {
          const rows = await runSource("HERB", () => herbSearch(keyword, "Target"));
          hit = rows.find((row) => norm(row["Gene name"]) === norm(target.symbol));
          if (hit) break;
        }
        if (hit) {
          target.externalIds.HERB = hit["Target id"];
          target.sourceDetails.HERB = {
            targetId: hit["Target id"],
            geneName: hit["Gene name"],
            alias: hit["Gene alias"],
            url: `http://herb.ac.cn/Detail/?v=${hit["Target id"]}&label=Target`
          };
          herbHits += 1;
        }
      } catch (error) {
        if (!error.skipped) target.sourceDetails.HERB = { error: error.message };
      }
    }

    if (!hasExternalId(target, "SymMap")) {
      try {
        const data = await runSource("SymMap", () => syncSymMap("Gene", target.symbol));
        const hit = (data.data || []).find((row) => row.Gene_symbol === target.symbol);
        if (hit) {
          target.externalIds.SymMap = hit.Gene_id;
          target.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${hit.Gene_id}` };
          symMapHits += 1;
        }
      } catch (error) {
        if (!error.skipped) target.sourceDetails.SymMap = { error: error.message };
      }
    }

    const tcmspOk = targetRowMatches(target, target.sourceDetails.TCMSP || {});
    if (!hasExternalId(target, "TCMSP") || !tcmspOk) {
      try {
        let hit;
        let sawGrid = false;
        for (const keyword of targetCandidates(target)) {
          try {
            const rows = await runSource("TCMSP", () => syncTcmsp("target_name", keyword));
            sawGrid = true;
            hit = rows.find((row) => targetRowMatches(target, row));
            if (hit) break;
          } catch (error) {
            if (error.skipped) throw error;
          }
        }
        const previous = { id: target.externalIds.TCMSP, name: target.sourceDetails.TCMSP?.target_name };
        if (hit) {
          if (previous.id && previous.name && !targetRowMatches(target, { target_name: previous.name })) {
            fixes.push(`${target.symbol} 的 TCMSP 靶点由「${previous.name}」改为「${hit.target_name}」。`);
          }
          target.externalIds.TCMSP = hit.target_ID || hit.TAR_ID || target.symbol;
          target.sourceDetails.TCMSP = hit;
          tcmspHits += 1;
        } else if (sawGrid && previous.id) {
          rememberRejection(target, "TCMSP", previous, "重新检索后没有与基因符号或已核对蛋白名精确相等的 TCMSP 靶点。");
          fixes.push(`${target.symbol} 去掉不精确的 TCMSP 靶点「${previous.name || previous.id}」。`);
        } else if (sawGrid) {
          target.sourceDetails.TCMSP = { unmatched: true, note: "TCMSP 靶点表没有与符号或已核对蛋白名精确相等的行。" };
        }
      } catch (error) {
        if (!error.skipped && !hasExternalId(target, "TCMSP")) target.sourceDetails.TCMSP = { error: error.message };
      }
    }
  }

  sourceStatus.push({ source: "HERB", entity: "targets", matched: countExternal(targets, "HERB"), total: targets.length, refreshed: herbHits });
  sourceStatus.push({ source: "SymMap", entity: "targets", matched: countExternal(targets, "SymMap"), total: targets.length, refreshed: symMapHits });
  sourceStatus.push({ source: "TCMSP", entity: "targets", matched: countExternal(targets, "TCMSP"), total: targets.length, refreshed: tcmspHits });
}

function formulaQueries(formula) {
  const pinyin = formula.pinyin || "";
  const spaced = pinyin.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  return [...new Set([pinyin.toLowerCase(), spaced.replace(/\s+/g, ""), spaced, formula.name].filter(Boolean))];
}

async function enrichFormulas(formulas) {
  let etcmHits = 0;
  for (const formula of formulas) {
    formula.externalIds ||= {};
    formula.sourceDetails ||= {};
    formula.sources ||= ["经典方书"];
    try {
      let hits = [];
      let sawSuccess = false;
      let lastError;
      for (const keyword of formulaQueries(formula)) {
        try {
          const data = await runSource("ETCM", () => syncEtcmSearch(keyword));
          sawSuccess = true;
          const groups = Array.isArray(data.result) ? data.result : [];
          const options = groups
            .filter((group) => group.label === "traditional_chinese_medicine_formula")
            .flatMap((group) => group.options || []);
          hits = options.filter((option) => formula.pinyin && namesMatch(option.value, formula.pinyin));
          if (hits.length) break;
        } catch (error) {
          if (error.skipped) throw error;
          lastError = error;
        }
      }
      if (hits.length) {
        const nextIds = hits.map((item) => item.label);
        const changed = JSON.stringify(formula.externalIds.ETCM || []) !== JSON.stringify(nextIds);
        formula.externalIds.ETCM = nextIds;
        formula.sourceDetails.ETCM = { unmatched: false, matches: hits };
        formula.sources = [...new Set([...(formula.sources || []), "ETCM"])];
        if (changed) etcmHits += 1;
      } else if (sawSuccess) {
        const previous = formula.externalIds.ETCM;
        if (previous) noteGap(`${formula.name} 的 ETCM 没有与拼音精确相等的方剂，已去掉原先的自动补全 ID。`);
        rememberRejection(formula, "ETCM", previous, "ETCM 方剂自动补全没有与拼音精确相等的方剂。中成药命中不再写入。");
      } else if (lastError && !hasExternalId(formula, "ETCM")) {
        formula.sourceDetails.ETCM = { error: lastError.message };
      }
    } catch (error) {
      if (!error.skipped && !hasExternalId(formula, "ETCM")) formula.sourceDetails.ETCM = { error: error.message };
    }
  }

  sourceStatus.push({ source: "ETCM", entity: "formulas", matched: countExternal(formulas, "ETCM"), total: formulas.length, refreshed: etcmHits });
  sourceStatus.push({ source: "Classic texts", entity: "formulas", matched: formulas.length, total: formulas.length, refreshed: formulaInserts });
}

async function buildSources() {
  let etcmHome = null;
  try {
    const text = await fetchCached("etcm-home", () => fetchWithTimeout(`${ETCM_API}/home/home_data/`, {}, 15000));
    etcmHome = JSON.parse(text);
    markSuccess("ETCM", endpointReport.ETCM.note);
  } catch (error) {
    etcmHome = { error: error.message };
    markFailure("ETCM", error);
  }

  return [
    {
      name: "TCMSP",
      fullName: "Traditional Chinese Medicine Systems Pharmacology Database and Analysis Platform",
      baseUrl: TCMSP_BASE,
      integration: "Legacy HTML grid at old.tcmsp-e.com. The public form token is read from tcmsp.php on each run.",
      endpoint: `${TCMSP_BASE}/tcmspsearch.php`,
      portal: TCMSP_PORTAL,
      status: sourceStatus.filter((item) => item.source === "TCMSP"),
      check: endpointReport.TCMSP
    },
    {
      name: "HERB",
      fullName: "High-throughput Experiment- and Reference-guided database of TCM",
      baseUrl: "http://herb.ac.cn/",
      integration: "JSON endpoint used by the public HERB frontend",
      endpoint: HERB_API,
      status: sourceStatus.filter((item) => item.source === "HERB"),
      check: endpointReport.HERB
    },
    {
      name: "ETCM",
      fullName: "The Encyclopedia of Traditional Chinese Medicine v2.0",
      baseUrl: "http://www.tcmip.cn/ETCM2/front/#/",
      integration: "ETCM2 JSON endpoints discovered from the public frontend",
      endpoint: `${ETCM_API}/home/homeEsSearch/`,
      homeStats: etcmHome?.data || null,
      status: sourceStatus.filter((item) => item.source === "ETCM"),
      check: endpointReport.ETCM
    },
    {
      name: "SymMap",
      fullName: "Symptom Mapping database of Traditional Chinese Medicine",
      baseUrl: SYMMAP_BASE,
      integration: "Form POST endpoints used by the public SymMap search page",
      endpoint: `${SYMMAP_BASE}/search/`,
      status: sourceStatus.filter((item) => item.source === "SymMap"),
      check: endpointReport.SymMap
    }
  ];
}

const formulas = await readJson("formulas.json");
const herbs = await readJson("herbs.json");
const compounds = await readJson("compounds.json");
const targets = await readJson("targets.json");
const pathways = await readJson("pathways.json");
const diseases = await readJson("diseases.json");

const baseline = {
  asOf: "2026-05-16",
  formulas: 25,
  herbs: 58,
  compounds: 32,
  targets: 24,
  pathways: 6,
  diseases: 5
};

applyCatalogSeeds({ formulas, herbs, compounds, targets });
applyCorrections(formulas);
applyHerbAnnotations(herbs);
const pathwayInserts = mergeCatalogRows(pathways, pathwaySeeds, "p");
const diseaseInserts = mergeCatalogRows(diseases, diseaseSeeds, "d");
applyMarkerLinks(herbs, compounds);
applyTargetLinks(compounds, targets);

await enrichFormulas(formulas);
await enrichHerbs(herbs);
await enrichCompounds(compounds);
await enrichTargets(targets);

const sources = await buildSources();
const unmatchedFormulas = formulas.filter((formula) => !hasExternalId(formula, "ETCM")).map((formula) => formula.name);
if (unmatchedFormulas.length) noteGap(`ETCM 没有精确方剂命中：${unmatchedFormulas.join("、")}`);
const unmatchedTcmspCompounds = compounds.filter((compound) => !hasExternalId(compound, "TCMSP")).map((compound) => compound.name);
if (unmatchedTcmspCompounds.length) noteGap(`TCMSP 没有精确成分同义词：${unmatchedTcmspCompounds.join("、")}`);
const unmatchedTcmspTargets = targets.filter((target) => !hasExternalId(target, "TCMSP")).map((target) => target.symbol);
if (unmatchedTcmspTargets.length) noteGap(`TCMSP 没有精确靶点名：${unmatchedTcmspTargets.join("、")}`);
const herbSourceGaps = herbs
  .map((herb) => {
    const missing = ["HERB", "SymMap", "TCMSP", "ETCM"].filter((source) => !hasExternalId(herb, source));
    return missing.length ? `${herb.name}（${missing.join("/")}）` : "";
  })
  .filter(Boolean);
if (herbSourceGaps.length) noteGap(`药材仍缺来源 ID：${herbSourceGaps.join("、")}`);

const downSources = Object.entries(sourceHealth).filter(([, state]) => state === "down").map(([name]) => name);
const syncStatus = {
  generatedAt,
  verifiedAt: generatedAt,
  note: "2026-11-21 重新核对公开接口后的目录快照。已有精确外部 ID 会保留；TCMSP 非精确同义词和 ETCM 中成药自动补全会在检索成功时改写。成分-靶点分数 70 只是已引用关联的显示权重。",
  summary: sourceStatus,
  catalogCounts: {
    formulas: formulas.length,
    herbs: herbs.length,
    compounds: compounds.length,
    targets: targets.length,
    pathways: pathways.length,
    diseases: diseases.length
  },
  baseline,
  expansionSinceBaseline: {
    formulas: formulas.length - baseline.formulas,
    herbs: herbs.length - baseline.herbs,
    compounds: compounds.length - baseline.compounds,
    targets: targets.length - baseline.targets,
    pathways: pathways.length - baseline.pathways,
    diseases: diseases.length - baseline.diseases
  },
  insertedThisRun: {
    formulas: formulaInserts,
    pathways: pathwayInserts,
    diseases: diseaseInserts
  },
  endpoints: sources.map(({ name, endpoint, integration }) => ({ name, endpoint, integration })),
  endpointChecks: Object.values(endpointReport),
  fixes,
  corrections: [
    "2026-11-21 核对：www.tcmsp-e.com/tcmspsearch.php 已是门户页。检索改到 https://old.tcmsp-e.com ，公开表单 token 每次从 tcmsp.php 读取，不保存登录密钥。",
    "TCMSP 空表是 data: null。解析器把它当作空结果，不再误读后面的 columns。",
    "HERB、SymMap、TCMSP、ETCM 都不再取检索第一行。成分同义词和靶点名必须与名称或已声明异名精确相等。",
    "据此修正了此前的误配，包括小檗碱不再使用四氢小檗碱、肉桂醛改为反式 CINNAMALDEHYDE（MOL000991）、TNF 不再指向 TNF receptor-associated factor 2。",
    "ETCM 只保留药材或方剂分组里的精确拼音，不再把中成药自动补全写进外部 ID。",
    "桂枝汤补入大枣；四君子汤补回白术、茯苓；黄连解毒汤改为黄连、黄芩、黄柏、栀子。",
    "竹叶不再误配同音的猪靥。藿香只接受 HERB 异体字霍香，不把它写成广藿香。"
  ],
  gaps,
  fallbacks: [
    "TCMSP 当前检索入口是 https://old.tcmsp-e.com ，token 来自公开搜索表单，不是登录密钥。",
    "来源连续无法连接时，本轮停止该来源的后续请求，并保留已经写好的外部 ID。",
    "原始响应缓存在 scripts/.cache/sync/，不提交。",
    "新成分只有在 SymMap 成分名精确命中时才回填 OB；DL 没有公开返回就不填。",
    "清营汤保留历史药味犀角，但药材目录不新增犀角；代替品是水牛角。",
    "木通只按药典木通科木通收录，并在药材上写明不要替换成关木通。",
    downSources.length ? `本轮未能完成的来源：${downSources.join("、")}。` : "HERB、SymMap、TCMSP、ETCM 本轮都有成功响应。"
  ].filter(Boolean)
};

await writeJson("formulas.json", formulas);
await writeJson("herbs.json", herbs);
await writeJson("compounds.json", compounds);
await writeJson("targets.json", targets);
await writeJson("pathways.json", pathways);
await writeJson("diseases.json", diseases);
await writeJson("sources.json", sources);
await writeJson("sync-status.json", syncStatus);

console.log(`Synced real data snapshot at ${generatedAt}`);
console.log(`counts formulas=${formulas.length} herbs=${herbs.length} compounds=${compounds.length} targets=${targets.length} pathways=${pathways.length} diseases=${diseases.length}`);
for (const item of sourceStatus) console.log(`${item.source} ${item.entity}: ${item.matched}/${item.total} refreshed ${item.refreshed}`);
for (const [name, report] of Object.entries(endpointReport)) console.log(`${name} ok=${report.ok}`);
