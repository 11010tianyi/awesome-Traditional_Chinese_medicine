# Awesome Traditional Chinese Medicine

> 中医药基础药物信息查询、处方分析、网络药理学、知识图谱与可视化相关数据库、网站、开源工具和研究代码索引。  
> 整理时间：2026-05-16。已排除用户指定的 `salahalsh/NeXus`，并优先收录可直接访问、可复用或可二次开发的资源。

## 结论

全网已有一批可用项目和网站，不建议从零开始先造工具站。更现实的路线是：先用本项目做高质量索引和选型基线；后续如要开发，可围绕 `药材/成分/靶点/疾病/通路/处方` 做聚合查询与可视化前端。

最接近你需求的资源分为三类：

- 数据库/网站：`TCMSP`、`BATMAN-TCM`、`HERB`、`ETCM`、`SymMap`、`TCMID`、`TCM-ID`、`TCMSID`。
- 网络药理学/处方分析工具：`TCMNP`、`HerbiV`、`TCMNPAS`、`TCM-NetMiner`、`NP-TCMtarget`、`immcp`、`SinoMedMiner`。
- 可视化与通用分析底座：`Cytoscape`、`STRING`、`SwissTargetPrediction`、`Enrichr`、`clusterProfiler`、`NetworkX`、`igraph`。

## 高相关性清单

完整排序表、分项链接和使用建议见：

- [Traditional_Chinese_Medicine_全网高相关性项目清单.md](./相关性资源集/Traditional_Chinese_Medicine_全网高相关性项目清单.md)

## MVP 工具网站

已内置一个可运行的浏览器端 MVP：

```bash
npm run dev
```

运行后访问终端输出的本地地址。当前版本包含：

- 统一查询：药材、方剂、成分、靶点、疾病、通路一框检索。
- 分类浏览：首页只展示部分热门结果，点击“查看更多”进入方剂、药材、成分、靶点、通路、疾病分栏浏览。
- 处方分析：识别药味，统计药性、五味、归经，生成核心药对。
- 手动处方：可把当前处方组成保存为自定义方剂，并持久写入 `app/data/custom-formulas.json`。
- 网络药理学：生成药材-成分-靶点-通路-疾病关系网络，并支持靶点置信度筛选。
- 可视化：富集通路、成分 ADME、数据源证据分布。
- 导出：网络边 CSV、分析 JSON、网络 SVG、Markdown 报告。

### 数据同步

前端数据已从 `app.js` 拆分到 `app/data/*.json`，并提供真实来源同步脚本：

```bash
npm run sync:data
```

当前同步器接入了：

- `HERB`：`http://herb.ac.cn/chedi/api/`，回填药材、成分、靶点 ID 和详情链接。
- `SymMap`：`http://www.symmap.org/search/` 表单接口，回填药材、成分、靶点 ID。
- `TCMSP`：`https://www.tcmsp-e.com/tcmspsearch.php` 页面表格接口，解析药材、成分、靶点结果。
- `ETCM`：`http://www.tcmip.cn:18124/home/homeEsSearch/` 与 `home_data`，回填可搜索命中与站点统计。

同步结果写入：

- `app/data/herbs.json`
- `app/data/compounds.json`
- `app/data/targets.json`
- `app/data/sources.json`
- `app/data/sync-status.json`

当前扩展同步会先合并 `scripts/catalog-seeds.mjs` 中的常用实体种子，再回填外部来源 ID。最近一次快照包含：方剂 25 条、药材 58 条、成分 32 条、靶点 24 条。

## 快速入口

### 数据库与网站

| 名称 | 链接 | 适合用途 |
|:---|:---|:---|
| TCMSP | https://old.tcmsp-e.com/tcmsp.php | 中药、成分、ADME、靶点基础查询 |
| BATMAN-TCM | http://bionet.ncpsb.org.cn/batman-tcm/ | 中药网络药理学与机制预测 |
| HERB | http://herb.ac.cn/ | 草药、靶点、疾病、高通量实验与参考证据 |
| ETCM | http://www.tcmip.cn/ETCM/ | 中药百科式实体查询与靶标关联 |
| SymMap | https://www.symmap.org/ | 症状、证候、成分、靶点与疾病映射 |
| TCMID | http://www.megabionet.org/tcmid/ | 中药综合数据库、方剂与成分关系 |
| TCM-ID | https://bidd.group/TCM-ID/ | 中药材、方剂、成分与药理信息 |
| TCMSID | https://tcm.scbdd.com/ | 中药成分、靶点、疾病和通路分析入口 |

### 开源项目

| 名称 | 链接 | 技术栈 | 适合用途 |
|:---|:---|:---|:---|
| TCMNP | https://github.com/tcmlab/TCMNP | R | 中医药网络药理学流程化分析 |
| HerbiV | https://github.com/MLi-lab-Bioinformatics-NJUCM/HerbiV | Python | 经典与反向网络药理学 |
| TCMNPAS | https://github.com/yangpluszhu/tcmnpas | C++/Web | 中药综合分析平台 |
| TCM-NetMiner | https://github.com/Shiqi-Wu/TCM-NetMiner | Python | 处方活性分子与靶点采集 |
| NP-TCMtarget | https://github.com/lipi12q/NP-TCMtarget | Python | 中药作用机制网络药理学平台 |
| TCM-Network-Pharmacology | https://github.com/TianweiShen/TCM-Network-Pharmacology | R/Python | 网络药理学、预后基因、对接、绘图流程 |
| immcp | https://github.com/YuanlongHu/immcp | R | 中医药多药理学工具包 |
| SinoMedMiner | https://github.com/Tianyi-TCM/SinoMedMiner | R | 中医药处方数据挖掘 |

## 后续开发建议

如果后续要把这个 awesome 项目扩展成工具网站，建议优先做一个轻量 MVP：

1. 药材/方剂/成分/疾病统一搜索。
2. 成分-靶点-疾病-通路网络图。
3. 处方组成分析、药味归经统计、共现网络和核心药对。
4. TCMSP/HERB/ETCM/SymMap 等来源字段对照表。
5. Cytoscape/GraphML/CSV/PNG 导出。

## 维护原则

- 优先收录可访问网站、可运行仓库、论文配套代码和能支撑二次开发的数据源。
- 对只含单病种 notebook、空仓库、无说明仓库保持低优先级。
- 每次更新时记录检索日期和 GitHub 元数据，避免把短期失效或空仓库排到前列。
