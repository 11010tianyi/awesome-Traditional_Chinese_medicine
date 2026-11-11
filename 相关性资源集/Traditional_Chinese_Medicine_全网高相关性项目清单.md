# Awesome Traditional Chinese Medicine（本项目）全网高相关性项目集合

> **说明**：本文档以本项目「中医药基础药物信息查询、中医药处方分析、网络药理学、知识图谱与可视化」定位为锚点，汇总高度相关的网页数据库、开源工具、处方分析项目、网络药理学流程和通用可视化/富集分析底座。  
> **整理时间**：2026-05-16。检索范围包含公开 Web、GitHub、数据库官网、论文配套项目；已排除用户指定的 `salahalsh/NeXus`。  
> **排序规则**：按 **与本项目主题的相关性得分（10 分制，高到低）** 降序排列；同分时优先「即开即用数据库/网站 → 可运行开源工具 → 论文代码/单病种流程 → 通用底座」。

**相关性打分维度（综合）**

1. 是否覆盖 **中药/方剂/成分/靶点/疾病/通路** 等核心实体；
2. 是否支持 **处方或复方分析**，包括活性成分筛选、药味归经、药对/共现、核心处方、聚类等；
3. 是否支持 **网络药理学流程**，包括靶点预测、PPI、GO/KEGG 富集、分子对接、网络可视化；
4. 是否提供 **Web 查询、API、可下载数据或可复用代码**；
5. 是否适合后续建设「中医药工具网站」时作为数据源、功能对照或技术栈参考。

---

## 相关性排序总表（含链接直达）

| 排序 | 相关性 | 名称 | 类型 | 链接直达 | 一句话定位 |
|:---:|:---:|:---|:---|:---|:---|
| 1 | **10/10** | **TCMSP** | 数据库/网站 | https://old.tcmsp-e.com/tcmsp.php | 中药系统药理学经典入口，常用于药材、成分、ADME、靶点初筛 |
| 2 | **10/10** | **BATMAN-TCM** | 数据库/网站 | http://bionet.ncpsb.org.cn/batman-tcm/ | 面向中药分子机制解析的网络药理学分析工具，和本项目主题高度同构 |
| 3 | **9.5/10** | **HERB** | 数据库/网站 | http://herb.ac.cn/ | 整合高通量实验与参考证据的中药数据库，适合药物-靶点-疾病查询 |
| 4 | **9.5/10** | **ETCM** | 数据库/网站 | http://www.tcmip.cn/ETCM/ | 中药百科式数据库，覆盖药材、成分、靶点、方剂与疾病关联 |
| 5 | **9.2/10** | **TCMNP** | GitHub / R 包 | https://github.com/tcmlab/TCMNP | R 生态中较贴近完整网络药理学流程的中医药分析包 |
| 6 | **9/10** | **HerbiV** | GitHub / Python | https://github.com/MLi-lab-Bioinformatics-NJUCM/HerbiV | 支持经典网络药理学与反向网络药理学，适合工具站后端流程参考 |
| 7 | **8.8/10** | **TCMNPAS** | GitHub / 平台 | https://github.com/yangpluszhu/tcmnpas | 中医药综合分析平台，定位与「查询+分析」工具网站接近 |
| 8 | **8.5/10** | **SymMap** | 数据库/网站 | https://www.symmap.org/ | 将症状、证候、中药、成分、靶点、疾病做多层映射 |
| 9 | **8.3/10** | **TCMID** | 数据库/网站 | http://www.megabionet.org/tcmid/ | 中药综合数据库，常用于方剂、成分、疾病和靶点关联检索 |
| 10 | **8/10** | **TCM-ID** | 数据库/网站 | https://bidd.group/TCM-ID/ | 香港浸会大学相关中医药信息数据库，适合药材/方剂基础信息对照 |
| 11 | **8/10** | **TCMSID** | 数据库/网站 | https://tcm.scbdd.com/ | 中药成分、靶点、疾病、通路和网络分析相关平台 |
| 12 | **7.8/10** | **NP-TCMtarget** | GitHub / Python | https://github.com/lipi12q/NP-TCMtarget | 面向中药作用机制探索的网络药理学平台代码 |
| 13 | **7.7/10** | **TCM-NetMiner** | GitHub / Python | https://github.com/Shiqi-Wu/TCM-NetMiner | 用爬虫和筛选流程获取复方活性分子及其对应靶点 |
| 14 | **7.6/10** | **TCM-Network-Pharmacology** | GitHub / R+Python | https://github.com/TianweiShen/TCM-Network-Pharmacology | 覆盖网络药理学、预后基因、分子对接和图表绘制的流程集合 |
| 15 | **7.5/10** | **immcp** | GitHub / R 包 | https://github.com/YuanlongHu/immcp | 中医药多药理学工具包，可作 R 端分析能力补充 |
| 16 | **7.3/10** | **TCMSP-data-harvest** | GitHub / Python | https://github.com/peterxiashidage/TCMSP-data-harvest | 面向 TCMSP 数据采集自动化，适合研究流程减负但需注意站点规则 |
| 17 | **7.2/10** | **SinoMedMiner** | GitHub / R 包 | https://github.com/Tianyi-TCM/SinoMedMiner | 专为中医药处方设计的数据挖掘 R 包，补足处方分析维度 |
| 18 | **7.1/10** | **GraphAI-for-TCM** | GitHub / Notebook | https://github.com/ZENGJingqi/GraphAI-for-TCM | 用图 AI 做中药配伍定量评价，偏算法研究但主题贴近 |
| 19 | **6.9/10** | **TCM_knowledge_graph** | GitHub / Python | https://github.com/AI-HPC-Research-Team/TCM_knowledge_graph | 面向中医药分析的大型知识图谱项目，可作为实体关系建模参考 |
| 20 | **6.8/10** | **PTM** | GitHub / Java | https://github.com/yao8839836/PTM | 中医处方主题模型方法，适合处方规律挖掘方向参考 |
| 21 | **6.7/10** | **TCM_Recommendation-system** | GitHub / 知识图谱 | https://github.com/HubertTCMAtNz/TCM_Recommendation-system | 基于知识图谱的中医处方推荐系统，适合推荐模块参考 |
| 22 | **6.6/10** | **KGR4TCM** | GitHub / Python | https://github.com/QuXiaolong0812/KGR4TCM | 中医药知识图谱智能推荐系统，偏算法/推荐场景 |
| 23 | **6.5/10** | **Chinese_Medicine** | GitHub / Python | https://github.com/yasenstar/Chinese_Medicine | 中医领域知识图谱与知识库实践项目 |
| 24 | **6.3/10** | **LarKnow** | GitHub / Notebook | https://github.com/rebornyhy/LarKnow | 知识图谱增强的大模型架构，用于中药方剂机制解释 |
| 25 | **6.2/10** | **TCMLLM** | GitHub / Python | https://github.com/2020MEAI/TCMLLM | 中医药大模型项目，适合作为问答/解释层参考，不是网络药理学核心 |
| 26 | **6.1/10** | **TCMBench** | GitHub / Python | https://github.com/ywjawmw/TCMBench | 中医药大模型评测基准，适合后续工具站 AI 问答评价 |
| 27 | **6/10** | **Cytoscape** | 桌面/开源 | https://cytoscape.org/ | 网络药理学论文最常见网络可视化与拓扑分析工具 |
| 28 | **6/10** | **STRING** | 数据库/网站 | https://string-db.org/ | PPI 网络检索和可视化常用底座 |
| 29 | **5.8/10** | **SwissTargetPrediction** | 数据库/网站 | http://www.swisstargetprediction.ch/ | 小分子潜在靶点预测常用工具，可补足 TCMSP/HERB 靶点 |
| 30 | **5.8/10** | **Enrichr** | 数据库/网站 | https://maayanlab.cloud/Enrichr/ | GO/KEGG/通路富集分析常用在线工具 |

---

## 分项链接与备忘

### 网页数据库 / 即开即用

| 项目 | 主要入口 | 备忘 |
|:---|:---|:---|
| TCMSP | https://old.tcmsp-e.com/tcmsp.php | 常见网络药理学起点；筛选 OB、DL、HL 等 ADME 指标时常用 |
| BATMAN-TCM | http://bionet.ncpsb.org.cn/batman-tcm/ | 可按中药/方剂预测靶点和通路；站点可用性需周期性核验 |
| HERB | http://herb.ac.cn/ | 适合做药材、靶点、疾病证据对照，较适合工具站聚合查询 |
| ETCM | http://www.tcmip.cn/ETCM/ | 中药实体信息丰富，可作药材百科和关系图谱来源 |
| SymMap | https://www.symmap.org/ | 症状/证候映射是其特色，适合中医语义层补充 |
| TCMID | http://www.megabionet.org/tcmid/ | 老牌综合库，注意访问稳定性和字段更新情况 |
| TCM-ID | https://bidd.group/TCM-ID/ | 适合查药材、方剂、化合物和药理条目 |
| TCMSID | https://tcm.scbdd.com/ | 与网络药理学分析关系强，适合纳入后续数据源候选 |

### 开源仓库 / 可二次开发

| 项目 | GitHub 元数据（2026-05-16） | 备忘 |
|:---|:---|:---|
| TCMNP | R；57 stars；GPL-3.0；最近更新 2026-05-12 | 更像完整分析包，优先试跑 |
| HerbiV | Python；50 stars；MIT；最近更新 2026-04-14 | 反向网络药理学是亮点 |
| GraphAI-for-TCM | Notebook；29 stars；MIT；最近更新 2026-05-05 | 偏配伍评价算法，不是传统数据库 |
| TCM-Network-Pharmacology | R；25 stars；最近更新 2026-04-29 | 流程很全，但仓库体积较大，需检查可复现性 |
| TCM_knowledge_graph | Python；25 stars；最近更新 2026-04-28 | 适合知识图谱实体关系设计参考 |
| TCM_Recommendation-system | 24 stars；最近更新 2025-11-12 | 处方推荐方向，但代码维护状态需复核 |
| KGR4TCM | Python；12 stars；最近更新 2025-07-14 | KG 推荐系统，偏方法实现 |
| tcmnpas | C++；10 stars；GPL-3.0；最近更新 2026-01-30 | 平台型项目，值得拆解功能模块 |
| TCM-NetMiner | Python；6 stars；最近更新 2026-01-06 | 数据采集型，适合辅助复方活性成分整理 |
| immcp | R；5 stars；GPL-3.0；最近更新 2023-10-08 | 年代较早但定位清晰 |
| SinoMedMiner | R；3 stars；最近更新 2026-05-02 | 处方挖掘专项，和网络药理学互补 |
| NP-TCMtarget | Python；1 star；最近更新 2025-12-30 | 低星但主题强，适合作为备选核验 |

### 通用网络药理学底座

| 项目 | 入口 | 放入清单的原因 |
|:---|:---|:---|
| Cytoscape | https://cytoscape.org/ | 网络可视化、节点拓扑、模块识别常用 |
| STRING | https://string-db.org/ | PPI 网络获取与蛋白互作证据 |
| SwissTargetPrediction | http://www.swisstargetprediction.ch/ | 小分子靶点预测 |
| PubChem | https://pubchem.ncbi.nlm.nih.gov/ | CID、SMILES、结构信息、同义名标准化 |
| UniProt | https://www.uniprot.org/ | 靶点标准化和蛋白信息 |
| Enrichr | https://maayanlab.cloud/Enrichr/ | 富集分析在线入口 |
| DAVID | https://david.ncifcrf.gov/ | 经典功能注释与富集分析 |
| clusterProfiler | https://bioconductor.org/packages/clusterProfiler/ | R 端 GO/KEGG 富集与可视化 |
| igraph | https://igraph.org/ | R/Python 网络分析底层库 |
| NetworkX | https://networkx.org/ | Python 网络构建、拓扑分析和算法原型 |

---

## 重点条目：最接近「工具网站」的几条路线

### 路线 A：数据库聚合查询

- **TCMSP + HERB + ETCM + SymMap**：最适合做统一搜索入口。  
- 推荐统一实体层：`Herb`、`Formula`、`Compound`、`Target`、`Disease`、`Pathway`、`Syndrome/Symptom`。  
- 关键问题：不同库的药材中文名、拉丁名、拼音、别名、成分 ID、靶点 ID 不一致，需要做映射和来源字段保留。

### 路线 B：网络药理学一键分析

- **TCMNP / HerbiV / TCMNPAS** 是优先参考对象。  
- 标准工作流可设计为：输入药材或方剂 → 成分筛选 → 靶点预测/合并 → 疾病靶点导入 → 交集靶点 → PPI → GO/KEGG → 网络图 → 报告导出。  
- 工具站前端应支持导出 `CSV`、`GraphML`、`Cytoscape JSON`、`PNG/SVG`，便于论文图和二次分析。

### 路线 C：中医处方数据挖掘

- **SinoMedMiner / PTM / GraphAI-for-TCM** 更贴近「处方规律」而不是「分子机制」。  
- 可支持：药物频次、四气五味、归经统计、关联规则、核心药对、处方聚类、主题模型、配伍评分。  
- 若与网络药理学合并，建议先把处方层和成分靶点层分开建模，避免界面和数据解释混杂。

### 路线 D：知识图谱与 AI 解释

- **TCM_knowledge_graph / KGR4TCM / LarKnow / TCMLLM / TCMBench** 适合作为知识图谱和 AI 问答层参考。  
- 推荐作为第二阶段能力：先保证结构化检索、网络图和富集分析可复现，再加 LLM 摘要、机制解释和证据引用。

---

## 可用性与风险备注

- 老牌中医药数据库常见问题是域名迁移、HTTP 访问不稳定、字段更新慢；建议每次使用前核验站点可访问性。
- GitHub 仓库星标低不一定代表不可用，领域小众项目经常如此；但空仓库、无 README、无数据来源说明的项目应降权。
- 自动采集 TCMSP、BATMAN-TCM 等网页数据前，应确认目标网站条款、访问频率和学术使用限制。
- 分子靶点预测、PPI、富集分析结果是计算推断，不能直接等同于药效证据；工具站应保留来源和参数。

---

## 与后续工具网站开发的关系

本项目当前选择 **awesome/资源清单** 形态，是因为全网已存在可用数据库和分析工具；现在更有价值的是建立可维护索引和选型基线。若下一步开发工具网站，推荐的 MVP 模块如下：

| 模块 | 功能 | 可参考资源 |
|:---|:---|:---|
| 统一搜索 | 药材、方剂、成分、靶点、疾病一框检索 | TCMSP、HERB、ETCM、SymMap |
| 处方分析 | 频次、药味归经、药对、关联规则、聚类 | SinoMedMiner、PTM、GraphAI-for-TCM |
| 网络药理学 | 成分-靶点-疾病-通路网络、PPI、GO/KEGG | TCMNP、HerbiV、TCMNPAS、STRING、Enrichr |
| 可视化 | 关系网络、桑基图、富集气泡图、热图 | Cytoscape、NetworkX、igraph、ECharts |
| 导出 | CSV、XLSX、GraphML、PNG/SVG、报告模板 | Cytoscape、R markdown、Quarto |

---

## 维护建议

- **每月核验**：TCMSP、BATMAN-TCM、HERB、ETCM、SymMap、TCMSID 等核心站点是否可访问。
- **每次新增仓库**：记录语言、许可证、stars、最近更新时间、是否有示例数据。
- **每次做工具开发**：优先复用 TCMNP/HerbiV/TCMNPAS 的流程思想，不急于重写全部网络药理学算法。
- **每次写论文或报告**：保留每个靶点、通路、富集条目的来源数据库和检索日期。

---

*整理说明：本文基于公开 Web 检索、GitHub API 元数据、数据库官网入口和中医药网络药理学常用工作流汇编；链接和项目状态会变化，请以各项目官方页面为准。*

