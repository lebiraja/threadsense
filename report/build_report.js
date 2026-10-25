// Builds ThreadSense_IA3_Report.docx in the college report format
// (cover, certificate page, title page, abstract, chapters 1-6, conclusion, references, appendices).
// Run from the repo root: node report/build_report.js
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, LevelFormat, Footer, PageNumber,
} = require("docx");

const FONT = "Times New Roman", W = 9026; // A4 with 2.54 cm margins
const read = (f) => fs.readFileSync(f, "utf8");

// ---------- helpers ----------
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 24, ...o });
const body = (t, o = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }, ...o,
  children: Array.isArray(t) ? t : [run(t)] });
const centre = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, ...o,
  children: Array.isArray(t) ? t : [run(t, { bold: true })] });
const chapter = (num, title) => [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run(num, { bold: true, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [run(title, { bold: true, size: 26 })] }),
];
const unnumbered = (title) => [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [run(title, { bold: true, size: 26 })] }),
];
const h = (t) => new Paragraph({ spacing: { before: 200, after: 120 }, keepNext: true, children: [run(t, { bold: true })] });
const bullet = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 100, line: 290 }, children: Array.isArray(t) ? t : [run(t)] });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [run(t, { italics: true, size: 22 })] });
const gap = (n = 200) => new Paragraph({ spacing: { after: n }, children: [] });

const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: line, bottom: line, left: line, right: line };
function table(rows, widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: sum, type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({ tableHeader: i === 0, cantSplit: true,
      children: r.map((c, j) => new TableCell({ borders, width: { size: widths[j], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        shading: i === 0 ? { fill: "E7E6E6", type: ShadingType.CLEAR, color: "auto" } : undefined,
        children: [new Paragraph({ spacing: { after: 0 }, children: [run(String(c), { size: 22, bold: i === 0 })] })] })) })) });
}
function code(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({ borders, width: { size: W, type: WidthType.DXA },
      shading: { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" }, margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: lines.map((l) => new Paragraph({ spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: l === "" ? " " : l, font: "Courier New", size: 19 })] })) })] })] });
}
function img(path, widthPx, align = AlignmentType.CENTER) {
  const b = fs.readFileSync(path);
  const w = b.readUInt32BE(16), hgt = b.readUInt32BE(20);
  return new Paragraph({ alignment: align, spacing: { before: 120, after: 80 }, keepNext: true,
    children: [new ImageRun({ type: "png", data: b, transformation: { width: widthPx, height: Math.round(widthPx * hgt / w) },
      altText: { title: path, description: path, name: path } })] });
}
const logo = () => img("report/assets/karunya_logo.png", 440);

// code pulled from the repo so the report matches what ran
const src = (f) => read(f);
const grab = (s, name) => {
  const m = s.match(new RegExp(name + ' = Code\\((?:"""([\\s\\S]*?)"""|"([^"\\n]*)")\\)'));
  if (!m) throw new Error("not found: " + name);
  return "// " + name.toLowerCase().replace("_", " ") + "\n" + (m[1] ?? m[2]).trim();
};
const j1 = src("pipeline/job1_wordcount.py"), j2 = src("pipeline/job2_index.py"), j3 = src("pipeline/job3_similarity.py");
const JOB1 = [grab(j1, "MAP"), grab(j1, "REDUCE")].join("\n\n");
const JOB2 = [grab(j2, "MAP"), grab(j2, "REDUCE"), grab(j2, "FINALIZE")].join("\n\n");
const JOB3 = [grab(j3, "NORM_MAP"), grab(j3, "PAIR_MAP"), grab(j3, "SUM")].join("\n\n");
const rec = src("pipeline/recommend.py");
const SCORE = rec.slice(rec.indexOf("def score("), rec.indexOf("def main()")).trim();
const CLEANFN = (() => { const c = src("pipeline/clean.py"); return c.slice(c.indexOf("URL = "), c.indexOf("def main()")).trim(); })();

const TITLE = "ThreadSense: Discovering Which Reddit Communities You Belong In";
const ME = "LEBI (URK24AI________)";

// ---------- front matter ----------
const cover = [
  gap(300), logo(), gap(500),
  centre("DIVISION OF DATA SCIENCE AND CYBER SECURITY"), centre("SCHOOL OF COMPUTER SCIENCE AND TECHNOLOGY"), gap(300),
  centre("A SKILL BASED EVALUATION REPORT"), gap(700),
  centre("SUBMITTED BY"), centre(ME), gap(500),
  centre("COURSE CODE"), centre("23DC2043"), gap(300),
  centre("COURSE NAME"), centre("BIG DATA TOOLS AND TECHNIQUES"), gap(500),
  centre("Oct 2026"),
];
const certificate = [
  ...unnumbered("ONLINE CERTIFICATE"),
  gap(600),
  centre([run("[Paste your MongoDB Skill badge “Proof of Completion” certificates on this page, one per course completed.]", { italics: true, color: "7F7F7F" })]),
];
const titlePage = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [run("TITLE", { bold: true })] }),
  centre(TITLE), gap(400),
  centre([run("A REAL TIME APPLICATION REPORT", { bold: true, italics: true })]),
  centre([run("Submitted by", { italics: true, bold: true })]),
  centre(ME), gap(400),
  logo(), gap(300),
  centre("DIVISION OF DATA SCIENCE AND CYBER SECURITY KARUNYA INSTITUTE OF TECHNOLOGY AND SCIENCES (Declared as Deemed-to-be-under Sec-3 of the UGC Act, 1956) Karunya Nagar, Coimbatore - 641 114. INDIA"),
  gap(300), centre("Oct 2026."),
];

const abstract = [
  ...unnumbered("ABSTRACT"),
  body("Reddit is divided into thousands of topic communities called subreddits, and a newcomer has no easy way of knowing which communities suit a question or a post. Keyword search finds posts, not the right place to take part. This project, titled “ThreadSense: Discovering Which Reddit Communities You Belong In,” builds a batch big-data pipeline that learns what each community talks about from over one million posts and then recommends the five best-fitting communities for any piece of text."),
  body("The project uses the Reddit self-post dataset from Kaggle, which contains 1,013,000 free-text posts from 1,013 subreddits. The raw file is imported into MongoDB 7.0 with mongoimport, cleaned with Python and PyMongo, and divided into a training set of 911,474 posts and a held-out test set of 101,523 posts. Three MongoDB MapReduce jobs then run on the training posts. The first counts how often each word appears in each subreddit and produces 8,100,109 word and subreddit counts. The second builds a TF-IDF inverted index of 69,944 informative words. The third computes cosine similarity between the 1,013 community profiles so that related communities can be shown together. A scoring step then ranks communities for new text."),
  body("The system was evaluated on 5,000 posts that were never used to build the profiles. It placed the correct community first for 72.6% of posts and among the first five for 89.1%, out of 1,013 possible communities, while a most-popular baseline reached 0.02% and 0.26%. The baseline is close to zero because the classes are balanced, so the absolute accuracy is the more meaningful figure. Neighbouring communities found by the similarity job are sensible, for example r/Volvo is closest to r/saab, r/Lexus, r/Honda and r/BMW. A timing experiment on the same word-count task showed that MongoDB’s aggregation pipeline is about twice as fast as mapReduce (7.25 s against 15.44 s with an index) and gives identical output."),
  body("The results are presented through a FastAPI back end and a Next.js web interface that shows the pipeline steps with their run records, a category chart, a community network graph and a page where any text can be pasted to receive recommendations. The whole system runs in Docker. The dataset has no author or timestamp, so the recommender is content-based and cannot personalise by user or follow trends over time. The processing is batch, at laptop scale, and not real-time. Future work includes adding authors and timestamps, using text embeddings, and moving the jobs to Hadoop or Spark for larger data."),
];

// ---------- chapters ----------
const ch1 = [
  ...chapter("CHAPTER 1", "INTRODUCTION"),
  body("Reddit hosts thousands of communities, called subreddits, each with its own topic, vocabulary and culture. A person who wants to ask a question about sourdough bread, a car repair or a programming error must first find the right community, and the choice matters because a post in the wrong place receives little attention. At the same time, moderators, researchers and analysts have no compact view of how communities relate to one another. The project “ThreadSense: Discovering Which Reddit Communities You Belong In” addresses both problems by learning a vocabulary profile for every community from a large collection of posts."),
  h("1.1 Problem Statement"),
  body("Given any piece of text, return the five Reddit communities in which it fits best, together with the words that drove each recommendation, and show how the communities in the data relate to each other. The system must be built as a big-data pipeline in which the data is stored in MongoDB and processed at scale with MapReduce, and its quality must be measured honestly on posts that it has not seen."),
  h("1.2 Objectives"),
  bullet("Ingest a large semi-structured Kaggle dataset, with more than 50,000 records, into MongoDB."),
  bullet("Clean and preprocess the free text and hold out a test set before any learning takes place."),
  bullet("Use MongoDB MapReduce to build a TF-IDF profile of every community and to measure similarity between communities."),
  bullet("Evaluate the recommender on held-out posts against a baseline, and compare MapReduce with an equivalent aggregation pipeline."),
  bullet("Present the workflow, charts and recommendations through a web interface that can be demonstrated live."),
  h("1.3 Dataset Overview"),
  body("The project uses the “Reddit self-post classification task” dataset published on Kaggle (https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts). It contains 1,013,000 self-posts, which are text posts written by users, from 1,013 subreddits, with about 1,000 posts per subreddit. Each record has four fields: a post id, the subreddit, the title and the body text. A second file describes every subreddit with a category, giving 39 distinct categories. The data is unstructured natural language with markdown, links, HTML entities and a line-break marker, which is why a document database is a natural place to keep it."),
  h("1.4 Scope and Limitations"),
  body("The dataset contains no author and no timestamp. For this reason the project builds a content-based recommender, which judges a post by its words, and it cannot give per-user recommendations or study trends over time. The processing is batch processing on one machine, so the project demonstrates big-data methods at laptop scale and does not claim distributed or real-time processing."),
  body("The report is organised as follows. Chapter 2 reviews the technologies and methods used. Chapter 3 explains the methodology, Chapter 4 the implementation, Chapter 5 the testing and validation, and Chapter 6 the results and discussion. The conclusion, references and appendices follow."),
];

const ch2 = [
  ...chapter("CHAPTER 2", "LITERATURE REVIEW"),
  body("MapReduce is a programming model introduced by Dean and Ghemawat for processing large data sets. A map function turns each input record into intermediate key and value pairs, and a reduce function combines all values that share a key [1]. MongoDB offers this model through its mapReduce command, in which the map and reduce functions are written in JavaScript and run inside the database. MongoDB’s documentation states that map-reduce has been deprecated since version 5.0 in favour of aggregation pipelines [5]. The command still runs on MongoDB 7.0, which was verified at the start of this project, and a timing comparison against aggregation is reported in Chapter 6."),
  body("TF-IDF is a classic way of weighting words in information retrieval. The inverse document frequency idea of Spärck Jones gives a higher weight to words that occur in few documents, because such words carry more information about a topic [3]. Salton and Buckley compared many term-weighting schemes and showed the value of combining a term-frequency component with an inverse document frequency component [2]. Manning, Raghavan and Schütze describe the vector space model in which documents and queries are vectors of such weights, and in which cosine similarity measures how close two vectors are [8]. ThreadSense treats each subreddit as one document made of all its posts and uses these ideas to profile and compare communities."),
  body("Recommender systems are commonly divided into collaborative methods, which use the behaviour of many users, and content-based methods, which use the features of the items themselves [7]. Because the dataset in this project does not identify users, a content-based method is the natural choice: the text of a post is matched against the vocabulary of each community."),
  body("Large Reddit corpora are widely used in research. The Pushshift project collected Reddit submissions and comments as monthly dumps of newline-delimited JSON [4]. The Kaggle dataset used here is a smaller, balanced selection of self-posts, which suits a classification and recommendation task but also means that the class distribution is artificially even."),
  body("Distributed frameworks such as Hadoop and Spark run MapReduce-style computation across clusters of machines. This project uses a single local MongoDB deployment and does not claim distributed processing. Its contribution is the integration of document storage, MapReduce-based TF-IDF profiling, community similarity, held-out evaluation, a MapReduce versus aggregation comparison and an interactive interface in one reproducible Docker-based workflow. Unlike approaches that only count words, the system also reports which words drove each recommendation, which makes the results easier to explain."),
];

const ch3 = [
  ...chapter("CHAPTER 3", "METHODOLOGY"),
  body("The project is a batch pipeline in which every step reads from and writes to MongoDB. Each step also records its input count, output count and duration in a collection called pipeline_logs, and the web interface reads these records. The workflow consists of ingestion, cleaning, a train and test split, three MapReduce jobs, a recommendation and evaluation step, and result visualization."),
  h("3.1 Data Ingestion"),
  body("The Kaggle files are downloaded with the Kaggle command line tool running inside a Docker container. The 880 MB tab-separated file is loaded into the collection posts_raw with mongoimport, which imported 1,013,000 documents and failed on none."),
  h("3.2 Preprocessing"),
  body("The title and body of each post are joined and normalised. The line-break marker, HTML entities and URLs are removed, the text is converted to lower case, and everything except letters and apostrophes is replaced by a space. Posts with fewer than five words are dropped, and duplicate post ids are rejected by a unique index. The cleaned documents are stored in posts_clean with the fields id, subreddit, text and the number of words. Only 3 of the 1,013,000 posts were removed, so the source data was already tidy."),
  h("3.3 Train and Test Split"),
  body("To measure quality honestly, 10% of the posts, those whose hashed id modulo 10 equals zero, are marked as test posts. No MapReduce job reads them. The remaining 911,474 posts form the training set from which all community profiles are built."),
  h("3.4 TF-IDF Community Profiles (Jobs 1 and 2)"),
  body("Each subreddit is treated as one document consisting of all its training posts. Job 1 counts how often every word appears in every subreddit, counting a word at most once per post so that one long post cannot dominate. Very short and very long words and a small list of stop words are skipped. Job 2 builds an inverted index in which each word points to the subreddits that use it and carries a TF-IDF weight. For a word w with count c in a subreddit s the weight is:"),
  centre([run("weight(w, s) = (1 + ln c) × ln(N / df(w))", { font: "Courier New", size: 22 })]),
  body("where N is the number of subreddits (1,013) and df(w) is the number of subreddits in which the word occurs. Words with a count below 5 in a subreddit are treated as noise, words that occur in more than 300 subreddits are discarded because they say nothing about a topic, and only the 60 strongest subreddits are kept for each word. The result is an index of 69,944 words."),
  h("3.5 Community Similarity (Job 3)"),
  body("Two subreddits are similar when they use the same distinctive words. Job 3 computes the cosine similarity between their TF-IDF vectors. A first MapReduce pass computes the length of every subreddit vector. A second pass emits, for every word and for every pair of subreddits that share it, the product of the two weights, and summing these over all words gives the dot product of the pair. Dividing the dot product by the two vector lengths gives the cosine. The ten most similar neighbours of each subreddit are stored."),
  h("3.6 Recommendation and Evaluation (Job 4)"),
  body("To score a text, the same normalisation is applied and each known word is looked up in the index. Every subreddit receives the sum of the term-frequency factor and the TF-IDF weight over the matching words, divided by the length of its profile vector, and the five highest scores are returned together with the words that contributed most. Evaluation uses 5,000 posts sampled at random from the held-out set. A recommendation counts as correct if the true subreddit is ranked first, which gives top-1 accuracy, or appears among the five results, which gives the hit rate at 5. The baseline always recommends the five largest subreddits of the training set."),
  h("3.7 MapReduce versus Aggregation"),
  body("To quantify the difference between the two MongoDB processing methods, the word-count task was run both with mapReduce and with an equivalent aggregation pipeline on the posts of 50 subreddits, with and without an index on the subreddit field."),
  h("3.8 System Architecture"),
  body("The system consists of three Docker services: MongoDB for storage and MapReduce, a FastAPI service that exposes the stored results and scores pasted text, and a Next.js web interface. A pipeline container, which is started on demand, runs the Python steps. The services communicate over the Docker network, and each has a healthcheck."),
];

const ch4 = [
  ...chapter("CHAPTER 4", "IMPLEMENTATION"),
  body("The project “ThreadSense: Discovering Which Reddit Communities You Belong In” was implemented with MongoDB 7.0, Python 3.12 with PyMongo, FastAPI, Next.js with TypeScript, and Docker Compose. The dataset was obtained from Kaggle and contains 1,013,000 Reddit self-posts. All services run in Docker, and the source code is kept in a Git repository."),
  h("4.1 Database Connection"),
  body("The following Python code, shared by all pipeline steps, connects to the database and records every step in pipeline_logs:"),
  code(read("pipeline/db.py").trim()),
  gap(),
  h("4.2 Text Cleaning"),
  body("The cleaning step reads posts_raw in batches of 5,000, normalises the text and inserts the posts into posts_clean. A unique index on the post id removes duplicates:"),
  code(CLEANFN),
  gap(),
  h("4.3 MapReduce Job 1: Word Counts"),
  body("The map function emits one key for every distinct word and subreddit in a post, and the reduce function adds the counts. The stop-word list is passed to the function as scope:"),
  code(JOB1),
  gap(),
  h("4.4 MapReduce Job 2: TF-IDF Inverted Index"),
  body("The map function emits one posting for each word and subreddit, the reduce function joins the postings, and the finalize function converts counts into TF-IDF weights, using the number of postings as the document frequency:"),
  code(JOB2),
  gap(),
  h("4.5 MapReduce Job 3: Community Similarity"),
  body("The first map function emits squared weights so that vector lengths can be computed. The second emits the product of weights for every pair of subreddits that share a word. Both use the same reduce function, which adds the values:"),
  code(JOB3),
  gap(),
  h("4.6 Recommendation Scoring"),
  body("The scoring function looks up the words of a text in the index and adds up the weights per subreddit. The same logic is used by the evaluation step and by the API:"),
  code(SCORE),
  gap(),
  h("4.7 Back End and Web Interface"),
  body("The FastAPI service reads the stored results and exposes them as nine JSON endpoints, which are documented in docs/API.md. One endpoint, POST /api/recommend, scores pasted text against the stored TF-IDF index. The Next.js interface validates every response with Zod and has four sections: the pipeline with the run record of each step, insights with a category chart and a community network graph, a recommender page, and the results. The interface only displays precomputed results. The recommender page scores text against the stored index and does not run MapReduce live."),
  img("docs/shots/pipeline-log.png", 440),
  caption("Figure 4.1 Pipeline view of the web interface with the run record of the TF-IDF step open."),
  h("4.8 Development Challenges"),
  body("An early attempt to clean the text inside MongoDB with a JavaScript function in an aggregation pipeline failed with an out-of-memory error, so the cleaning step was moved to Python and PyMongo with batch insertion. Docker builds also failed on the campus network because the container could not resolve DNS names, which was solved by building on a different network and by downloading the Python packages beforehand. A second Kaggle dataset, reddit-submissions, was dropped after it turned out to consist of raw HTML pages and not a table of posts."),
];

const ch5 = [
  ...chapter("CHAPTER 5", "TESTING AND VALIDATION"),
  body("Testing and validation were performed to verify the functionality and reliability of the project “ThreadSense: Discovering Which Reddit Communities You Belong In.” The testing process covered data ingestion, cleaning, the train and test split, each MapReduce job, the evaluation of the recommender, the API endpoints and the web interface. Each step was checked against the counts that it wrote to pipeline_logs and against direct queries on the collections."),
  body("The testing approach included checking that the imported record count matched the source file, that duplicate ids were rejected, that the held-out posts were excluded from the MapReduce jobs, and that mapReduce and aggregation gave the same output for the same task. The API was called for every endpoint, and the web interface was opened in a browser against the real API. The following table summarises the main test cases and observed outcomes."),
  table([
    ["Test case", "Expected result", "Observed result"],
    ["Dataset download", "Kaggle files download in Docker", "rspct.tsv (880 MB) and subreddit_info.csv downloaded"],
    ["Bulk import", "All rows load into MongoDB", "1,013,000 documents imported, 0 failed"],
    ["Duplicate handling", "Duplicate post ids rejected", "1 duplicate removed by the unique index"],
    ["Text cleaning", "Markers, entities and URLs removed; tiny posts dropped", "1,012,997 posts kept, 3 dropped"],
    ["Train and test split", "Stable 10% held out", "911,474 train and 101,523 test posts"],
    ["mapReduce on MongoDB 7.0", "Deprecated command still runs", "Test job and Jobs 1 to 3 completed"],
    ["Job 1 word counts", "Counts per word and subreddit", "8,100,109 counts in 491.48 s"],
    ["Job 2 TF-IDF index", "Weighted postings per word", "69,944 words indexed in 39.51 s"],
    ["Job 3 similarity", "Neighbours for every subreddit", "1,013 subreddits, 10 neighbours each, 33.30 s"],
    ["Recommender evaluation", "Score held-out posts", "72.6% top-1 and 89.1% hit rate at 5 on 5,000 posts"],
    ["mapReduce vs aggregation", "Same output from both", "388,647 documents from each"],
    ["API endpoints", "All endpoints return stored results", "All nine responded; two defects found and fixed"],
    ["Web interface", "Pipeline, charts and recommender work", "Verified in a browser against the real API"],
  ], [2300, 3000, 3726]),
  gap(),
  body("Two defects were found during this testing and fixed. First, two API endpoints failed because an asynchronous aggregate call had not been awaited, which was found by calling every endpoint. Second, the pipeline timestamps were shown shifted by five and a half hours, because MongoDB returns dates without a time zone and the interface read them as local time. The API now returns them as UTC."),
  body("Standard unit-test suites were not written for the pipeline steps. Their correctness was checked through the counts above, the held-out evaluation and manual inspection of example outputs, and this is a limitation of the testing."),
];

const ch6 = [
  ...chapter("CHAPTER 6", "RESULTS AND DISCUSSION"),
  h("6.1 Pipeline Output"),
  body("The project processed 1,013,000 Reddit posts. The following table shows the records entering and leaving each step and its duration, as stored in pipeline_logs. The eight logged steps took 12.1 minutes in total on a laptop."),
  table([
    ["Step", "Records in", "Records out", "Duration"],
    ["Clean", "1,013,000", "1,012,997", "73.6 s"],
    ["Split (train / test)", "1,012,997", "911,474 / 101,523", "16.2 s"],
    ["Job 1: word counts", "911,474 posts", "8,100,109 counts", "491.5 s"],
    ["Job 2: TF-IDF index", "8,100,109", "69,944 words", "39.5 s"],
    ["Job 3: similarity", "69,944 words", "1,013 subreddits", "33.3 s"],
    ["Job 4: evaluation", "5,000 test posts", "5,000 scored", "15.8 s"],
  ], [2700, 2200, 2200, 1926]),
  gap(),
  img("docs/figures/steps.png", 430),
  caption("Figure 6.1 Duration of each pipeline step. Job 1 dominates because it emits one record per distinct word per post."),
  img("docs/figures/categories.png", 430),
  caption("Figure 6.2 Number of posts in the twelve largest of the 39 subreddit categories."),
  h("6.2 Recommendation Quality"),
  table([
    ["Metric (5,000 held-out posts)", "ThreadSense", "Most-popular baseline"],
    ["Top-1 accuracy, 1,013 classes", "72.6%", "0.02%"],
    ["Hit rate at 5", "89.1%", "0.26%"],
  ], [4000, 2200, 2826]),
  gap(),
  img("docs/figures/accuracy.png", 400),
  caption("Figure 6.3 Recommendation quality on held-out posts."),
  body("For a choice among 1,013 communities a random guess is right 0.1% of the time, so the figures show that the TF-IDF profiles capture real topical structure. The baseline is close to zero because the dataset is balanced, with about 1,000 posts per subreddit, so the large gap to the baseline arises partly from the dataset itself and the absolute accuracy is the more meaningful number. The accuracy is probably also flattered by the fact that community names appear in the text, for example “breadit” in posts of r/Breadit, and would be lower for text that never mentions its community."),
  h("6.3 Example Recommendations"),
  table([
    ["Input text (shortened)", "Top recommendations"],
    ["My sourdough starter will not rise after three days, is it dead?", "r/Breadit (0.354), driven by the words sourdough, flour, starter and rise"],
    ["Which camera lens is best for portrait photography with a blurry background", "r/photography (0.314), r/cinematography, r/gopro, r/photoshop, r/drawing"],
    ["My boyfriend keeps ignoring me when he plays video games all night", "r/LongDistance, r/lonely, r/MomForAMinute, r/ExNoContact, r/socialskills"],
    ["How do I debug a segmentation fault in my C pointer code", "r/golang, r/rust, r/javahelp, r/discordapp, r/gridcoin"],
  ], [3900, 5126]),
  gap(),
  body("The last example shows a limit of the system. The data has no community dedicated to C programming among its 1,013 subreddits, so the system returns the nearest programming communities, and its last two suggestions are weak matches, which their low scores reflect. A system can only recommend communities that exist in its training data."),
  h("6.4 Community Similarity"),
  body("The neighbours found by Job 3 are sensible. The closest communities to r/Volvo are r/saab (0.58), r/Lexus (0.54), r/Honda (0.52) and r/BMW (0.52). For r/learnpython they are r/csharp, r/bash, r/javahelp, r/redditdev and r/django. For r/Breadit they are r/instantpot, r/Kombucha, r/slowcooking and r/Chefit. The network graph in the interface shows these links, and related communities form visible clusters."),
  img("docs/figures/shot_graph.png", 420),
  caption("Figure 6.4 Community network of the 150 most strongly connected subreddits. Nodes are coloured by category."),
  h("6.5 MapReduce versus Aggregation Pipeline"),
  table([
    ["Method", "With index on subreddit", "Without index", "Output documents"],
    ["mapReduce", "15.44 s", "16.92 s", "388,647"],
    ["Aggregation pipeline", "7.25 s", "8.64 s", "388,647"],
  ], [2400, 2400, 1900, 2326]),
  gap(),
  img("docs/figures/timing.png", 400),
  caption("Figure 6.5 Word counts for 50 subreddits (44,971 posts)."),
  body("The aggregation pipeline is about twice as fast as mapReduce on the same task and produces identical output, which supports MongoDB’s decision to deprecate mapReduce. The index on the subreddit field helps only slightly, about 1.5 to 1.7 seconds, because the run time is dominated by splitting posts into words and counting them and not by finding the documents. The comparison covers one task on one machine and should not be generalised."),
  h("6.6 Web Interface"),
  img("docs/shots/try-it.png", 420),
  caption("Figure 6.6 Recommender page: pasted text, ranked communities, score bars and the words behind each score."),
  img("docs/figures/shot_results.png", 380),
  caption("Figure 6.7 Results view of the interface with the accuracy figures and the timing comparison."),
  h("6.7 Discussion"),
  body("The system met its main objectives. It stored and cleaned a million posts, built community profiles with three MapReduce jobs, recommended the correct community for most unseen posts, and presented the workflow through an interface. The main difficulties were handling the large number of intermediate records produced by the word-count job, moving the cleaning from an in-database function to Python after a memory error, and the network restrictions on Docker builds."),
  body("Compared with keyword search, the system recommends a place to post and explains its choice through the matched words. Compared with distributed platforms, the current implementation uses one local MongoDB instance, so no scaling benefit over Hadoop or Spark has been measured. Because the dataset has no author or timestamp, it cannot personalise recommendations by user or show how communities change over time, and the classes are balanced, which is unlike real Reddit traffic. A comparison with other classifiers, such as naive Bayes or embedding-based models, was not carried out and would be a useful next step."),
];

const conclusion = [
  ...unnumbered("CONCLUSION"),
  body("The project “ThreadSense: Discovering Which Reddit Communities You Belong In” was developed to learn the vocabulary of Reddit communities from a large collection of posts and to recommend the best-fitting communities for new text. The system uses MongoDB to store the data and run MapReduce, Python to clean the text and evaluate the results, FastAPI to serve them, and a Next.js interface to present them."),
  body("The project processed 1,013,000 posts. Three MapReduce jobs produced 8,100,109 word counts, a TF-IDF index of 69,944 words and a similarity table for 1,013 communities in about twelve minutes on a laptop. On 5,000 posts that the system had never seen, it placed the correct community first for 72.6% of posts and among the first five for 89.1%. Related communities were grouped sensibly, and a timing experiment showed that MongoDB’s aggregation pipeline is about twice as fast as mapReduce for the same task."),
  body("The main achievement of the project is a complete, reproducible workflow from raw data to an interactive demonstration, with an honest held-out evaluation. The limitations are that the processing is batch and not real-time, that it runs on one machine, that the dataset has no author or timestamp, and that its balanced classes and community names in the text make the accuracy somewhat optimistic."),
  body("In the future, the system can be improved by adding authors and timestamps from a larger Reddit archive to give per-user recommendations and trend detection, by replacing word weights with text embeddings and comparing them with TF-IDF, by moving the jobs to Hadoop or Spark for larger data, by adding stream processing for live posts, and by storing community similarity as a graph. The project also gave practical experience in handling a large text dataset, writing MapReduce functions, evaluating a model on held-out data, and building and testing a complete data application."),
];

const references = [
  ...unnumbered("REFERENCES"),
  ...[
    "[1] J. Dean and S. Ghemawat, “MapReduce: Simplified Data Processing on Large Clusters,” in Proc. 6th USENIX Symposium on Operating Systems Design and Implementation (OSDI), 2004.",
    "[2] G. Salton and C. Buckley, “Term-weighting approaches in automatic text retrieval,” Information Processing & Management, vol. 24, no. 5, pp. 513–523, 1988.",
    "[3] K. Spärck Jones, “A statistical interpretation of term specificity and its application in retrieval,” Journal of Documentation, vol. 28, no. 1, pp. 11–21, 1972.",
    "[4] J. Baumgartner, S. Zannettou, B. Keegan, M. Squire and J. Blackburn, “The Pushshift Reddit Dataset,” in Proc. International AAAI Conference on Web and Social Media (ICWSM), 2020.",
    "[5] MongoDB, “Map-Reduce.” Available at: https://www.mongodb.com/docs/manual/core/map-reduce/",
    "[6] M. Swarbrick Jones, “The reddit self-post classification task,” Kaggle. Available at: https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts",
    "[7] F. Ricci, L. Rokach and B. Shapira (eds.), Recommender Systems Handbook, Springer, 2011.",
    "[8] C. D. Manning, P. Raghavan and H. Schütze, Introduction to Information Retrieval, Cambridge University Press, 2008.",
    "[9] PyMongo, “PyMongo Documentation.” Available at: https://pymongo.readthedocs.io/",
    "[10] FastAPI, “FastAPI Documentation.” Available at: https://fastapi.tiangolo.com/",
    "[11] Next.js, “Next.js Documentation.” Available at: https://nextjs.org/docs",
    "[12] Docker, “Docker Compose Documentation.” Available at: https://docs.docker.com/compose/",
  ].map((t) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 140, line: 280 }, indent: { left: 540, hanging: 540 }, children: [run(t)] })),
];

const appendices = [
  ...unnumbered("APPENDICES"),
  body("The appendices provide additional information, sample code and supporting details related to the project “ThreadSense: Discovering Which Reddit Communities You Belong In.” These materials support the implementation and help explain the technologies and procedures used in the system."),
  h("Appendix A: Technologies Used"),
  bullet("MongoDB 7.0 – For storing the posts and running the MapReduce jobs."),
  bullet("MongoDB mapReduce – For word counts, the TF-IDF index and community similarity."),
  bullet("Python 3.12 and PyMongo – For cleaning, the train and test split, evaluation and logging."),
  bullet("FastAPI and Pydantic – For the back end that serves the stored results."),
  bullet("Next.js, TypeScript, Tailwind CSS and Zod – For the web interface."),
  bullet("Docker and Docker Compose – For running every service with healthchecks."),
  bullet("Kaggle command line tool – For downloading the dataset."),
  bullet("Git and GitHub – For version control."),
  h("Appendix B: Docker Compose Configuration (MongoDB service)"),
  code("services:\n  mongo:\n    image: mongo:7.0\n    env_file: .env\n    ports:\n      - \"127.0.0.1:27017:27017\"\n    volumes:\n      - mongo_data:/data/db\n      - ./data:/data/import:ro\n    healthcheck:\n      test: [\"CMD\", \"mongosh\", \"--quiet\", \"--eval\", \"db.adminCommand('ping').ok\"]\n      interval: 5s\n      timeout: 5s\n      retries: 12"),
  gap(),
  h("Appendix C: Sample Data"),
  body("A raw record of the dataset has the fields id, subreddit, title and selftext, for example: id 58mbft, subreddit teenmom, title “So what was Matt “addicted” to?”, selftext “Did he ever say what his addiction was or is”. After cleaning, the text field of this post is “so what was matt addicted to did he ever say what his addiction was or is”, which has 16 words. The cleaned documents are stored in posts_clean with the fields id, subreddit, text, n_words and split."),
  h("Appendix D: Project Outputs"),
  body("The project produces the collections word_counts (8,100,109 documents), word_index (69,944 documents), subreddit_sim (1,013 documents), subreddit_stats, results and pipeline_logs in the MongoDB database threadsense. It also produces the web interface, the API documented in docs/API.md and the charts used in this report."),
  h("Appendix E: Commands Used to Reproduce the Run"),
  code("docker compose up -d mongo\ndocker compose run --rm downloader download selfposts\ndocker compose exec mongo mongoimport --db threadsense --collection posts_raw \\\n  --type tsv --headerline --file /data/import/selfposts/rspct.tsv\ndocker compose run --rm pipeline clean.py\ndocker compose run --rm pipeline split.py\ndocker compose run --rm pipeline job1_wordcount.py\ndocker compose run --rm pipeline job2_index.py\ndocker compose run --rm pipeline job3_similarity.py\ndocker compose run --rm pipeline recommend.py\ndocker compose run --rm pipeline prep.py\ndocker compose run --rm pipeline timing.py\ndocker compose up -d api frontend"),
  gap(),
  h("Appendix F: Future Enhancements"),
  body("Future improvements may include authors and timestamps for per-user recommendations and trend detection, text embeddings compared with TF-IDF, distributed processing with Hadoop or Spark, stream processing of live posts, and graph storage of community similarity."),
  gap(),
  body([run("Source code: https://github.com/lebiraja/threadsense (private repository; access on request).", { italics: true })]),
];

const doc = new Document({
  creator: "Lebi", title: TITLE,
  styles: { default: { document: { run: { font: FONT, size: 24 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
    children: [...cover, ...certificate, ...titlePage, ...abstract, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...conclusion, ...references, ...appendices],
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("report/ThreadSense_IA3_Report.docx", buf); console.log("written", buf.length); });
