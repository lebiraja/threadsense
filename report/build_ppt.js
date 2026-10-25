// Builds ThreadSense_IA3.pptx (10 slides). Run from the repo root: node report/build_ppt.js
const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.title = "ThreadSense: IA3 Big Data";
pres.author = "Lebi";

const BG = "14130F", INK = "F0EBDD", MUTED = "A8A294", AMBER = "F5A623", LINE = "3A372E", PANEL = "1F1D17";
const HEAD = "Courier New", BODY = "Calibri";
const FOOT = "ThreadSense · IA3 Big Data";

function base(title, n) {
  const s = pres.addSlide();
  s.background = { color: BG };
  s.addText(title, { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: INK, margin: 0, isTextBox: true, objectName: "title" });
  s.addText(FOOT, { x: 0.6, y: 5.2, w: 5, h: 0.25, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, isTextBox: true });
  s.addText(String(n), { x: 8.9, y: 5.2, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 10, color: MUTED, align: "right", margin: 0, isTextBox: true });
  return s;
}
const bullets = (items, o) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } }));
const txt = (s, t, o) => s.addText(t, { fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true, ...o });

// 1. Title
{
  const s = pres.addSlide(); s.background = { color: BG };
  s.addText("BIG DATA (BDTT) · IA3 PROJECT", { x: 0.7, y: 0.8, w: 8, h: 0.3, fontFace: BODY, fontSize: 12, color: MUTED, bold: true, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("ThreadSense", { x: 0.7, y: 1.4, w: 8.6, h: 1.1, fontFace: HEAD, fontSize: 60, bold: true, color: AMBER, margin: 0, isTextBox: true });
  s.addText("Discovering Which Reddit Communities You Belong In", { x: 0.7, y: 2.6, w: 8.2, h: 0.9, fontFace: HEAD, fontSize: 24, color: INK, margin: 0, isTextBox: true });
  s.addText("A MongoDB MapReduce pipeline over 1,013,000 Reddit posts", { x: 0.7, y: 3.7, w: 8.2, h: 0.4, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0, isTextBox: true });
  s.addText("Lebi · B.Tech AI & DS · Karunya Institute of Technology and Sciences · Faculty: Dr. Grace Mary Kanaga E.", { x: 0.7, y: 4.7, w: 8.6, h: 0.3, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes("Title slide. One line: we recommend which Reddit communities a piece of text belongs in, using MapReduce on MongoDB.");
}

// 2. Problem
{
  const s = base("Problem statement", 2);
  txt(s, "Reddit has thousands of communities. A newcomer cannot tell which ones fit their question, and analysts have no compact view of how communities relate.", { x: 0.6, y: 1.2, w: 5.2, h: 1.1, fontSize: 16 });
  s.addText(bullets(["Input: any piece of text", "Output: the 5 best-fit subreddits, with the words that drove each score", "Also: a map of how 1,013 communities relate", "Built as a batch big-data pipeline, evaluated on unseen posts"]),
    { x: 0.6, y: 2.5, w: 5.2, h: 2.4, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addText("1,013", { x: 6.3, y: 1.4, w: 3.2, h: 1.0, fontFace: HEAD, fontSize: 54, bold: true, color: AMBER, margin: 0, isTextBox: true });
  txt(s, "communities to choose from", { x: 6.3, y: 2.4, w: 3.2, h: 0.4, color: MUTED });
  s.addText("0.1%", { x: 6.3, y: 3.3, w: 3.2, h: 1.0, fontFace: HEAD, fontSize: 54, bold: true, color: INK, margin: 0, isTextBox: true });
  txt(s, "chance of a random guess being right", { x: 6.3, y: 4.3, w: 3.2, h: 0.6, color: MUTED });
  s.addNotes("The task is a 1,013-way choice, so random guessing is 0.1%. Everything we report is against that.");
}

// 3. Dataset
{
  const s = base("Dataset", 3);
  txt(s, "Reddit self-post classification task (Kaggle, mswarbrickjones)", { x: 0.6, y: 1.15, w: 8.8, h: 0.35, color: MUTED, fontSize: 14 });
  const stats = [["1,013,000", "posts"], ["1,013", "subreddits"], ["~147", "words per post"], ["39", "categories"]];
  stats.forEach(([n, l], i) => {
    s.addText(n, { x: 0.6 + i * 2.3, y: 1.7, w: 2.2, h: 0.8, fontFace: HEAD, fontSize: 24, bold: true, color: AMBER, margin: 0, isTextBox: true });
    txt(s, l, { x: 0.6 + i * 2.3, y: 2.5, w: 2.2, h: 0.35, color: MUTED });
  });
  s.addText(bullets([
    "Unstructured text: titles and bodies with markdown, links and HTML entities",
    "About 1,000 posts per subreddit; fields: id, subreddit, title, selftext",
    "Limit: no author and no timestamp, so the recommender is content-based, not per-user",
    "Limit: balanced classes make the baseline near zero by construction",
  ]), { x: 0.6, y: 3.1, w: 8.8, h: 1.9, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Be upfront: the dataset has no author or time, which is why we pivoted from per-user to content-based. kaggle.com/datasets/mswarbrickjones/reddit-selfposts");
}

// 4. Methodology
{
  const s = base("Methodology: a batch pipeline", 4);
  const steps = [["Ingest", "1,013,000"], ["Clean", "1,012,997"], ["Split", "911k / 101k"], ["Job 1", "8.1M counts"], ["Job 2", "69,944 words"], ["Job 3", "1,013 subs"], ["Job 4", "top-5 + eval"]];
  const w = 1.18, gap = 0.1;
  steps.forEach(([a, b], i) => {
    const x = 0.6 + i * (w + gap), job = a.startsWith("Job");
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w, h: 1.2, fill: { color: job ? AMBER : PANEL }, line: { color: LINE, width: 1 }, objectName: "step " + a });
    s.addText(a, { x, y: 1.5, w, h: 0.45, fontFace: HEAD, fontSize: 14, bold: true, color: job ? BG : INK, align: "center", margin: 0, isTextBox: true });
    s.addText(b, { x, y: 1.95, w, h: 0.5, fontFace: BODY, fontSize: 12, color: job ? BG : MUTED, align: "center", margin: 0, isTextBox: true });
  });
  s.addText(bullets([
    "Job 1: word counts per subreddit, each word once per post (MapReduce)",
    "Job 2: TF-IDF inverted index, weight = (1 + ln c) × ln(N / df) (MapReduce)",
    "Job 3: cosine similarity between subreddit vectors (MapReduce)",
    "Job 4: score pasted text against the index; evaluate on 10% held-out posts",
  ]), { x: 0.6, y: 3.0, w: 8.8, h: 2.0, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Every step logs records in, records out and duration to MongoDB; the UI reads those logs. Held-out posts are never seen by Jobs 1 to 3.");
}

// 5. Tools
{
  const s = base("Tools used", 5);
  const rows = [["Storage + MapReduce", "MongoDB 7.0 (mapReduce command)"], ["Pipeline runner", "Python 3.12, pymongo"], ["Back end", "FastAPI, Pydantic"],
    ["Front end", "Next.js, TypeScript, Tailwind"], ["Data source", "Kaggle CLI"], ["Everything runs in", "Docker Compose, with healthchecks"]];
  rows.forEach(([a, b], i) => {
    const y = 1.3 + i * 0.58;
    s.addText(a, { x: 0.6, y, w: 3.2, h: 0.45, fontFace: HEAD, fontSize: 14, bold: true, color: AMBER, margin: 0, valign: "middle", isTextBox: true });
    s.addText(b, { x: 3.9, y, w: 5.5, h: 0.45, fontFace: BODY, fontSize: 16, color: INK, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 0.6, y: y + 0.52, w: 8.8, h: 0, line: { color: LINE, width: 0.75 } });
  });
  s.addNotes("Hadoop and Spark were not needed: the brief asks for MongoDB and MapReduce, and this size runs on one machine. They are the scale-out path.");
}

// 6. MapReduce code
{
  const s = base("MapReduce code (Jobs 1 and 2)", 6);
  const code = (t, x, w) => s.addText(t, { x, y: 1.2, w, h: 3.75, fontFace: "Courier New", fontSize: 10.5, color: INK, margin: 8, valign: "top", fill: { color: PANEL }, isTextBox: true });
  code("// Job 1: map\nfunction () {\n  var seen = {};\n  var words = this.text.split(' ');\n  for (var i = 0; i < words.length; i++) {\n    var w = words[i];\n    if (w.length < 3 || w.length > 20\n        || STOP[w] || seen[w]) continue;\n    seen[w] = 1;\n    emit(w + '|' + this.subreddit, 1);\n  }\n}\n// Job 1: reduce\nfunction (key, values) {\n  return Array.sum(values);\n}", 0.6, 4.3);
  code("// Job 2: finalize (TF-IDF)\nfunction (key, v) {\n  var df = v.p.length;\n  if (df > MAX_DF)\n    return {p: [], df: df};\n  var idf = Math.log(N_SUB / df);\n  var out = v.p.map(function (x) {\n    return [x[0],\n      (1 + Math.log(x[1])) * idf];\n  });\n  out.sort(function (a, b) {\n    return b[1] - a[1]; });\n  return {p: out.slice(0, TOP), df: df};\n}", 5.1, 4.3);
  s.addNotes("Map emits word|subreddit once per post. Reduce sums. Job 2's reduce concatenates postings and finalize turns counts into TF-IDF. Full code is in the report and the repo.");
}

// 7. Results: accuracy
{
  const s = base("Results: recommendation quality", 7);
  s.addText("72.6%", { x: 0.6, y: 1.25, w: 3.4, h: 0.9, fontFace: HEAD, fontSize: 48, bold: true, color: AMBER, margin: 0, isTextBox: true });
  txt(s, "top-1 accuracy", { x: 0.6, y: 2.15, w: 3.4, h: 0.35, color: MUTED });
  s.addText("89.1%", { x: 0.6, y: 2.8, w: 3.4, h: 0.9, fontFace: HEAD, fontSize: 48, bold: true, color: AMBER, margin: 0, isTextBox: true });
  txt(s, "hit rate at 5", { x: 0.6, y: 3.7, w: 3.4, h: 0.35, color: MUTED });
  txt(s, "5,000 held-out posts, 1,013 classes. The baseline is near zero because classes are balanced.", { x: 0.6, y: 4.2, w: 3.4, h: 0.8, fontSize: 12, color: MUTED });
  s.addChart(pres.charts.BAR, [
    { name: "ThreadSense (TF-IDF)", labels: ["Top-1 accuracy", "Hit rate @ 5"], values: [72.6, 89.1] },
    { name: "Most-popular baseline", labels: ["Top-1 accuracy", "Hit rate @ 5"], values: [0.02, 0.26] }],
    { x: 4.3, y: 1.2, w: 5.2, h: 3.8, barDir: "col", barGrouping: "clustered", chartColors: [AMBER, "7A7568"],
      showLegend: true, legendPos: "b", legendColor: INK, legendFontFace: "Calibri", legendFontSize: 11,
      showValue: true, dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontFace: "Calibri", dataLabelFormatCode: "0.0#",
      catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "Calibri",
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisMaxVal: 100, valAxisMinVal: 0,
      valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: "none" },
      showTitle: true, title: "% of held-out posts", titleColor: MUTED, titleFontSize: 12, titleFontFace: "Calibri" });
  s.addNotes("The absolute number is what matters: 72.6% on a 1,013-way choice. We say honestly that the baseline gap is large by construction.");
}

// 8. MapReduce vs aggregation
{
  const s = base("MapReduce vs aggregation pipeline", 8);
  s.addChart(pres.charts.BAR, [
    { name: "mapReduce", labels: ["With index", "Without index"], values: [15.44, 16.92] },
    { name: "Aggregation", labels: ["With index", "Without index"], values: [7.25, 8.64] }],
    { x: 0.6, y: 1.2, w: 5.4, h: 3.8, barDir: "col", barGrouping: "clustered", chartColors: [AMBER, "F0EBDD"],
      showLegend: true, legendPos: "b", legendColor: INK, legendFontFace: "Calibri", legendFontSize: 11,
      showValue: true, dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontFace: "Calibri", dataLabelFormatCode: "0.0",
      catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "Calibri",
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisMinVal: 0,
      valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: "none" },
      showTitle: true, title: "seconds, 44,971 posts", titleColor: MUTED, titleFontSize: 12, titleFontFace: "Calibri" });
  s.addText(bullets([
    "Same task, same output: 388,647 documents",
    "Aggregation is about 2x faster",
    "The index helps only slightly: run time is word splitting, not lookup",
    "MongoDB deprecated mapReduce; it still runs on 7.0",
  ]), { x: 6.3, y: 1.4, w: 3.2, h: 3.4, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Word counts for 50 subreddits. Identical output, so the comparison is fair. This supports MongoDB's decision to deprecate mapReduce.");
}

// 9. Visualizations
{
  const s = base("Visualizations and demo", 9);
  s.addImage({ path: "docs/figures/shot_graph.png", x: 0.6, y: 1.2, w: 4.2, h: 2.95 });
  s.addImage({ path: "docs/shots/try-it.png", x: 5.0, y: 1.2, w: 4.4, h: 2.35 });
  txt(s, "Community network from Job 3: related subreddits cluster", { x: 0.6, y: 4.25, w: 4.2, h: 0.6, fontSize: 12, color: MUTED });
  txt(s, "Paste a post, get the top 5 communities and the words behind each score", { x: 5.0, y: 3.65, w: 4.4, h: 0.6, fontSize: 12, color: MUTED });
  txt(s, "Sourdough post → r/Breadit first", { x: 5.0, y: 4.35, w: 4.4, h: 0.4, fontSize: 14, color: AMBER });
  s.addNotes("The UI only reads precomputed results. The recommender scores text against the stored TF-IDF index; it does not run MapReduce live.");
}

// 10. Conclusions
{
  const s = base("Conclusions and future work", 10);
  s.addText("What we showed", { x: 0.6, y: 1.2, w: 4.2, h: 0.35, fontFace: HEAD, fontSize: 16, bold: true, color: AMBER, margin: 0, isTextBox: true });
  s.addText(bullets([
    "1M posts became 69,944 TF-IDF words and 1,013 community profiles in about 12 minutes",
    "72.6% top-1 and 89.1% top-5 on unseen posts",
    "Related communities cluster sensibly",
    "Aggregation beats mapReduce about 2x",
  ]), { x: 0.6, y: 1.65, w: 4.2, h: 3.3, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addText("Limits and next", { x: 5.2, y: 1.2, w: 4.2, h: 0.35, fontFace: HEAD, fontSize: 16, bold: true, color: AMBER, margin: 0, isTextBox: true });
  s.addText(bullets([
    "Batch and laptop scale, not real-time or petabyte",
    "No author or time: add them for per-user and trends",
    "Try embeddings against TF-IDF",
    "Scale out with Hadoop or Spark, stream with Kafka, graph in Neo4j",
  ]), { x: 5.2, y: 1.65, w: 4.2, h: 3.3, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Code: github.com/lebiraja/threadsense (private). Dataset: kaggle.com/datasets/mswarbrickjones/reddit-selfposts");
}

pres.writeFile({ fileName: "report/ThreadSense_IA3.pptx" }).then(() => console.log("written"));
