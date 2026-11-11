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
    text: [item.name, item.pinyin, item.nature, (item.flavors || []).join(" "), (item.meridians || []).join(" "), (item.effects || []).join(" "), externalText(item)].join(" ")
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
    tags: [`p=${item.score}`],
    text: [item.cn, item.name].join(" ")
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
  const rows = targetCounts.map(([id, count]) => ({ ...pathwaysById[id], count })).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map((row) => row.count));
  $("#visualPanel").innerHTML = `
    <div class="visual-bars">
      ${rows.map((row) => `
        <div class="wide-bar">
          <strong>${row.cn}</strong>
          <div class="bar-track"><div class="bar-fill" style="width:${(row.count / max) * 100}%"></div></div>
          <span>${row.count} 靶点 · p=${row.score}</span>
        </div>
      `).join("") || "<p class='hint-row'>暂无富集通路</p>"}
    </div>
  `;
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
