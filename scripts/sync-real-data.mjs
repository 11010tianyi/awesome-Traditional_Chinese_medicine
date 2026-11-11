import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compoundSeeds, formulaSeeds, herbSeeds, targetSeeds } from "./catalog-seeds.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "app", "data");
const generatedAt = new Date().toISOString();

const HERB_API = "http://herb.ac.cn/chedi/api/";
const ETCM_API = "http://www.tcmip.cn:18124";
const SYMMAP_BASE = "http://www.symmap.org";
const TCMSP_BASE = "https://www.tcmsp-e.com";
const TCMSP_TOKEN = "733fec356521a49666d41bb4c62096a8";

if (process.argv.includes("--help")) {
  console.log("Usage: npm run sync:data");
  console.log("Fetches TCMSP/HERB/ETCM/SymMap snapshots into app/data/*.json.");
  process.exit(0);
}

const sourceStatus = [];

function nextId(prefix, rows) {
  let index = rows.length + 1;
  const existing = new Set(rows.map((row) => row.id));
  while (existing.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

function entityKey(entity) {
  return entity.symbol || entity.name;
}

function upsertByName(rows, seeds, prefix, normalizeSeed) {
  for (const seed of seeds) {
    const existing = rows.find((row) => norm(entityKey(row)) === norm(entityKey(seed)));
    if (existing) {
      Object.assign(existing, {
        ...normalizeSeed(seed, existing.id),
        ...existing,
        sources: [...new Set([...(normalizeSeed(seed, existing.id).sources || []), ...(existing.sources || [])])]
      });
      continue;
    }
    rows.push(normalizeSeed(seed, nextId(prefix, rows)));
  }
}

function applyCatalogSeeds({ formulas, herbs, compounds, targets }) {
  upsertByName(formulas, formulaSeeds, "f", (seed, id) => ({
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
}

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
  黄连: "HUANG LIAN"
};

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf8"));
}

async function writeJson(filename, value) {
  await fs.writeFile(path.join(dataDir, filename), `${JSON.stringify(value, null, 2)}\n`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = Object.fromEntries(
      Object.entries({
        "User-Agent": "Mozilla/5.0 Codex research data sync",
        Accept: "application/json,text/html,*/*",
        ...(options.headers || {})
      }).filter(([, value]) => value !== undefined)
    );
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 120)}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function postJson(url, body, timeoutMs) {
  const text = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: url.includes("herb.ac.cn") ? "http://herb.ac.cn/Search/" : undefined
      },
      body: JSON.stringify(body)
    },
    timeoutMs
  );
  return JSON.parse(text);
}

async function postForm(url, fields, timeoutMs) {
  const body = new URLSearchParams(fields);
  const text = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: `${SYMMAP_BASE}/search/`
      },
      body
    },
    timeoutMs
  );
  return JSON.parse(text);
}

function norm(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scalar(value) {
  if (value && typeof value === "object" && "title" in value) return value.title;
  return value;
}

function parseTable(resData) {
  if (!Array.isArray(resData) || !Array.isArray(resData[0])) return [];
  const headers = resData[0];
  return resData.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, scalar(row[index])]))
  );
}

function herbCandidates(herb) {
  return [...new Set([herbQueryMap[herb.name], herb.pinyin, herb.name].filter(Boolean))];
}

function bestHerb(rows, herb) {
  return (
    rows.find((row) => norm(row["Herb Chinese name"]) === norm(herb.name)) ||
    rows.find((row) => norm(row["Herb pinyin name"]).replaceAll(" ", "") === norm(herb.pinyin)) ||
    rows[0]
  );
}

function bestByExact(rows, field, value) {
  return rows.find((row) => norm(row[field]) === norm(value)) || rows[0];
}

function hasExternalId(entity, source) {
  const value = entity.externalIds?.[source];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function countExternal(rows, source) {
  return rows.filter((row) => hasExternalId(row, source)).length;
}

async function herbSearch(keyword, label) {
  const data = await postJson(HERB_API, { func_name: "search_api", keyword, label }, 15000);
  return parseTable(data.res_data);
}

async function syncHerbEntity(entity, label, query, pick) {
  const rows = await herbSearch(query, label);
  return pick(rows);
}

async function syncSymMap(tableName, key) {
  return postForm(`${SYMMAP_BASE}/search/`, { table_name: tableName, key }, 15000);
}

async function syncEtcmSearch(searchText, type = "search") {
  return postJson(`${ETCM_API}/home/homeEsSearch/`, { search_text: searchText, type }, 15000);
}

function parseTcmspGridData(html) {
  const marker = "data:";
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const arrayStart = html.indexOf("[", start + marker.length);
  if (arrayStart === -1) return [];
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
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return JSON.parse(html.slice(arrayStart, index + 1));
  }
  return [];
}

async function syncTcmsp(qs, q) {
  const url = `${TCMSP_BASE}/tcmspsearch.php?${new URLSearchParams({ qs, q, token: TCMSP_TOKEN })}`;
  const html = await fetchWithTimeout(url, {}, 15000);
  return parseTcmspGridData(html);
}

async function enrichHerbs(herbs) {
  let herbHits = 0;
  let symMapHits = 0;
  let tcmspHits = 0;
  let etcmHits = 0;

  for (const herb of herbs) {
    herb.externalIds ||= {};
    herb.sourceDetails ||= {};

    try {
      if (hasExternalId(herb, "HERB")) throw new Error("__SKIP__");
      let hit;
      for (const keyword of herbCandidates(herb)) {
        const rows = await herbSearch(keyword, "Herb");
        hit = bestHerb(rows, herb);
        if (hit) break;
      }
      if (hit) {
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
        herbHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") herb.sourceDetails.HERB = { error: error.message };
    }

    try {
      if (hasExternalId(herb, "SymMap")) throw new Error("__SKIP__");
      const data = await syncSymMap("Herb", herbQueryMap[herb.name] || herb.pinyin);
      const hit = (data.data || []).find((row) => row.Chinese_name === herb.name) || (data.data || [])[0];
      if (hit) {
        herb.externalIds.SymMap = hit.Herb_id;
        herb.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${hit.Herb_id}` };
        herb.sources = [...new Set([...(herb.sources || []), "SymMap"])];
        symMapHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") herb.sourceDetails.SymMap = { error: error.message };
    }

    try {
      if (hasExternalId(herb, "TCMSP")) throw new Error("__SKIP__");
      const rows = await syncTcmsp("herb_all_name", herb.pinyin);
      const hit = rows.find((row) => row.herb_cn_name === herb.name) || rows[0];
      if (hit) {
        herb.externalIds.TCMSP = hit.herb_en_name || hit.herb_pinyin;
        herb.sourceDetails.TCMSP = hit;
        herb.sources = [...new Set([...(herb.sources || []), "TCMSP"])];
        tcmspHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") herb.sourceDetails.TCMSP = { error: error.message };
    }

    try {
      if (hasExternalId(herb, "ETCM")) throw new Error("__SKIP__");
      const data = await syncEtcmSearch((herbQueryMap[herb.name] || herb.pinyin).toLowerCase(), "search");
      const hitGroups = Array.isArray(data.result) ? data.result : [];
      if (hitGroups.length) {
        herb.externalIds.ETCM = hitGroups.flatMap((group) => group.options || []).slice(0, 5).map((item) => item.label);
        herb.sourceDetails.ETCM = hitGroups.slice(0, 3);
        herb.sources = [...new Set([...(herb.sources || []), "ETCM"])];
        etcmHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") herb.sourceDetails.ETCM = { error: error.message };
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

    try {
      if (hasExternalId(compound, "HERB")) throw new Error("__SKIP__");
      const hit = await syncHerbEntity(compound, "Ingredient", compound.name, (rows) => bestByExact(rows, "Ingredient name", compound.name));
      if (hit) {
        compound.externalIds.HERB = hit["Ingredient id"];
        compound.sourceDetails.HERB = {
          ingredientId: hit["Ingredient id"],
          name: hit["Ingredient name"],
          alias: hit.Alias,
          url: `http://herb.ac.cn/Detail/?v=${hit["Ingredient id"]}&label=Ingredient`
        };
        herbHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") compound.sourceDetails.HERB = { error: error.message };
    }

    try {
      if (hasExternalId(compound, "SymMap")) throw new Error("__SKIP__");
      const data = await syncSymMap("Mol", compound.name);
      const hit = (data.data || [])[0];
      if (hit) {
        const molId = hit.Mol_id || hit.MOL_id;
        compound.externalIds.SymMap = molId;
        compound.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${molId}` };
        symMapHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") compound.sourceDetails.SymMap = { error: error.message };
    }

    try {
      if (hasExternalId(compound, "TCMSP")) throw new Error("__SKIP__");
      const rows = await syncTcmsp("molecule_name", compound.name);
      const hit = rows[0];
      if (hit) {
        compound.externalIds.TCMSP = hit.MOL_ID || hit.molecule_ID || hit.molecule_name;
        compound.sourceDetails.TCMSP = hit;
        tcmspHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") compound.sourceDetails.TCMSP = { error: error.message };
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

    try {
      if (hasExternalId(target, "HERB")) throw new Error("__SKIP__");
      const hit = await syncHerbEntity(target, "Target", target.symbol, (rows) => bestByExact(rows, "Gene name", target.symbol));
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
      if (error.message !== "__SKIP__") target.sourceDetails.HERB = { error: error.message };
    }

    try {
      if (hasExternalId(target, "SymMap")) throw new Error("__SKIP__");
      const data = await syncSymMap("Gene", target.symbol);
      const hit = (data.data || []).find((row) => row.Gene_symbol === target.symbol) || (data.data || [])[0];
      if (hit) {
        target.externalIds.SymMap = hit.Gene_id;
        target.sourceDetails.SymMap = { ...hit, url: `${SYMMAP_BASE}/detail/${hit.Gene_id}` };
        symMapHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") target.sourceDetails.SymMap = { error: error.message };
    }

    try {
      if (hasExternalId(target, "TCMSP")) throw new Error("__SKIP__");
      const rows = await syncTcmsp("target_name", target.symbol);
      const hit = rows[0];
      if (hit) {
        target.externalIds.TCMSP = hit.target_ID || hit.target_name || target.symbol;
        target.sourceDetails.TCMSP = hit;
        tcmspHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") target.sourceDetails.TCMSP = { error: error.message };
    }
  }

  sourceStatus.push({ source: "HERB", entity: "targets", matched: countExternal(targets, "HERB"), total: targets.length, refreshed: herbHits });
  sourceStatus.push({ source: "SymMap", entity: "targets", matched: countExternal(targets, "SymMap"), total: targets.length, refreshed: symMapHits });
  sourceStatus.push({ source: "TCMSP", entity: "targets", matched: countExternal(targets, "TCMSP"), total: targets.length, refreshed: tcmspHits });
}

async function enrichFormulas(formulas) {
  let etcmHits = 0;

  for (const formula of formulas) {
    formula.externalIds ||= {};
    formula.sourceDetails ||= {};
    formula.sources ||= ["经典方书"];

    try {
      if (hasExternalId(formula, "ETCM")) throw new Error("__SKIP__");
      const keyword = String(formula.pinyin || formula.name).toLowerCase();
      const data = await syncEtcmSearch(keyword, "search");
      const hitGroups = Array.isArray(data.result) ? data.result : [];
      const formulaGroups = hitGroups.filter((group) => /formula|chinese_patent_drug/i.test(`${group.label} ${group.title}`));
      const hits = (formulaGroups.length ? formulaGroups : hitGroups).flatMap((group) => group.options || []).slice(0, 5);
      if (hits.length) {
        formula.externalIds.ETCM = hits.map((item) => item.label);
        formula.sourceDetails.ETCM = formulaGroups.slice(0, 3);
        formula.sources = [...new Set([...(formula.sources || []), "ETCM"])];
        etcmHits += 1;
      }
    } catch (error) {
      if (error.message !== "__SKIP__") formula.sourceDetails.ETCM = { error: error.message };
    }
  }

  sourceStatus.push({ source: "ETCM", entity: "formulas", matched: countExternal(formulas, "ETCM"), total: formulas.length, refreshed: etcmHits });
  sourceStatus.push({ source: "Classic texts", entity: "formulas", matched: formulas.length, total: formulas.length, refreshed: formulaSeeds.length });
}

async function buildSources() {
  let etcmHome = null;
  try {
    etcmHome = JSON.parse(await fetchWithTimeout(`${ETCM_API}/home/home_data/`, {}, 15000));
  } catch (error) {
    etcmHome = { error: error.message };
  }

  return [
    {
      name: "TCMSP",
      fullName: "Traditional Chinese Medicine Systems Pharmacology Database and Analysis Platform",
      baseUrl: TCMSP_BASE,
      integration: "HTML form endpoint parsed from tcmspsearch.php",
      endpoint: `${TCMSP_BASE}/tcmspsearch.php`,
      status: sourceStatus.filter((item) => item.source === "TCMSP")
    },
    {
      name: "HERB",
      fullName: "High-throughput Experiment- and Reference-guided database of TCM",
      baseUrl: "http://herb.ac.cn/",
      integration: "JSON endpoint used by the public HERB frontend",
      endpoint: HERB_API,
      status: sourceStatus.filter((item) => item.source === "HERB")
    },
    {
      name: "ETCM",
      fullName: "The Encyclopedia of Traditional Chinese Medicine v2.0",
      baseUrl: "http://www.tcmip.cn/ETCM2/front/#/",
      integration: "ETCM2 JSON endpoints discovered from frontend bundle",
      endpoint: `${ETCM_API}/home/homeEsSearch/`,
      homeStats: etcmHome?.data || null,
      status: sourceStatus.filter((item) => item.source === "ETCM")
    },
    {
      name: "SymMap",
      fullName: "Symptom Mapping database of Traditional Chinese Medicine",
      baseUrl: SYMMAP_BASE,
      integration: "Form POST endpoints used by the public SymMap search page",
      endpoint: `${SYMMAP_BASE}/search/`,
      status: sourceStatus.filter((item) => item.source === "SymMap")
    }
  ];
}

const formulas = await readJson("formulas.json");
const herbs = await readJson("herbs.json");
const compounds = await readJson("compounds.json");
const targets = await readJson("targets.json");

applyCatalogSeeds({ formulas, herbs, compounds, targets });

await enrichFormulas(formulas);
await enrichHerbs(herbs);
await enrichCompounds(compounds);
await enrichTargets(targets);

const sources = await buildSources();
const syncStatus = {
  generatedAt,
  note: "真实源同步快照。HERB/ETCM/SymMap/TCMSP 均通过其公开网站前端可见接口或表单入口获取；外部数据库结构可能变更，重跑 npm run sync:data 可刷新。",
  summary: sourceStatus,
  catalogCounts: {
    formulas: formulas.length,
    herbs: herbs.length,
    compounds: compounds.length,
    targets: targets.length
  },
  endpoints: sources.map(({ name, endpoint, integration }) => ({ name, endpoint, integration }))
};

await writeJson("formulas.json", formulas);
await writeJson("herbs.json", herbs);
await writeJson("compounds.json", compounds);
await writeJson("targets.json", targets);
await writeJson("sources.json", sources);
await writeJson("sync-status.json", syncStatus);

console.log(`Synced real data snapshot at ${generatedAt}`);
for (const item of sourceStatus) {
  console.log(`${item.source} ${item.entity}: ${item.matched}/${item.total}`);
}
