// Builds ThreadSense_IA3_Report.docx. Run from the repo root: node report/build_report.js
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, BorderStyle, LevelFormat, PageBreak, Footer, PageNumber, TabStopType,
} = require("docx");

const FONT = "Arial", AMBER = "B8740A", GREY = "666666", W = 9386; // content width in DXA (A4, 2.2 cm margins)
const read = (f) => fs.readFileSync(f, "utf8");

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 22, ...o });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 300 }, ...o,
  children: Array.isArray(t) ? t : [run(t)] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 },
  children: [new TextRun({ text: t, font: FONT, size: 30, bold: true, color: "1D1D1B" })],
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AMBER, space: 4 } } });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 },
  children: [new TextRun({ text: t, font: FONT, size: 24, bold: true, color: AMBER })] });
const bullet = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 80, line: 290 },
  children: Array.isArray(t) ? t : [run(t)] });
const bold = (t) => run(t, { bold: true });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
  children: [run(t, { italics: true, size: 18, color: GREY })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(rows, widths, header = true) {
  const sum = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: sum, type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({ tableHeader: header && i === 0,
      children: r.map((c, j) => new TableCell({ borders, width: { size: widths[j], type: WidthType.DXA },
        margins: { top: 70, bottom: 70, left: 110, right: 110 },
        shading: header && i === 0 ? { fill: "F3E7D0", type: ShadingType.CLEAR, color: "auto" } : undefined,
        children: [new Paragraph({ spacing: { after: 0 }, children: [run(String(c), { size: 19, bold: header && i === 0 })] })] })) })) });
}
function code(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({ borders, width: { size: W, type: WidthType.DXA },
      shading: { fill: "F6F6F4", type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: lines.map((l) => new Paragraph({ spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: l === "" ? " " : l, font: "Courier New", size: 17 })] })) })] })] });
}
function img(path, widthPx) {
  const b = fs.readFileSync(path);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: "png", data: b, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: path, description: path, name: path } })] });
}
const between = (src, start, end) => { const a = src.indexOf(start); return src.slice(a, src.indexOf(end, a) + end.length); };
const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

// MapReduce code, taken from the repo so the report always matches what ran
const j1 = read("pipeline/job1_wordcount.py"), j2 = read("pipeline/job2_index.py"), j3 = read("pipeline/job3_similarity.py");
// Pull the JavaScript out of `NAME = Code("""...""")` / `NAME = Code("...")` in a pipeline file
function jsOf(src, names) {
  return names.map((n) => {
    const m = src.match(new RegExp(n + ' = Code\\((?:"""([\\s\\S]*?)"""|"([^"\\n]*)")\\)'));
    if (!m) throw new Error("not found: " + n);
    return "// " + n.toLowerCase().replace("_", " ") + "\n" + (m[1] ?? m[2]).trim();
  }).join("\n\n");
}
const JOB1 = jsOf(j1, ["MAP", "REDUCE"]);
const JOB2 = jsOf(j2, ["MAP", "REDUCE", "FINALIZE"]);
const JOB3 = jsOf(j3, ["NORM_MAP", "PAIR_MAP", "SUM"]);
const clean = (s) => s;

const cover = [
  new Paragraph({ spacing: { before: 1800, after: 120 }, children: [run("BIG DATA (BDTT) · IA3 PROJECT REPORT", { size: 20, color: GREY, bold: true })] }),
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "ThreadSense", font: FONT, size: 76, bold: true, color: AMBER })] }),
  new Paragraph({ spacing: { after: 600 }, children: [run("Discovering Which Reddit Communities You Belong In", { size: 34 })] }),
  p("A MongoDB MapReduce pipeline over 1,013,000 Reddit posts that builds TF-IDF community profiles and recommends the best-fit subreddits for any piece of text.", { spacing: { after: 700, line: 320 } }),
  table([["Course", "Big Data (BDTT)"], ["Assessment", "IA3 Project (30 marks)"], ["Faculty", "Dr. Grace Mary Kanaga E."],
    ["Institution", "Karunya Institute of Technology and Sciences"], ["Programme", "B.Tech Artificial Intelligence and Data Science"],
    ["Student", "Lebi        Register No.: ______________"], ["Submission date", "25 October 2026"],
    ["Source code", "https://github.com/lebiraja/threadsense (private; access on request)"]], [2300, W - 2300], false),
  new Paragraph({ children: [new PageBreak()] }),
];

const body = [
  h1("1. Problem Statement"),
  p("Reddit is split into thousands of topic communities called subreddits. A newcomer who wants to discuss a question has no easy way to know which communities exist for it, and moderators and analysts have no compact way to see how communities relate to each other. Searching by keyword finds posts, not the right place to post."),
  p([bold("Objective. "), run("Given any piece of text, return the five Reddit communities where it fits best, and show how the 1,013 communities in the data relate to one another. The system is built as a batch big-data pipeline: the data is ingested into MongoDB, cleaned, and processed with MapReduce, and the result is evaluated on posts the system has never seen.")]),
  p("Specific goals:"),
  bullet("Ingest a large, semi-structured Kaggle dataset (more than 50,000 records required; we use over one million) into MongoDB."),
  bullet("Clean and preprocess the free text."),
  bullet("Use MapReduce in MongoDB to build a TF-IDF profile for every community and to measure how similar communities are."),
  bullet("Measure recommendation quality honestly on held-out data against a baseline, and compare MapReduce with MongoDB's aggregation pipeline."),
  bullet("Present the results through a web interface and a live demo."),

  h1("2. Dataset Description"),
  p([bold("Source: "), run("Reddit self-post classification task (mswarbrickjones) on Kaggle: https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts")]),
  p("The dataset contains Reddit self-posts (text posts) from 1,013 subreddits, with about 1,000 posts per subreddit. The posts are free-form, unstructured natural language: titles and bodies written by users, with markdown, links, HTML entities and a line-break marker (<lb>). A second file describes each subreddit with a category."),
  table([["Property", "Value"],
    ["File", "rspct.tsv (about 880 MB) and subreddit_info.csv (about 200 KB)"],
    ["Records", "1,013,000 posts"],
    ["Subreddits", "1,013 (about 1,000 posts each; min 999)"],
    ["Fields", "id, subreddit, title, selftext"],
    ["Subreddit metadata", "category_1 to category_3 (39 distinct categories), in_data, reason_for_exclusion"],
    ["Average post length", "about 147 words after cleaning"],
    ["Largest categories", "video_game (100 subreddits), tv_show (68), health (58), profession (56), software (52)"],
    ["Licence", "Apache-2.0 (as reported by the Kaggle API)"]], [2600, W - 2600]),
  spacer(),
  h2("Why this dataset qualifies"),
  p("The text is unstructured, the volume is above one million records, and it is a public Kaggle dataset. It is stored in MongoDB as documents and processed with MapReduce."),
  h2("Limitations of the dataset"),
  bullet([bold("No author and no timestamp. "), run("The file has only post id, subreddit, title and text. Because of this we could not build a per-user recommender or time-based trends, and the project is a content-based recommender instead. We first considered a second Kaggle dataset (reddit-submissions), but it turned out to be about 2 GB of raw HTML pages and was dropped.")]),
  bullet([bold("Balanced classes. "), run("Every subreddit has about 1,000 posts, so a baseline that always predicts the most popular subreddit is almost always wrong (about 0.1% chance per post). The baseline is therefore a weak yardstick by construction, and the absolute accuracy is the more meaningful figure.")]),
  bullet([bold("Community names leak into the text. "), run("Some of the strongest words for a community are its own name (for example “breadit” for r/Breadit), which makes classification somewhat easier than for text that never mentions the community.")]),
  img("docs/figures/categories.png", 520), caption("Figure 1. Posts per subreddit category (top 12 of 39)."),

  h1("3. Methodology"),
  h2("3.1 Pipeline overview"),
  p("The system is a batch pipeline. Every step reads from and writes to MongoDB, and each step records its input count, output count and duration in a pipeline_logs collection, which the web interface displays."),
  table([["#", "Step", "What it does", "Input", "Output"],
    ["1", "Ingest", "mongoimport of the TSV into posts_raw", "1,013,000", "1,013,000"],
    ["2", "Clean", "Remove duplicate ids, strip <lb>, HTML entities and URLs, lowercase, keep letters only, drop posts under 5 words", "1,013,000", "1,012,997"],
    ["3", "Split", "Hold out 10% of posts as a test set using a stable hash of the post id", "1,012,997", "911,474 train / 101,523 test"],
    ["4", "Job 1 (MapReduce)", "Count each word once per post, per subreddit (training posts only)", "911,474", "8,100,109 word-subreddit counts"],
    ["5", "Job 2 (MapReduce)", "Build a TF-IDF inverted index: word to weighted list of subreddits", "8,100,109", "69,944 indexed words"],
    ["6", "Job 3 (MapReduce)", "Cosine similarity between every pair of subreddit vectors", "69,944", "1,013 subreddits with top-10 neighbours"],
    ["7", "Job 4", "Score text against the index, recommend top 5, evaluate on held-out posts", "5,000 test posts", "accuracy figures"]],
    [450, 1500, 3836, 1500, 2100]),
  spacer(),
  h2("3.2 Preprocessing"),
  p("Each post's title and body are concatenated and normalised: the <lb> marker, HTML entities and URLs are removed; text is lowercased; everything except letters and apostrophes is replaced with a space. Posts with fewer than five words are dropped, and duplicate post ids are removed with a unique index. Only 3 of 1,013,000 posts were removed, so the source data was already tidy."),
  h2("3.3 Train and test split"),
  p("To measure recommendation quality honestly, 10% of posts (those whose hashed id modulo 10 equals 0) are marked as test and never used by any MapReduce job. All profiles are built from the remaining 911,474 training posts."),
  h2("3.4 TF-IDF community profiles (Jobs 1 and 2)"),
  p("Each subreddit is treated as one document made of all its training posts. Job 1 counts how often each word appears in each subreddit, counting a word at most once per post so that one long post cannot dominate. Very short words, very long words and a small stop-word list are skipped. Job 2 then builds an inverted index. For a word w with count c in subreddit s, the weight is:"),
  p([run("weight(w, s) = (1 + ln c) × ln(N / df(w))", { font: "Courier New", size: 21 })], { alignment: AlignmentType.CENTER }),
  p("where N is the number of subreddits (1,013) and df(w) is the number of subreddits in which the word occurs. Words seen fewer than 5 times in a subreddit are ignored as noise, words occurring in more than 300 subreddits are discarded as uninformative, and only the 60 strongest subreddits are kept per word. The result is 69,944 indexed words."),
  h2("3.5 Subreddit similarity (Job 3)"),
  p("Two subreddits are similar if they use the same distinctive words. Job 3 computes the cosine similarity between their TF-IDF vectors. A first MapReduce pass computes the length (norm) of every subreddit vector. A second pass emits, for every word and every pair of subreddits that share it, the product of the two weights; summing these over all words gives the dot product. Dividing by the two norms gives the cosine. The ten most similar neighbours of each subreddit are stored."),
  h2("3.6 Recommendation and evaluation (Job 4)"),
  p("For an input text, the same normalisation is applied, each known word is looked up in the index, and every subreddit receives the sum of tf × weight over the matching words, divided by the subreddit's vector norm. The five highest scores are returned together with the words that contributed most."),
  p("Evaluation uses 5,000 randomly sampled held-out posts. A recommendation counts as correct if the post's true subreddit is ranked first (top-1 accuracy) or appears among the five results (hit rate at 5). The baseline always recommends the five largest subreddits of the training split."),
  h2("3.7 MapReduce versus aggregation"),
  p("MongoDB has deprecated the mapReduce command in favour of aggregation pipelines, but it still runs on MongoDB 7.0, which we verified before building the project. To quantify the difference, the word-count task was run both ways on the posts of 50 subreddits, with and without an index on the subreddit field."),

  h1("4. Tools Used"),
  table([["Purpose", "Tool", "Notes"],
    ["Data source", "Kaggle (kaggle CLI 2.2.4)", "Downloads run inside Docker"],
    ["Storage and querying", "MongoDB 7.0", "mongoimport, collections, indexes, mapReduce command"],
    ["Processing", "MongoDB mapReduce (JavaScript map and reduce functions)", "Jobs 1 to 3"],
    ["Pipeline runner", "Python 3.12 with pymongo 4.10", "Cleaning, split, evaluation, logging"],
    ["Back end", "FastAPI 0.115, Uvicorn, Pydantic 2", "Read-only API over stored results; text scoring"],
    ["Front end", "Next.js 16, React 19, TypeScript (strict), Tailwind, Zod, d3-force", "Pipeline view, insights, recommender, results"],
    ["Charts for this report", "matplotlib", "Generated from the live API"],
    ["Deployment", "Docker Compose", "mongo, api and frontend services with healthchecks"],
    ["Version control", "Git and GitHub", "Private repository"]], [2400, 3500, 3486]),
  spacer(),
  p("Hadoop and Spark were not used: the brief requires MongoDB and MapReduce, and a dataset of this size is handled on a single machine. Moving the same jobs to Hadoop or Spark would be the natural next step for larger data."),

  h1("5. MapReduce Code"),
  p("The jobs below are the exact map, reduce and finalize functions that ran. They are executed with db.command({mapReduce: ...}) from the Python runner."),
  h2("Job 1: word counts per subreddit"),
  p("Map emits one key per distinct word and subreddit in each post; reduce sums the counts."),
  code(clean(JOB1)),
  spacer(),
  h2("Job 2: TF-IDF inverted index"),
  p("Map emits one posting per word and subreddit; reduce concatenates postings; finalize converts counts to TF-IDF weights, using the number of postings as the document frequency."),
  code(clean(JOB2)),
  spacer(),
  h2("Job 3: subreddit similarity"),
  p("The first map emits squared weights to compute vector norms. The second emits the product of weights for every pair of subreddits sharing a word. Both use the same reduce function, which sums the values."),
  code(clean(JOB3)),
  spacer(),
  h2("Job 4: recommendation"),
  p("Job 4 is a Python scoring step rather than a MapReduce job: it looks up the words of the input text in the Job 2 index and sums weights per subreddit, as described in section 3.6. The full source is in pipeline/recommend.py and api/main.py."),

  h1("6. Results"),
  h2("6.1 Pipeline output"),
  table([["Step", "Records in", "Records out", "Duration"],
    ["Clean", "1,013,000", "1,012,997", "73.6 s"],
    ["Split (train / test)", "1,012,997", "911,474 / 101,523", "16.2 s"],
    ["Job 1: word counts", "911,474 posts", "8,100,109 counts", "491.5 s (8 min 11 s)"],
    ["Job 2: TF-IDF index", "8,100,109", "69,944 words", "39.5 s"],
    ["Job 3: similarity", "69,944 words", "1,013 subreddits", "33.3 s"],
    ["Job 4: evaluation", "5,000 test posts", "5,000 scored", "15.8 s"]], [2800, 2200, 2200, 2186]),
  spacer(),
  img("docs/figures/steps.png", 520), caption("Figure 2. Duration of each pipeline step. Job 1 dominates because it emits one record per distinct word per post."),
  h2("6.2 Recommendation quality"),
  table([["Metric", "ThreadSense", "Most-popular baseline"],
    ["Top-1 accuracy (1 of 1,013 communities)", "72.6%", "0.02%"],
    ["Hit rate at 5", "89.1%", "0.26%"]], [4600, 2400, 2386]),
  spacer(),
  img("docs/figures/accuracy.png", 440), caption("Figure 3. Quality on 5,000 held-out posts. The baseline is near zero because the data is balanced (about 1,000 posts per subreddit)."),
  p("For a system choosing among 1,013 classes, a random guess has a 0.1% chance of being right, so 72.6% top-1 accuracy and 89.1% hit rate at 5 show that the TF-IDF profiles capture real topical structure."),
  h2("6.3 Example recommendations"),
  table([["Input text (shortened)", "Top recommendations"],
    ["My sourdough starter will not rise after three days, is it dead?", "r/Breadit (0.354); matched words: sourdough, flour, starter, rise"],
    ["Which camera lens is best for portrait photography with a blurry background", "r/photography (0.314), r/cinematography, r/gopro, r/photoshop, r/drawing"],
    ["My boyfriend keeps ignoring me when he plays video games all night…", "r/LongDistance, r/lonely, r/MomForAMinute, r/ExNoContact, r/socialskills"],
    ["How do I debug a segmentation fault in my C pointer code…", "r/golang, r/rust, r/javahelp, r/discordapp, r/gridcoin"]], [4000, 5386]),
  spacer(),
  p("The last example shows a limit: the dataset has no dedicated C programming community among its 1,013 subreddits, so the system returns the nearest programming communities. The final entries (r/discordapp, r/gridcoin) are weak matches, which the low scores reflect."),
  h2("6.4 Community similarity"),
  p("Neighbours from Job 3 are sensible. The closest communities to r/Volvo are r/saab (0.58), r/Lexus (0.54), r/Honda and r/BMW. For r/learnpython they are r/csharp, r/bash, r/javahelp, r/redditdev and r/django. For r/Breadit they are r/instantpot, r/Kombucha, r/slowcooking and r/Chefit."),
  h2("6.5 MapReduce versus aggregation pipeline"),
  table([["Method", "With index on subreddit", "Without index", "Output documents"],
    ["mapReduce", "15.44 s", "16.92 s", "388,647"],
    ["Aggregation pipeline", "7.25 s", "8.64 s", "388,647"]], [2800, 2400, 2000, 2186]),
  spacer(),
  img("docs/figures/timing.png", 440), caption("Figure 4. Word counts for 50 subreddits (44,971 posts). Both methods return identical results."),
  p("The aggregation pipeline is about twice as fast as mapReduce on the same task, and both produce identical output, which supports MongoDB's decision to deprecate mapReduce. The index on the subreddit field helps only slightly (about 1.5 to 1.7 seconds), because the run time is dominated by splitting and counting words, not by finding the documents."),

  h1("7. Visualizations"),
  p("The project includes a web interface (Next.js) that reads the stored results from the API. It has four sections: the pipeline with per-step records and run records, insights (category chart and community network), a recommender where any text can be pasted, and the results. The interface only displays precomputed MapReduce output; the recommender scores text against the stored TF-IDF index and does not run MapReduce live."),
  img("docs/figures/shot_graph.png", 520),
  caption("Figure 5. Community network of the 150 most strongly connected subreddits (similarity from Job 3). Nodes are coloured by category; related communities form clusters."),
  img("docs/shots/try-it.png", 520),
  caption("Figure 6. The recommender: pasted text, ranked communities, score bars and the words that drove each score."),
  img("docs/figures/shot_results.png", 480),
  caption("Figure 7. Results view: accuracy figures and the mapReduce versus aggregation timings."),

  h1("8. Conclusions"),
  bullet("A MongoDB MapReduce pipeline can turn one million raw Reddit posts into compact TF-IDF community profiles (69,944 words, 1,013 communities) in about twelve minutes of total processing on a laptop."),
  bullet("A content-based recommender built only from these profiles places the correct community first for 72.6% of unseen posts and among the first five for 89.1%, out of 1,013 possible communities."),
  bullet("Community similarity derived from MapReduce groups related communities into meaningful clusters (cars with cars, programming with programming, health with health)."),
  bullet("On MongoDB 7.0, the aggregation pipeline is about twice as fast as mapReduce for the same job, so mapReduce is useful for demonstrating the paradigm but aggregation is preferable in production."),
  h2("Limitations"),
  bullet("The system is batch-oriented, not real-time. The data is a static snapshot, and nothing here processes a live stream."),
  bullet("This is big-data methodology at laptop scale (about 1 GB of text, one machine), not a petabyte-scale deployment."),
  bullet("The dataset has no author or timestamp, so there is no personalised (per-user) recommendation and no trend analysis over time."),
  bullet("Only the 1,013 subreddits in the data can be recommended. Because the classes are balanced and some community names appear in the text, the accuracy is likely higher than it would be on arbitrary Reddit traffic."),
  h2("Future work"),
  bullet("Add authors and timestamps from a larger Reddit archive to enable per-user recommendations and trend detection."),
  bullet("Replace the bag-of-words profiles with text embeddings, and compare against the TF-IDF baseline."),
  bullet("Run the same jobs on Hadoop or Spark for larger data, and add stream processing (for example Kafka) for live posts."),
  bullet("Store the community similarity as a graph (for example in Neo4j) for path and community queries."),

  h1("9. Evidence of Execution"),
  p("The complete workflow was executed end to end inside Docker. The records below are the stored pipeline_logs documents written by each step, as shown in the web interface."),
  table([["Step", "Finished (UTC)", "Duration", "Records in", "Records out"],
    ["01_clean", "2026-10-23 03:56", "73.63 s", "1,013,000", "1,012,997"],
    ["02_split", "2026-10-23 03:59", "16.15 s", "1,012,997", "1,012,997"],
    ["03_job1_wordcount", "2026-10-23 04:10", "491.48 s", "911,474", "8,100,109"],
    ["04_job2_index", "2026-10-23 04:11", "39.51 s", "8,100,109", "69,944"],
    ["05_job3_similarity", "2026-10-23 04:11", "33.30 s", "69,944", "1,013"],
    ["06_job4_recommend_eval", "2026-10-23 04:11", "15.82 s", "5,000", "5,000"],
    ["08_timing", "2026-10-23 05:58", "49.94 s", "44,971", "4 timings"]], [2700, 2000, 1400, 1650, 1636]),
  spacer(),
  p("Commands used to reproduce the run (Docker Compose, from the project folder):"),
  code("docker compose up -d mongo\ndocker compose run --rm downloader download selfposts\ndocker compose exec mongo mongoimport --db threadsense --collection posts_raw \\\n  --type tsv --headerline --file /data/import/selfposts/rspct.tsv\ndocker compose run --rm pipeline clean.py\ndocker compose run --rm pipeline split.py\ndocker compose run --rm pipeline job1_wordcount.py\ndocker compose run --rm pipeline job2_index.py\ndocker compose run --rm pipeline job3_similarity.py\ndocker compose run --rm pipeline recommend.py\ndocker compose run --rm pipeline prep.py\ndocker compose run --rm pipeline timing.py\ndocker compose up -d api frontend     # UI on http://localhost:3000"),
  spacer(),
  img("docs/shots/pipeline-log.png", 540),
  caption("Figure 8. The pipeline view with the run record of the TF-IDF index step (step 04) open."),
  p([bold("Reference: "), run("Kaggle dataset: https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts")]),
];

const doc = new Document({
  creator: "Lebi", title: "ThreadSense: IA3 Project Report",
  styles: { default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } }] },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1247, bottom: 1247, left: 1260, right: 1260 } } },
    footers: { default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }],
      children: [run("ThreadSense · IA3 Big Data", { size: 17, color: GREY }), new TextRun({ children: ["\t", PageNumber.CURRENT], font: FONT, size: 17, color: GREY })] })] }) },
    children: [...cover, ...body] }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("report/ThreadSense_IA3_Report.docx", buf); console.log("written", buf.length); });
