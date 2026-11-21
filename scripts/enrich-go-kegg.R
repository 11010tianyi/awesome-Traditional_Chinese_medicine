args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 2) {
  stop("Usage: Rscript scripts/enrich-go-kegg.R input.json output.json")
}

input_path <- args[[1]]
output_path <- args[[2]]

write_json <- function(payload) {
  if (!requireNamespace("jsonlite", quietly = TRUE)) {
    stop("jsonlite is not installed")
  }
  jsonlite::write_json(payload, output_path, auto_unbox = TRUE, null = "null", digits = NA)
}

fail <- function(message) {
  write_json(list(ok = FALSE, error = message))
  quit(status = 0)
}

missing <- c("jsonlite", "clusterProfiler", "org.Hs.eg.db", "ggplot2")
missing <- missing[!vapply(missing, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) fail(paste("缺少 R 包：", paste(missing, collapse = ", ")))

input <- jsonlite::fromJSON(input_path)
genes <- unique(as.character(input$genes))
genes <- genes[!is.na(genes) & nzchar(genes)]
if (length(genes) < 2) fail("至少需要 2 个基因符号。")

suppressPackageStartupMessages({
  library(clusterProfiler)
  library(org.Hs.eg.db)
  library(ggplot2)
})

package_version_of <- function(name) as.character(utils::packageVersion(name))

mapped <- tryCatch(
  bitr(genes, fromType = "SYMBOL", toType = "ENTREZID", OrgDb = org.Hs.eg.db),
  error = function(error) fail(paste("SYMBOL 到 ENTREZID 映射失败：", error$message))
)
if (is.null(mapped) || nrow(mapped) < 2) fail("org.Hs.eg.db 能映射的人类基因少于 2 个。")

run_go <- function(ontology) {
  tryCatch(
    enrichGO(
      gene = mapped$ENTREZID,
      OrgDb = org.Hs.eg.db,
      keyType = "ENTREZID",
      ont = ontology,
      pAdjustMethod = "BH",
      pvalueCutoff = 0.05,
      qvalueCutoff = 0.2,
      readable = TRUE
    ),
    error = function(error) {
      attr(error, "ontology") <- ontology
      error
    }
  )
}

records_from <- function(result, ontology) {
  if (inherits(result, "error") || is.null(result)) return(list())
  df <- as.data.frame(result)
  if (!nrow(df)) return(list())
  lapply(seq_len(nrow(df)), function(i) {
    list(
      id = as.character(df$ID[[i]]),
      name = as.character(df$Description[[i]]),
      ontology = ontology,
      pValue = as.numeric(df$pvalue[[i]]),
      pAdjust = as.numeric(df$p.adjust[[i]]),
      qValue = as.numeric(df$qvalue[[i]]),
      geneCount = as.integer(df$Count[[i]]),
      geneRatio = as.character(df$GeneRatio[[i]]),
      bgRatio = as.character(df$BgRatio[[i]]),
      genes = strsplit(as.character(df$geneID[[i]]), "/", fixed = TRUE)[[1]]
    )
  })
}

svg_of <- function(plot) {
  if (is.null(plot)) return(NULL)
  file <- tempfile(fileext = ".svg")
  ggplot2::ggsave(file, plot, width = 8, height = 6, device = grDevices::svg)
  paste(readLines(file, warn = FALSE), collapse = "\n")
}

plot_or_note <- function(expr) {
  tryCatch(list(svg = svg_of(expr)), error = function(error) list(svg = NULL, note = error$message))
}

go_bp <- run_go("BP")
go_mf <- run_go("MF")
go_cc <- run_go("CC")
kegg <- tryCatch(
  enrichKEGG(gene = mapped$ENTREZID, organism = "hsa", pvalueCutoff = 0.05, pAdjustMethod = "BH"),
  error = function(error) error
)

if (!inherits(kegg, "error") && !is.null(kegg) && nrow(as.data.frame(kegg))) {
  kegg <- setReadable(kegg, OrgDb = org.Hs.eg.db, keyType = "ENTREZID")
}

notes <- character()
go_errors <- Filter(function(item) inherits(item, "error"), list(BP = go_bp, MF = go_mf, CC = go_cc))
if (length(go_errors)) notes <- c(notes, paste("GO", names(go_errors), "失败：", vapply(go_errors, function(item) item$message, character(1))))
if (inherits(kegg, "error")) notes <- c(notes, paste("KEGG 失败：", kegg$message))

plot_frame <- function(result) {
  if (inherits(result, "error") || is.null(result)) return(NULL)
  df <- as.data.frame(result)
  if (!nrow(df)) return(NULL)
  df <- head(df[order(df$p.adjust), ], 15)
  df$label <- ifelse(nchar(df$Description) > 42, paste0(substr(df$Description, 1, 41), "…"), df$Description)
  df$label <- factor(df$label, levels = rev(df$label))
  df$neglog <- -log10(df$p.adjust)
  df$ratio <- vapply(strsplit(as.character(df$GeneRatio), "/", fixed = TRUE), function(parts) as.numeric(parts[[1]]) / as.numeric(parts[[2]]), numeric(1))
  df
}

top_plot <- function(result, kind) {
  df <- plot_frame(result)
  if (is.null(df)) return(list(svg = NULL, note = "没有达到阈值的条目"))
  if (kind == "bar") {
    plot_or_note(ggplot(df, aes(neglog, label)) + geom_col(fill = "#1c7c82") + labs(x = "-log10(adjusted p)", y = NULL) + theme_minimal(base_size = 11))
  } else {
    plot_or_note(ggplot(df, aes(ratio, label, size = Count, color = neglog)) + geom_point() + scale_color_gradient(low = "#d6e8e2", high = "#145c4e") + labs(x = "Gene ratio", y = NULL, color = "-log10(p.adjust)", size = "Count") + theme_minimal(base_size = 11))
  }
}

map_plot <- function(result) {
  df <- plot_frame(result)
  if (is.null(df) || nrow(df) < 2) return(list(svg = NULL, note = "条目少于 2 条，没有富集网络"))
  gene_sets <- strsplit(as.character(df$geneID), "/", fixed = TRUE)
  edges <- list()
  for (i in seq_len(nrow(df) - 1)) {
    for (j in (i + 1):nrow(df)) {
      inter <- length(intersect(gene_sets[[i]], gene_sets[[j]]))
      union_n <- length(union(gene_sets[[i]], gene_sets[[j]]))
      score <- if (union_n) inter / union_n else 0
      if (score >= 0.2) edges[[length(edges) + 1]] <- data.frame(x = i, y = j, score = score)
    }
  }
  angles <- seq(0, 2 * pi, length.out = nrow(df) + 1)[seq_len(nrow(df))]
  nodes <- data.frame(i = seq_len(nrow(df)), x = cos(angles), y = sin(angles), label = df$label, neglog = df$neglog)
  edge_df <- if (length(edges)) do.call(rbind, edges) else data.frame(x = numeric(), y = numeric(), score = numeric())
  if (nrow(edge_df)) {
    edge_df$x1 <- nodes$x[edge_df$x]
    edge_df$y1 <- nodes$y[edge_df$x]
    edge_df$x2 <- nodes$x[edge_df$y]
    edge_df$y2 <- nodes$y[edge_df$y]
  }
  plot_or_note(
    ggplot() +
      geom_segment(data = edge_df, aes(x = x1, y = y1, xend = x2, yend = y2, linewidth = score), color = "#b7c9c2") +
      geom_point(data = nodes, aes(x, y, color = neglog), size = 6) +
      geom_text(data = nodes, aes(x, y, label = label), size = 2.6, vjust = -1.2) +
      scale_color_gradient(low = "#d6e8e2", high = "#145c4e") +
      theme_void() +
      labs(color = "-log10(p.adjust)", title = "Enrichment map from gene overlap (Jaccard >= 0.2)")
  )
}

go_bar <- top_plot(go_bp, "bar")
go_dot <- top_plot(go_bp, "dot")
kegg_bar <- top_plot(kegg, "bar")
kegg_dot <- top_plot(kegg, "dot")
go_map <- map_plot(go_bp)
notes <- c(notes, Filter(Negate(is.null), list(go_bar$note, go_dot$note, kegg_bar$note, kegg_dot$note, go_map$note)))

payload <- list(
  ok = TRUE,
  engine = "clusterProfiler",
  organism = "Homo sapiens",
  organismCode = "hsa",
  idMapping = "org.Hs.eg.db SYMBOL -> ENTREZID",
  adjustment = "BH",
  retrievedAt = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
  packages = list(
    clusterProfiler = package_version_of("clusterProfiler"),
    org.Hs.eg.db = package_version_of("org.Hs.eg.db"),
    DOSE = package_version_of("DOSE"),
    ggplot2 = package_version_of("ggplot2")
  ),
  sources = list(
    list(name = "Gene Ontology", url = "http://geneontology.org/"),
    list(name = "KEGG", url = "https://www.kegg.jp/"),
    list(name = "org.Hs.eg.db", url = "https://bioconductor.org/packages/org.Hs.eg.db/"),
    list(name = "clusterProfiler", url = "https://doi.org/10.1016/j.xinn.2021.100141")
  ),
  mapped = lapply(seq_len(nrow(mapped)), function(i) list(symbol = mapped$SYMBOL[[i]], entrez = mapped$ENTREZID[[i]])),
  unmapped = setdiff(genes, mapped$SYMBOL),
  go = c(records_from(go_bp, "BP"), records_from(go_mf, "MF"), records_from(go_cc, "CC")),
  kegg = records_from(kegg, "KEGG"),
  plots = list(
    goBar = go_bar$svg,
    goDot = go_dot$svg,
    keggBar = kegg_bar$svg,
    keggDot = kegg_dot$svg,
    goMap = go_map$svg
  ),
  notes = unique(notes)
)

write_json(payload)
