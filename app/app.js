const dataFiles = {
  herbs: "./data/herbs.json",
  formulas: "./data/formulas.json",
  customFormulas: "./data/custom-formulas.json",
  compounds: "./data/compounds.json",
  targets: "./data/targets.json",
  pathways: "./data/pathways.json",
  diseases: "./data/diseases.json",
  sources: "./data/sources.json",
  syncStatus: "./data/sync-status.json"
};

let db = {
  herbs: [],
  formulas: [],
  customFormulas: [],
  compounds: [],
  targets: [],
  pathways: [],
  diseases: [],
  sources: [],
  syncStatus: { generatedAt: null, sources: [] }
};

const state = {
  formulaId: "f1",
  activeHerbs: [],
  missingTerms: [],
  entityType: "all",
  query: "",
  minConfidence: 60,
  visualTab: "enrichment",
  enrichmentPlot: "go-bar",
  enrichmentBackend: null,
  enrichmentJob: null,
  catalogType: "herb",
  catalogQuery: "",
  network: { nodes: [], edges: [] }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
let herbByName = {};
let compoundsById = {};
let targetsById = {};
let pathwaysById = {};
let diseasesById = {};

async function loadData() {
  const entries = await Promise.all(
    Object.entries(dataFiles).map(async ([key, url]) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${url} ${response.status}`);
      return [key, await response.json()];
    })
  );
  db = { ...db, ...Object.fromEntries(entries) };
  db.customFormulas = mergeFormulas(db.customFormulas, readLocalCustomFormulas());
  db.formulas = mergeFormulas(db.formulas, db.customFormulas);
  rebuildIndexes();
}

const CUSTOM_FORMULA_KEY = "tcm-custom-formulas";

function readLocalCustomFormulas() {
  try {
    const raw = localStorage.getItem(CUSTOM_FORMULA_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeLocalCustomFormulas(formulas) {
  localStorage.setItem(CUSTOM_FORMULA_KEY, JSON.stringify(formulas));
}

function slugify(value) {
  return String(value || "formula")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "formula";
}

function mergeFormulas(baseFormulas, customFormulas) {
  const merged = [...baseFormulas];
  customFormulas.forEach((formula) => {
    const index = merged.findIndex((item) => item.id === formula.id);
    if (index >= 0) merged[index] = formula;
    else merged.push(formula);
  });
  return merged;
}

function rebuildIndexes() {
  herbByName = Object.fromEntries(db.herbs.map((herb) => [herb.name, herb]));
  compoundsById = byId(db.compounds);
  targetsById = byId(db.targets);
  pathwaysById = byId(db.pathways);
  diseasesById = byId(db.diseases);
}

async function init() {
  hydrateIcons();
  await loadData();
  $("#confidenceRange").value = state.minConfidence;
  $("#confidenceValue").textContent = state.minConfidence;
  renderFormulaSelect();
  renderEntityFilters();
  renderCatalogFilters();
  bindEvents();
  loadFormula("f1");
  renderAll();
  detectEnrichmentBackend().then(() => {
    if (state.visualTab === "enrichment") renderEnrichment();
  });
}

function hydrateIcons() {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
    "clipboard-list": '<rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"></path><path d="M8 11h8"></path><path d="M8 16h6"></path>',
    "share-2": '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4"></path><path d="m15.4 6.5-6.8 4"></path>',
    "bar-chart-3": '<path d="M4 20V10"></path><path d="M12 20V4"></path><path d="M20 20v-6"></path>',
    download: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"></path>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18"></path><path d="M9 4v16"></path>',
    braces: '<path d="M8 3H7a3 3 0 0 0-3 3v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a3 3 0 0 0 3 3h1"></path><path d="M16 3h1a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a3 3 0 0 1-3 3h-1"></path>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><path d="m21 16-5-5L5 19"></path>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h6"></path>'
  };
  document.querySelectorAll("[data-icon]").forEach((element) => {
    const name = element.dataset.icon;
    element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.search}</svg>`;
  });
}

function bindEvents() {
  $("#globalSearch").addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderSearchResults();
  });

  $("#catalogSearch").addEventListener("input", (event) => {
    state.catalogQuery = event.target.value.trim();
    renderCatalog();
  });

  $("#formulaSelect").addEventListener("change", (event) => {
    state.formulaId = event.target.value;
    loadFormula(state.formulaId);
    renderAll();
  });

  $("#loadFormulaBtn").addEventListener("click", () => {
    loadFormula($("#formulaSelect").value);
    renderAll();
    toast("已载入经典方剂。");
  });

  $("#saveFormulaBtn").addEventListener("click", saveCustomFormula);

  $("#openCatalogBtn").addEventListener("click", () => {
    state.catalogType = state.entityType === "all" ? "herb" : state.entityType;
    $("#catalog").classList.remove("is-hidden");
    renderCatalogFilters();
    renderCatalog();
    $("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#analyzeBtn").addEventListener("click", () => {
    analyzePrescription();
    renderAll();
    toast("处方分析已更新。");
  });

  $("#confidenceRange").addEventListener("input", (event) => {
    state.minConfidence = Number(event.target.value);
    $("#confidenceValue").textContent = state.minConfidence;
    renderAll();
  });

  $("#visualTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.visualTab = button.dataset.tab;
    $$("#visualTabs button").forEach((item) => item.classList.toggle("active", item === button));
    renderVisualPanel();
  });

  $("#visualPanel").addEventListener("click", (event) => {
    const button = event.target.closest("[data-enrich-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.enrichAction;
    if (action === "run") runEnrichmentAnalysis();
    else if (action === "plot") {
      state.enrichmentPlot = button.dataset.plot;
      renderEnrichment();
    } else if (action.startsWith("download-")) downloadEnrichment(action.slice("download-".length));
  });

  $("#exportCsv").addEventListener("click", exportEdgesCsv);
  $("#exportJson").addEventListener("click", exportAnalysisJson);
  $("#exportSvg").addEventListener("click", exportSvg);
  $("#exportMd").addEventListener("click", exportMarkdown);
}

function renderFormulaSelect() {
  $("#formulaSelect").innerHTML = db.formulas
    .map((formula) => `<option value="${formula.id}">${formula.name}${formula.custom ? " · 自定义" : ""}</option>`)
    .join("");
}

function renderEntityFilters() {
  const filters = entityFilters();
  $("#entityFilters").innerHTML = filters
    .map(([type, label]) => `<button class="${type === state.entityType ? "active" : ""}" data-type="${type}">${label}</button>`)
    .join("");
  $("#entityFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.entityType = button.dataset.type;
    $$("#entityFilters button").forEach((item) => item.classList.toggle("active", item === button));
    renderSearchResults();
  });
}

function entityFilters(includeAll = true) {
  return [
    ...(includeAll ? [["all", "全部"]] : []),
    ["formula", "方剂"],
    ["herb", "药材"],
    ["compound", "成分"],
    ["target", "靶点"],
    ["pathway", "通路"],
    ["disease", "疾病"]
  ];
}

function renderCatalogFilters() {
  $("#catalogFilters").innerHTML = entityFilters(false)
    .map(([type, label]) => `<button class="${type === state.catalogType ? "active" : ""}" data-type="${type}">${label}</button>`)
    .join("");
  $("#catalogFilters").onclick = (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.catalogType = button.dataset.type;
    $$("#catalogFilters button").forEach((item) => item.classList.toggle("active", item === button));
    renderCatalog();
  };
}

function loadFormula(formulaId) {
  const formula = db.formulas.find((item) => item.id === formulaId) || db.formulas[0];
  if (!formula) return;
  state.formulaId = formula.id;
  $("#formulaSelect").value = formula.id;
  $("#prescriptionInput").value = formula.herbs.map((name) => `${name} 10g`).join("、");
  analyzePrescription();
}

function analyzePrescription() {
  const raw = $("#prescriptionInput").value;
  const terms = parsePrescriptionTerms(raw);

  const herbs = [];
  const missing = [];
  terms.forEach((term) => {
    const found = herbByName[term] || db.herbs.find((herb) => herb.pinyin.toLowerCase() === term.toLowerCase() || term.includes(herb.name));
    if (found && !herbs.some((herb) => herb.id === found.id)) herbs.push(found);
    if (!found && !missing.includes(term)) missing.push(term);
  });

  state.activeHerbs = herbs;
  state.missingTerms = missing;
}

function parsePrescriptionTerms(raw) {
  return raw
    .split(/[、，,\n;；\s]+/)
    .map((term) => term.replace(/[0-9.]+(g|克|钱|两|mg|毫克)?/gi, "").trim())
    .filter(Boolean);
}

async function saveCustomFormula() {
  const name = $("#customFormulaName").value.trim();
  const herbs = [...new Set(parsePrescriptionTerms($("#prescriptionInput").value))];
  const tags = $("#customFormulaTags").value
    .split(/[、，,\n;；]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!name) {
    toast("请先填写处方名。");
    $("#customFormulaName").focus();
    return;
  }
  if (!herbs.length) {
    toast("请先在处方组成中填写药味。");
    $("#prescriptionInput").focus();
    return;
  }

  const formula = {
    name,
    source: $("#customFormulaSource").value.trim() || "手动添加",
    indication: $("#customFormulaIndication").value.trim() || "自定义处方",
    herbs,
    tags: tags.length ? tags : ["自定义"],
    custom: true
  };

  let saved = null;
  let savedOnPages = false;
  try {
    const response = await fetch("/api/formulas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formula)
    });
    const payload = await response.json();
    if (!response.ok || !payload.formula) throw new Error(payload.error || "保存失败");
    saved = payload.formula;
  } catch (error) {
    const existing = db.customFormulas.find((item) => item.name === name);
    saved = {
      ...formula,
      id: existing?.id || `custom-${Date.now()}-${slugify(name)}`,
      updatedAt: new Date().toISOString()
    };
    writeLocalCustomFormulas(mergeFormulas(readLocalCustomFormulas(), [saved]));
    savedOnPages = true;
  }

  db.customFormulas = mergeFormulas(db.customFormulas, [saved]);
  db.formulas = mergeFormulas(db.formulas, [saved]);
  renderFormulaSelect();
  state.formulaId = saved.id;
  loadFormula(saved.id);
  renderAll();
  $("#customFormulaName").value = "";
  $("#customFormulaSource").value = "";
  $("#customFormulaIndication").value = "";
  $("#customFormulaTags").value = "";
  toast(savedOnPages ? "自定义处方已保存在本机浏览器，并加入方剂列表。" : "自定义处方已保存，并加入方剂列表。");
}

function renderAll() {
  buildNetwork();
  renderMetrics();
  renderSyncStatus();
  renderSearchResults();
  renderCatalog();
  renderPrescription();
  renderNetwork();
  renderVisualPanel();
}

function selectedCompounds() {
  const ids = new Set(state.activeHerbs.flatMap((herb) => herb.compounds || []));
  return [...ids].map((id) => compoundsById[id]).filter(Boolean);
}

function selectedTargets() {
  const targetMap = new Map();
  selectedCompounds().forEach((compound) => {
    Object.entries(compound.targets || {}).forEach(([targetId, score]) => {
      if (score < state.minConfidence) return;
      const current = targetMap.get(targetId);
      if (!targetsById[targetId]) return;
      if (!current || score > current.score) targetMap.set(targetId, { ...targetsById[targetId], score, compoundIds: [compound.id] });
      else current.compoundIds.push(compound.id);
    });
  });
  return [...targetMap.values()];
}

function selectedPathways() {
  const ids = new Set(selectedTargets().flatMap((target) => target.pathways || []));
  return [...ids].map((id) => pathwaysById[id]).filter(Boolean);
}

function selectedDiseases() {
  const ids = new Set(selectedTargets().flatMap((target) => target.diseases || []));
  return [...ids].map((id) => diseasesById[id]).filter(Boolean);
}

function renderMetrics() {
  $("#metricHerbs").textContent = state.activeHerbs.length;
  $("#metricCompounds").textContent = selectedCompounds().length;
  $("#metricTargets").textContent = selectedTargets().length;
  $("#metricPathways").textContent = `${selectedPathways().length}/${selectedDiseases().length}`;
  const formula = db.formulas.find((item) => item.id === state.formulaId);
  $("#activeSummary").textContent = `当前处方：${formula ? formula.name : "自定义处方"}`;
}

function makeSearchIndex() {
  const externalText = (item) => Object.values(item.externalIds || {}).flat(2).map((value) => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" ");
  const formulas = db.formulas.map((item) => ({
    type: "formula",
    id: item.id,
    title: item.name,
    subtitle: `${item.source} · ${item.indication}`,
    tags: item.tags || [],
    externalIds: item.externalIds || {},
    text: [item.name, item.pinyin, item.source, item.indication, (item.tags || []).join(" "), (item.herbs || []).join(" "), externalText(item)].join(" ")
  }));
  const herbs = db.herbs.map((item) => ({
    type: "herb",
    id: item.id,
    title: item.name,
    subtitle: `${item.nature} · ${(item.flavors || []).join("/")} · 归 ${(item.meridians || []).join("、")} 经`,
    tags: item.effects || [],
    externalIds: item.externalIds || {},
    text: [item.name, item.pinyin, item.nature, (item.flavors || []).join(" "), (item.meridians || []).join(" "), (item.effects || []).join(" "), item.caution, externalText(item)].filter(Boolean).join(" ")
  }));
  const compounds = db.compounds.map((item) => ({
    type: "compound",
    id: item.id,
    title: item.cn,
    subtitle: `${item.name} · OB ${item.ob ?? "NA"}% · DL ${item.dl ?? "NA"}`,
    tags: Object.keys(item.targets || {}).map((id) => targetsById[id]?.symbol).filter(Boolean),
    externalIds: item.externalIds || {},
    text: [item.name, item.cn, Object.keys(item.targets || {}).join(" "), externalText(item)].join(" ")
  }));
  const targets = db.targets.map((item) => ({
    type: "target",
    id: item.id,
    title: item.symbol,
    subtitle: item.name,
    tags: (item.pathways || []).map((id) => pathwaysById[id]?.cn).filter(Boolean),
    externalIds: item.externalIds || {},
    text: [item.symbol, item.name, (item.pathways || []).map((id) => pathwaysById[id]?.cn).filter(Boolean).join(" "), externalText(item)].join(" ")
  }));
  const pathways = db.pathways.map((item) => ({
    type: "pathway",
    id: item.id,
    title: item.cn,
    subtitle: item.name,
    tags: [item.score == null ? (item.kegg || "KEGG") : `p=${item.score}`],
    text: [item.cn, item.name, item.kegg].filter(Boolean).join(" ")
  }));
  const diseases = db.diseases.map((item) => ({
    type: "disease",
    id: item.id,
    title: item.cn,
    subtitle: item.name,
    tags: ["疾病"],
    text: [item.cn, item.name].join(" ")
  }));
  return [...formulas, ...herbs, ...compounds, ...targets, ...pathways, ...diseases];
}

function renderSyncStatus() {
  const syncStatus = db.syncStatus || {};
  const sourceNames = ["HERB", "SymMap", "TCMSP", "ETCM"];
  const rows = syncStatus.summary || [];
  const generatedAt = syncStatus.generatedAt ? new Date(syncStatus.generatedAt).toLocaleString("zh-CN", { hour12: false }) : "尚未同步";
  $("#syncStatus").innerHTML = sourceNames.map((source) => {
    const sourceRows = rows.filter((row) => row.source === source);
    const matched = sourceRows.reduce((sum, row) => sum + row.matched, 0);
    const total = sourceRows.reduce((sum, row) => sum + row.total, 0);
    const detail = sourceRows.map((row) => `${entityName(row.entity)} ${row.matched}/${row.total}`).join(" · ") || "暂无同步记录";
    return `
      <article class="sync-card">
        <strong>${source} ${total ? `${matched}/${total}` : ""}</strong>
        <p>${detail}</p>
        <p>快照：${generatedAt}</p>
      </article>
    `;
  }).join("");
}

function entityName(entity) {
  return { formulas: "方剂", herbs: "药材", compounds: "成分", targets: "靶点" }[entity] || entity;
}

function renderSearchResults() {
  const query = state.query.toLowerCase();
  const index = makeSearchIndex()
    .filter((item) => state.entityType === "all" || item.type === state.entityType)
    .filter((item) => !query || item.text.toLowerCase().includes(query));
  const limit = query ? 12 : 8;
  const results = index.slice(0, limit);

  $("#searchResults").innerHTML = results.map(renderResultCard).join("") || `<div class="result-card"><h4>未找到匹配项</h4><p>可换用药材中文名、拼音、靶点符号或通路名称。</p></div>`;
  $("#openCatalogBtn").textContent = index.length > results.length ? `查看更多（${index.length} 条）` : "进入分类浏览";
}

function renderCatalog() {
  const query = state.catalogQuery.toLowerCase();
  const rows = makeSearchIndex()
    .filter((item) => item.type === state.catalogType)
    .filter((item) => !query || item.text.toLowerCase().includes(query));
  $("#catalogSummary").textContent = `${entityTypeName(state.catalogType)}：共 ${rows.length} 条，当前显示前 ${Math.min(48, rows.length)} 条。`;
  $("#catalogResults").innerHTML = rows.slice(0, 48).map(renderResultCard).join("") || `<div class="result-card"><h4>未找到匹配项</h4><p>请换一个关键词或切换分类。</p></div>`;
}

function entityTypeName(type) {
  return { formula: "方剂", herb: "药材", compound: "成分", target: "靶点", pathway: "通路", disease: "疾病" }[type] || type;
}

function renderResultCard(item) {
  const label = {
    formula: "方剂",
    herb: "药材",
    compound: "成分",
    target: "靶点",
    pathway: "通路",
    disease: "疾病"
  }[item.type];

  return `
    <article class="result-card">
      <header>
        <h4>${escapeHtml(item.title)}</h4>
        <span class="badge ${item.type}">${label}</span>
      </header>
      <p>${escapeHtml(item.subtitle)}</p>
      ${renderExternalIds(item.externalIds)}
      <div class="meta-line">${item.tags.slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `;
}

function renderExternalIds(externalIds = {}) {
  const rows = Object.entries(externalIds)
    .filter(([, value]) => value !== undefined && value !== null && String(value).length)
    .slice(0, 4);
  if (!rows.length) return "";
  return `
    <div class="source-line">
      ${rows.map(([source, value]) => `<span><strong>${escapeHtml(source)}</strong> ${escapeHtml(formatExternalIdValue(value))}</span>`).join("")}
    </div>
  `;
}

function formatExternalIdValue(value) {
  const text = Array.isArray(value) ? value.slice(0, 3).join("、") : String(value);
  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function renderPrescription() {
  $("#matchedHerbs").innerHTML = [
    ...state.activeHerbs.map((herb) => `<span class="chip">${herb.name}</span>`),
    ...state.missingTerms.map((term) => `<span class="chip missing">未匹配：${term}</span>`)
  ].join("");

  renderBarChart("#natureChart", countValues(state.activeHerbs.map((herb) => herb.nature)));
  renderBarChart("#flavorChart", countValues(state.activeHerbs.flatMap((herb) => herb.flavors || [])));
  renderBarChart("#meridianChart", countValues(state.activeHerbs.flatMap((herb) => herb.meridians || [])).slice(0, 6));
  renderCorePairs();
}

function countValues(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function renderBarChart(selector, rows) {
  const max = Math.max(1, ...rows.map(([, value]) => value));
  $(selector).innerHTML = rows.map(([label, value]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${(value / max) * 100}%"></div></div>
      <strong>${value}</strong>
    </div>
  `).join("") || `<p class="hint-row">暂无数据</p>`;
}

function renderCorePairs() {
  const herbs = state.activeHerbs;
  const pairs = [];
  for (let i = 0; i < herbs.length; i += 1) {
    for (let j = i + 1; j < herbs.length; j += 1) {
      const a = herbs[i];
      const b = herbs[j];
      const sharedCompounds = (a.compounds || []).filter((id) => (b.compounds || []).includes(id));
      const aTargets = new Set((a.compounds || []).flatMap((id) => Object.keys(compoundsById[id]?.targets || {})));
      const bTargets = new Set((b.compounds || []).flatMap((id) => Object.keys(compoundsById[id]?.targets || {})));
      const sharedTargets = [...aTargets].filter((id) => bTargets.has(id));
      const score = sharedCompounds.length * 2 + sharedTargets.length;
      if (score > 0) pairs.push({ a, b, sharedCompounds, sharedTargets, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  $("#corePairs").innerHTML = pairs.slice(0, 6).map((pair) => `
    <div class="pair-card">
      <strong>${pair.a.name} + ${pair.b.name}</strong>
      <p>共享成分 ${pair.sharedCompounds.length} 个，相关靶点 ${pair.sharedTargets.map((id) => targetsById[id]?.symbol).filter(Boolean).join("、") || "待补充"}。配伍评分 ${pair.score}。</p>
    </div>
  `).join("") || `<div class="pair-card"><strong>暂无核心药对</strong><p>增加药味或降低靶点置信度后可生成更多关系。</p></div>`;
}

function buildNetwork() {
  const nodes = [];
  const edges = [];
  const addNode = (node) => {
    if (!nodes.some((item) => item.key === node.key)) nodes.push(node);
  };
  const addEdge = (source, target, label, score = "") => edges.push({ source, target, label, score });

  state.activeHerbs.forEach((herb) => {
    addNode({ key: `herb:${herb.id}`, id: herb.id, type: "herb", label: herb.name, data: herb });
    (herb.compounds || []).forEach((compoundId) => {
      const compound = compoundsById[compoundId];
      if (!compound) return;
      addNode({ key: `compound:${compoundId}`, id: compoundId, type: "compound", label: compound.cn, data: compound });
      addEdge(`herb:${herb.id}`, `compound:${compoundId}`, "contains");
      Object.entries(compound.targets || {}).forEach(([targetId, score]) => {
        if (score < state.minConfidence) return;
        const target = targetsById[targetId];
        if (!target) return;
        addNode({ key: `target:${targetId}`, id: targetId, type: "target", label: target.symbol, data: { ...target, score } });
        addEdge(`compound:${compoundId}`, `target:${targetId}`, "targets", score);
        (target.pathways || []).forEach((pathwayId) => {
          const pathway = pathwaysById[pathwayId];
          if (!pathway) return;
          addNode({ key: `pathway:${pathwayId}`, id: pathwayId, type: "pathway", label: pathway.cn, data: pathway });
          addEdge(`target:${targetId}`, `pathway:${pathwayId}`, "enriched");
        });
        (target.diseases || []).forEach((diseaseId) => {
          const disease = diseasesById[diseaseId];
          if (!disease) return;
          addNode({ key: `disease:${diseaseId}`, id: diseaseId, type: "disease", label: disease.cn, data: disease });
          addEdge(`target:${targetId}`, `disease:${diseaseId}`, "associated");
        });
      });
    });
  });

  state.network = { nodes, edges };
}

function renderNetwork() {
  const svg = $("#networkSvg");
  const width = svg.clientWidth || 900;
  const height = 520;
  const columns = ["herb", "compound", "target", "pathway", "disease"];
  const xMap = { herb: 70, compound: 245, target: 430, pathway: 615, disease: 785 };
  const grouped = Object.fromEntries(columns.map((type) => [type, state.network.nodes.filter((node) => node.type === type)]));
  const positions = new Map();

  columns.forEach((type) => {
    const list = grouped[type];
    const step = height / (list.length + 1);
    list.forEach((node, index) => {
      const x = Math.min(width - 90, xMap[type] || 80);
      const y = Math.max(36, Math.min(height - 36, step * (index + 1)));
      positions.set(node.key, { x, y });
    });
  });

  const edgeMarkup = state.network.edges.map((edge) => {
    const a = positions.get(edge.source);
    const b = positions.get(edge.target);
    if (!a || !b) return "";
    const mid = (a.x + b.x) / 2;
    return `<path class="edge" d="M${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}" />`;
  }).join("");

  const nodeMarkup = state.network.nodes.map((node) => {
    const pos = positions.get(node.key);
    const fill = nodeColor(node.type);
    const textX = node.type === "disease" ? -12 : 12;
    const anchor = node.type === "disease" ? "end" : "start";
    return `
      <g class="node" data-key="${node.key}" transform="translate(${pos.x},${pos.y})" tabindex="0">
        <circle r="8" fill="${fill}"></circle>
        <text x="${textX}" y="4" text-anchor="${anchor}">${node.label}</text>
      </g>
    `;
  }).join("");

  svg.innerHTML = `
    <g>${edgeMarkup}</g>
    <g>${nodeMarkup}</g>
  `;

  svg.querySelectorAll(".node").forEach((element) => {
    element.addEventListener("click", () => renderNodeDetails(element.dataset.key));
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") renderNodeDetails(element.dataset.key);
    });
  });
}

function nodeColor(type) {
  return {
    herb: "#256d4f",
    compound: "#1c7c82",
    target: "#3b609d",
    pathway: "#7252a3",
    disease: "#a64235"
  }[type] || "#64706a";
}

function renderNodeDetails(key) {
  const node = state.network.nodes.find((item) => item.key === key);
  if (!node) return;
  const related = state.network.edges.filter((edge) => edge.source === key || edge.target === key);
  const dataRows = Object.entries(node.data)
    .filter(([field, value]) => field !== "sourceDetails" && (typeof value !== "object" || Array.isArray(value) || field === "externalIds"))
    .slice(0, 8)
    .map(([field, value]) => `<div><strong>${field}</strong><br>${formatDetailValue(field, value)}</div>`)
    .join("");

  $("#nodeDetails").innerHTML = `
    <div class="panel-title">${node.label}</div>
    <p>${nodeTypeName(node.type)} · 关联边 ${related.length} 条</p>
    <div class="detail-list">${dataRows}</div>
  `;
}

function formatDetailValue(field, value) {
  if (field === "externalIds" && value && typeof value === "object") {
    return Object.entries(value)
      .map(([source, id]) => `${source}: ${Array.isArray(id) ? id.slice(0, 4).join("、") : id}`)
      .join("<br>");
  }
  const text = Array.isArray(value) ? value.join("、") : String(value ?? "");
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

function nodeTypeName(type) {
  return { herb: "药材", compound: "成分", target: "靶点", pathway: "通路", disease: "疾病" }[type] || type;
}

function renderVisualPanel() {
  if (state.visualTab === "enrichment") renderEnrichment();
  if (state.visualTab === "compounds") renderCompoundVisual();
  if (state.visualTab === "evidence") renderEvidenceVisual();
}

function renderEnrichment() {
  const targetCounts = countValues(selectedTargets().flatMap((target) => target.pathways || []));
  const rows = targetCounts.map(([id, count]) => ({ ...pathwaysById[id], count })).filter((row) => row.cn || row.name).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map((row) => row.count));
  const input = enrichmentInput();
  const job = state.enrichmentJob;
  const stale = job?.status === "done" && job.signature !== input.signature;
  $("#visualPanel").innerHTML = `
    <div class="enrichment-layout">
      <section>
        <div class="panel-title">目录内通路覆盖</div>
        <p class="hint-row">这是当前靶点落到内置通路上的计数，不是 GO/KEGG 富集 p 值。</p>
        <div class="visual-bars">
          ${rows.map((row) => `
            <div class="wide-bar">
              <strong>${escapeHtml(row.cn || row.name)}</strong>
              <div class="bar-track"><div class="bar-fill" style="width:${(row.count / max) * 100}%"></div></div>
              <span>${row.count} 个靶点${row.kegg ? ` · ${escapeHtml(row.kegg)}` : ""}</span>
            </div>
          `).join("") || "<p class='hint-row'>当前处方没有落到内置通路上的靶点。</p>"}
        </div>
      </section>
      <section class="enrichment-run">
        <div class="panel-title">GO / KEGG 富集</div>
        <p class="hint-row">${escapeHtml(enrichmentBackendText())} 默认物种是人类 Homo sapiens，输入是当前处方网络里置信度不低于 ${state.minConfidence} 的基因符号。</p>
        <div class="gene-chip-row">${input.genes.map((gene) => `<span class="chip">${escapeHtml(gene.symbol)}</span>`).join("") || "<span class='hint-row'>当前没有可提交的靶点基因。</span>"}</div>
        <div class="enrichment-actions">
          <button class="primary-button" data-enrich-action="run" ${input.genes.length < 2 || job?.status === "running" ? "disabled" : ""}>${job?.status === "running" ? "正在分析…" : "运行 GO/KEGG 分析"}</button>
          <span class="hint-row">将提交 ${input.genes.length} 个基因。</span>
        </div>
        ${renderEnrichmentResult(job, stale)}
      </section>
    </div>
  `;
}

function enrichmentInput() {
  const genes = selectedTargets().map((target) => {
    const compoundIds = target.compoundIds || [];
    const compounds = compoundIds.map((id) => compoundsById[id]).filter(Boolean);
    const herbs = state.activeHerbs.filter((herb) => (herb.compounds || []).some((id) => compoundIds.includes(id)));
    return {
      symbol: target.symbol,
      name: target.name,
      score: target.score,
      compounds: compounds.map((compound) => compound.name),
      herbs: herbs.map((herb) => herb.name)
    };
  }).filter((gene) => gene.symbol);
  const unique = [];
  const seen = new Set();
  genes.forEach((gene) => {
    if (seen.has(gene.symbol)) return;
    seen.add(gene.symbol);
    unique.push(gene);
  });
  return { genes: unique, signature: unique.map((gene) => gene.symbol).join("|") };
}

function enrichmentBackendText() {
  const backend = state.enrichmentBackend;
  if (!backend) return "正在检查本地 clusterProfiler 是否可用。";
  return backend.reason;
}

async function detectEnrichmentBackend() {
  try {
    const response = await fetch("/api/enrichment");
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("json")) {
      state.enrichmentBackend = { available: false, mode: "gprofiler", reason: "当前页面没有本地 R 服务。点击分析会请求公开的 g:Profiler，不会编造富集结果。" };
      return;
    }
    const payload = await response.json();
    state.enrichmentBackend = payload.available
      ? { available: true, mode: "clusterProfiler", reason: payload.reason }
      : { available: false, mode: "gprofiler", reason: `${payload.reason} 点击分析会改用公开的 g:Profiler。` };
  } catch (error) {
    state.enrichmentBackend = { available: false, mode: "gprofiler", reason: "没有连上本地富集服务。点击分析会请求公开的 g:Profiler。" };
  }
}

async function runEnrichmentAnalysis() {
  const input = enrichmentInput();
  if (input.genes.length < 2) return;
  state.enrichmentJob = { status: "running", signature: input.signature, input };
  renderEnrichment();
  const symbols = input.genes.map((gene) => gene.symbol);
  try {
    if (state.enrichmentBackend?.mode === "clusterProfiler") {
      const response = await fetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genes: symbols })
      });
      const payload = await response.json();
      if (response.ok && payload.ok) {
        state.enrichmentJob = { status: "done", signature: input.signature, input, result: normalizeClusterResult(payload, input) };
        renderEnrichment();
        return;
      }
      const fallback = await fetchGProfiler(input);
      fallback.fallbackReason = payload.reason || payload.error || `本地 clusterProfiler 返回 ${response.status}`;
      state.enrichmentJob = { status: "done", signature: input.signature, input, result: fallback };
      renderEnrichment();
      return;
    }
    state.enrichmentJob = { status: "done", signature: input.signature, input, result: await fetchGProfiler(input) };
  } catch (error) {
    state.enrichmentJob = { status: "error", signature: input.signature, input, error: error.message };
  }
  renderEnrichment();
}

function normalizeClusterResult(payload, input) {
  const result = {
    engine: "clusterProfiler",
    engineDetail: "本地 Rscript scripts/enrich-go-kegg.R",
    fallbackReason: "",
    organism: payload.organism,
    organismCode: payload.organismCode,
    idMapping: payload.idMapping,
    adjustment: payload.adjustment,
    retrievedAt: payload.retrievedAt,
    packages: payload.packages,
    databaseSources: payload.sources,
    mapped: payload.mapped || [],
    unmapped: payload.unmapped || [],
    go: asArray(payload.go).map(normalizeTerm),
    kegg: asArray(payload.kegg).map(normalizeTerm),
    plots: payload.plots || {},
    notes: payload.notes || [],
    input
  };
  ensureClientPlots(result);
  return result;
}

async function fetchGProfiler(input) {
  const symbols = input.genes.map((gene) => gene.symbol);
  const response = await fetch("https://biit.cs.ut.ee/gprofiler/api/gost/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organism: "hsapiens",
      query: symbols,
      sources: ["GO:BP", "GO:MF", "GO:CC", "KEGG"],
      user_threshold: 0.05,
      significance_threshold_method: "g_SCS",
      no_evidences: false
    })
  });
  if (!response.ok) throw new Error(`g:Profiler 返回 ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload.result) ? payload.result : [];
  const toTerm = (row) => ({
    id: row.native,
    name: row.name,
    ontology: row.source === "KEGG" ? "KEGG" : String(row.source || "").replace("GO:", ""),
    pValue: row.p_value,
    pAdjust: row.p_value,
    qValue: null,
    geneCount: row.intersection_size,
    geneRatio: `${row.intersection_size}/${row.query_size}`,
    bgRatio: `${row.term_size}/${row.effective_domain_size}`,
    genes: symbols.filter((_, index) => Array.isArray(row.intersections?.[index]) && row.intersections[index].length)
  });
  const significant = rows.filter((row) => row.significant);
  const meta = payload.meta || {};
  const result = {
    engine: "gprofiler",
    engineDetail: "https://biit.cs.ut.ee/gprofiler/api/gost/profile",
    fallbackReason: "静态页面或本地 R 不可用，结果来自公开 g:Profiler。",
    organism: "Homo sapiens",
    organismCode: "hsapiens",
    idMapping: "g:Profiler 接受 HGNC 符号，并在 genes_metadata 中返回 Ensembl 映射。",
    adjustment: "g:SCS",
    retrievedAt: meta.timestamp,
    packages: { gprofiler: meta.version },
    databaseSources: [
      { name: "g:Profiler", url: "https://biit.cs.ut.ee/gprofiler/" },
      { name: "Gene Ontology", url: "http://geneontology.org/" },
      { name: "KEGG", url: "https://www.kegg.jp/" }
    ],
    mapped: Object.entries(meta.genes_metadata?.query?.query_1?.mapping || {}).map(([symbol, ids]) => ({ symbol, entrez: (ids || []).join("|") })),
    unmapped: meta.genes_metadata?.failed || [],
    go: significant.filter((row) => String(row.source).startsWith("GO:")).map(toTerm),
    kegg: significant.filter((row) => row.source === "KEGG").map(toTerm),
    plots: {},
    notes: [`g:Profiler 数据版本 ${meta.version || "未知"}。图由浏览器按返回的 p 值和基因重叠绘制，不是 clusterProfiler 出图。`],
    input
  };
  ensureClientPlots(result);
  return result;
}

function ensureClientPlots(result) {
  const go = result.go.filter((term) => term.ontology === "BP").slice(0, 12);
  const kegg = result.kegg.slice(0, 12);
  result.plots ||= {};
  if (!result.plots.goBar) result.plots.goBar = renderEnrichmentBarSvg(go, "GO Biological Process");
  if (!result.plots.keggBar) result.plots.keggBar = renderEnrichmentBarSvg(kegg, "KEGG");
  if (!result.plots.goDot) result.plots.goDot = renderEnrichmentDotSvg(go, "GO Biological Process");
  if (!result.plots.keggDot) result.plots.keggDot = renderEnrichmentDotSvg(kegg, "KEGG");
  if (!result.plots.goMap) result.plots.goMap = renderEnrichmentMapSvg(go);
}

function log10p(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return -Math.log10(number);
}

function renderEnrichmentBarSvg(terms, title) {
  const width = 760;
  const rowHeight = 28;
  const height = 56 + Math.max(1, terms.length) * rowHeight;
  const max = Math.max(1, ...terms.map((term) => log10p(term.pAdjust ?? term.pValue)));
  const bars = terms.map((term, index) => {
    const y = 42 + index * rowHeight;
    const value = log10p(term.pAdjust ?? term.pValue);
    const bar = Math.max(2, (value / max) * 430);
    return `<text x="8" y="${y + 12}" font-size="12">${xmlEscape(truncateText(term.name, 34))}</text><rect x="250" y="${y}" width="${bar}" height="16" rx="4" fill="#1c7c82"></rect><text x="${258 + bar}" y="${y + 12}" font-size="11">${value.toFixed(2)}</text>`;
  }).join("");
  const empty = terms.length ? "" : `<text x="16" y="78" font-size="14">没有达到阈值的条目</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"></rect><text x="8" y="24" font-size="16" font-weight="700">${xmlEscape(title)}  ·  -log10(p)</text>${bars}${empty}</svg>`;
}

function renderEnrichmentDotSvg(terms, title) {
  const width = 760;
  const height = 80 + Math.max(1, terms.length) * 32;
  const maxCount = Math.max(1, ...terms.map((term) => term.geneCount || 0));
  const maxP = Math.max(1, ...terms.map((term) => log10p(term.pAdjust ?? term.pValue)));
  const dots = terms.map((term, index) => {
    const ratio = ratioNumber(term.geneRatio);
    const x = 280 + Math.min(1, ratio) * 360;
    const y = 58 + index * 32;
    const radius = 5 + ((term.geneCount || 1) / maxCount) * 9;
    const color = mixTeal(log10p(term.pAdjust ?? term.pValue) / maxP);
    return `<text x="8" y="${y + 4}" font-size="12">${xmlEscape(truncateText(term.name, 36))}</text><circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"></circle>`;
  }).join("");
  const empty = terms.length ? "" : `<text x="16" y="78" font-size="14">没有达到阈值的条目</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"></rect><text x="8" y="24" font-size="16" font-weight="700">${xmlEscape(title)} 气泡图 · 位置为基因比例</text>${dots}${empty}</svg>`;
}

function renderEnrichmentMapSvg(terms) {
  const width = 760;
  const height = 460;
  if (terms.length < 2) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="160" viewBox="0 0 ${width} 160"><rect width="100%" height="100%" fill="#ffffff"></rect><text x="16" y="80" font-size="14">条目少于 2 条，没有富集网络。</text></svg>`;
  }
  const nodes = terms.slice(0, 12).map((term, index) => {
    const angle = (Math.PI * 2 * index) / Math.min(12, terms.length);
    return { ...term, x: 380 + Math.cos(angle) * 210, y: 240 + Math.sin(angle) * 150 };
  });
  const edges = [];
  nodes.forEach((left, i) => {
    nodes.slice(i + 1).forEach((right) => {
      const score = jaccard(left.genes || [], right.genes || []);
      if (score >= 0.2) edges.push({ left, right, score });
    });
  });
  const edgeSvg = edges.map((edge) => `<line x1="${edge.left.x}" y1="${edge.left.y}" x2="${edge.right.x}" y2="${edge.right.y}" stroke="#b7c9c2" stroke-width="${1 + edge.score * 3}"></line>`).join("");
  const nodeSvg = nodes.map((node) => `<g><circle cx="${node.x}" cy="${node.y}" r="${12 + Math.min(10, (node.geneCount || 1))}" fill="#1f7a68"></circle><text x="${node.x}" y="${node.y + 28}" text-anchor="middle" font-size="11">${xmlEscape(truncateText(node.name, 22))}</text></g>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"></rect><text x="16" y="24" font-size="16" font-weight="700">富集网络 · 边为基因 Jaccard ≥ 0.2</text>${edgeSvg}${nodeSvg}</svg>`;
}

function ratioNumber(value) {
  const [hit, total] = String(value || "").split("/").map(Number);
  if (!total) return 0;
  return hit / total;
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function mixTeal(amount) {
  const clamped = Math.max(0, Math.min(1, amount));
  const start = [214, 232, 226];
  const end = [20, 92, 78];
  const channel = (index) => Math.round(start[index] + (end[index] - start[index]) * clamped);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function truncateText(value, length) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function xmlEscape(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

function renderEnrichmentResult(job, stale) {
  if (!job) return "";
  if (job.status === "running") return `<p class="hint-row">正在分析 ${job.input.genes.length} 个基因。</p>`;
  if (job.status === "error") return `<p class="hint-row">${escapeHtml(job.error)}</p>`;
  const result = job.result;
  const plot = result.plots?.[plotField(state.enrichmentPlot)] || "";
  const rows = state.enrichmentPlot.startsWith("kegg") ? result.kegg : result.go.filter((term) => term.ontology === "BP");
  return `
    ${stale ? `<p class="hint-row">当前基因列表已变化。下面仍是上一次提交的 ${job.input.genes.length} 个基因。</p>` : ""}
    <p class="hint-row">${escapeHtml(result.fallbackReason || result.engineDetail)} 校正方法：${escapeHtml(result.adjustment)}。未映射 ${result.unmapped.length} 个。</p>
    <div class="segmented enrichment-plot-tabs">
      ${[["go-bar", "GO 条形图"], ["kegg-bar", "KEGG 条形图"], ["go-dot", "GO 气泡图"], ["kegg-dot", "KEGG 气泡图"], ["go-map", "富集网络"]].map(([id, label]) => `<button type="button" data-enrich-action="plot" data-plot="${id}" class="${state.enrichmentPlot === id ? "active" : ""}">${label}</button>`).join("")}
    </div>
    <div class="enrichment-figure">${inlineSvg(plot)}</div>
    <div class="table-scroll">
      <table>
        <thead><tr><th>ID</th><th>名称</th><th>p</th><th>校正 p</th><th>基因数</th><th>基因</th></tr></thead>
        <tbody>
          ${rows.slice(0, 12).map((term) => `<tr><td>${escapeHtml(term.id)}</td><td>${escapeHtml(term.name)}</td><td>${formatP(term.pValue)}</td><td>${formatP(term.pAdjust)}</td><td>${term.geneCount}</td><td>${escapeHtml((term.genes || []).join(", "))}</td></tr>`).join("") || `<tr><td colspan="6">没有达到阈值的条目</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="enrichment-actions">
      ${[["go-bar", "GO 条形图"], ["kegg-bar", "KEGG 条形图"], ["go-dot", "GO 气泡图"], ["kegg-dot", "KEGG 气泡图"], ["go-map", "富集网络"], ["go-table", "GO 表"], ["kegg-table", "KEGG 表"], ["genes", "输入基因"], ["metadata", "元数据"]].map(([id, label]) => `<button type="button" class="export-button" data-enrich-action="download-${id}">${label}</button>`).join("")}
    </div>
  `;
}

function plotField(kind) {
  return { "go-bar": "goBar", "kegg-bar": "keggBar", "go-dot": "goDot", "kegg-dot": "keggDot", "go-map": "goMap" }[kind];
}

function inlineSvg(svg) {
  return String(svg || "").replace(/<\?xml[^>]*>\s*/, "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTerm(term) {
  const genes = Array.isArray(term.genes) ? term.genes : String(term.genes || "").split(/[|/]/).filter(Boolean);
  return { ...term, genes };
}

function formatP(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number < 0.001 ? number.toExponential(2) : number.toFixed(4);
}

function downloadEnrichment(kind) {
  const job = state.enrichmentJob;
  if (!job || job.status !== "done") return;
  const result = job.result;
  const plotFiles = { "go-bar": "tcm-go-bar.svg", "kegg-bar": "tcm-kegg-bar.svg", "go-dot": "tcm-go-dot.svg", "kegg-dot": "tcm-kegg-dot.svg", "go-map": "tcm-enrichment-map.svg" };
  if (plotFiles[kind]) {
    const svg = result.plots?.[plotField(kind)];
    if (!svg) return toast("这张图没有生成。");
    downloadFile(plotFiles[kind], svg, "image/svg+xml;charset=utf-8");
    return;
  }
  if (kind === "go-table" || kind === "kegg-table") {
    const rows = kind === "go-table" ? result.go : result.kegg;
    downloadFile(kind === "go-table" ? "tcm-go-results.csv" : "tcm-kegg-results.csv", termsToCsv(rows), "text/csv;charset=utf-8");
    return;
  }
  if (kind === "genes") {
    downloadFile("tcm-input-genes.json", JSON.stringify({ genes: job.input.genes, signature: job.input.signature }, null, 2), "application/json;charset=utf-8");
    return;
  }
  if (kind === "metadata") {
    const formula = db.formulas.find((item) => item.id === state.formulaId);
    downloadFile("tcm-enrichment-metadata.json", JSON.stringify({
      generatedAt: new Date().toISOString(),
      retrievedAt: result.retrievedAt,
      formula: formula ? { id: formula.id, name: formula.name, source: formula.source } : null,
      confidenceThreshold: state.minConfidence,
      engine: result.engine,
      engineDetail: result.engineDetail,
      fallbackReason: result.fallbackReason,
      organism: result.organism,
      organismCode: result.organismCode,
      idMapping: result.idMapping,
      adjustment: result.adjustment,
      packages: result.packages,
      databaseSources: result.databaseSources,
      submittedGenes: job.input.genes.map((gene) => gene.symbol),
      geneSources: job.input.genes,
      mapped: result.mapped,
      unmapped: result.unmapped,
      notes: result.notes
    }, null, 2), "application/json;charset=utf-8");
  }
}

function termsToCsv(terms) {
  const header = ["id", "name", "ontology", "pValue", "pAdjust", "qValue", "geneCount", "geneRatio", "bgRatio", "genes"];
  const rows = terms.map((term) => header.map((key) => key === "genes" ? (term.genes || []).join("|") : term[key]));
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function renderCompoundVisual() {
  const compounds = selectedCompounds().sort((a, b) => b.ob - a.ob);
  $("#visualPanel").innerHTML = `
    <div class="visual-bars">
      ${compounds.map((compound) => `
        <div class="wide-bar">
          <strong>${compound.cn}</strong>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, compound.ob)}%"></div></div>
          <span>OB ${compound.ob}% · DL ${compound.dl}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderEvidenceVisual() {
  const rows = countValues(state.activeHerbs.flatMap((herb) => herb.sources));
  const max = Math.max(1, ...rows.map(([, value]) => value));
  $("#visualPanel").innerHTML = `
    <div class="visual-bars">
      ${rows.map(([source, count]) => `
        <div class="wide-bar">
          <strong>${source}</strong>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
          <span>${count} 条药材证据</span>
        </div>
      `).join("")}
    </div>
  `;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportEdgesCsv() {
  const rows = [["source", "target", "relation", "score"], ...state.network.edges.map((edge) => [edge.source, edge.target, edge.label, edge.score])];
  downloadFile("tcm-network-edges.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  toast("已导出网络边 CSV。");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportAnalysisJson() {
  const payload = {
    generatedAt: new Date().toISOString(),
    formula: db.formulas.find((item) => item.id === state.formulaId),
    herbs: state.activeHerbs,
    compounds: selectedCompounds(),
    targets: selectedTargets(),
    pathways: selectedPathways(),
    diseases: selectedDiseases(),
    network: state.network
  };
  downloadFile("tcm-analysis.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  toast("已导出分析 JSON。");
}

function exportSvg() {
  const svg = $("#networkSvg").cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String($("#networkSvg").clientWidth || 900));
  svg.setAttribute("height", "520");
  const styles = `<style>.edge{fill:none;stroke:#b8c7bf;stroke-width:1.35;opacity:.72}.node text{font:12px sans-serif;paint-order:stroke;stroke:#fff;stroke-width:4px;fill:#18241e}</style>`;
  svg.insertAdjacentHTML("afterbegin", styles);
  downloadFile("tcm-network.svg", new XMLSerializer().serializeToString(svg), "image/svg+xml;charset=utf-8");
  toast("已导出网络 SVG。");
}

function exportMarkdown() {
  const formula = db.formulas.find((item) => item.id === state.formulaId);
  const lines = [
    `# ${formula?.name || "自定义处方"} 分析报告`,
    "",
    `- 药味数：${state.activeHerbs.length}`,
    `- 候选成分：${selectedCompounds().length}`,
    `- 预测靶点：${selectedTargets().length}`,
    `- 通路：${selectedPathways().map((item) => item.cn).join("、")}`,
    `- 疾病关联：${selectedDiseases().map((item) => item.cn).join("、")}`,
    "",
    "## 药材",
    ...state.activeHerbs.map((herb) => `- ${herb.name}：${herb.nature}，${(herb.flavors || []).join("/")}，归 ${(herb.meridians || []).join("、")} 经；${(herb.effects || []).join("、")}`),
    "",
    "## 主要靶点",
    ...selectedTargets().map((target) => `- ${target.symbol}：${target.name}，最高置信度 ${target.score}`)
  ];
  downloadFile("tcm-analysis-report.md", lines.join("\n"), "text/markdown;charset=utf-8");
  toast("已导出 Markdown 报告。");
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error(error);
    const message = "数据文件加载失败，请检查 app/data/*.json，或通过本地服务 / GitHub Pages 访问。";
    const toastEl = $("#toast");
    if (toastEl) {
      toastEl.textContent = message;
      toastEl.classList.add("show");
    }
    const searchResults = $("#searchResults");
    if (searchResults) searchResults.innerHTML = `<div class="result-card"><h4>数据加载失败</h4><p>${message}</p></div>`;
  });
});
