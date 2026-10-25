// Builds ThreadSense_IA3_Report.docx in the college report format.
// Run from the repo root: node report/build_report.js
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, LevelFormat, Footer, PageNumber, SectionType,
} = require("docx");

const FONT = "Times New Roman", W = 9026; // A4, 2.54 cm margins
const read = (f) => fs.readFileSync(f, "utf8");

// ---------- helpers ----------
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 24, ...o });
const body = (t, o = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 312 }, ...o,
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
  spacing: { after: 100, line: 300 }, children: Array.isArray(t) ? t : [run(t)] });
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
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ borders, width: { size: W, type: WidthType.DXA },
      shading: { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" }, margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: lines.map((l) => new Paragraph({ spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: l === "" ? " " : l, font: "Courier New", size: 19 })] })) })] })] });
}
function img(path, widthPx) {
  const b = fs.readFileSync(path);
  const w = b.readUInt32BE(16), hgt = b.readUInt32BE(20);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 }, keepNext: true,
    children: [new ImageRun({ type: "png", data: b, transformation: { width: widthPx, height: Math.round(widthPx * hgt / w) },
      altText: { title: path, description: path, name: path } })] });
}
const logo = () => img("report/assets/karunya_logo.png", 440);

// code pulled from the repo so the report matches what ran
function grab(file, name) {
  const s = read(file);
  const m = s.match(new RegExp(name + ' = Code\\((?:"""([\\s\\S]*?)"""|"([^"\\n]*)")\\)'));
  if (!m) throw new Error("not found: " + name);
  return (m[1] ?? m[2]).trim();
}
const JOB1_MAP = grab("pipeline/job1_wordcount.py", "MAP");
const JOB1_REDUCE = grab("pipeline/job1_wordcount.py", "REDUCE");
const JOB2_FINALIZE = grab("pipeline/job2_index.py", "FINALIZE");
const JOB3_PAIR = grab("pipeline/job3_similarity.py", "PAIR_MAP");

const TITLE = "ThreadSense: Discovering Which Reddit Communities You Belong In";
const ME = "LEBI RAJA C (URK24AI1005)";

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
const certNames = ["cert1", "cert2", "cert3"];
const certificate = [
  ...unnumbered("ONLINE CERTIFICATE"),
  ...certNames.map((c) => img(`report/assets/${c}.png`, 360)),
];
const titlePage = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [run("TITLE", { bold: true })] }),
  centre(TITLE), gap(400),
  centre([run("A REAL TIME APPLICATION REPORT", { bold: true, italics: true })]),
  centre([run("Submitted by", { italics: true, bold: true })]),
  centre(ME), gap(400),
  logo(), gap(300),
  centre("DIVISION OF DATA SCIENCE AND CYBER SECURITY KARUNYA INSTITUTE OF TECHNOLOGY AND SCIENCES (Declared as Deemed to be under Sec 3 of the UGC Act, 1956) Karunya Nagar, Coimbatore 641 114. INDIA"),
  gap(300), centre("Oct 2026."),
];

const abstract = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [run("ABSTRACT", { bold: true, size: 26 })] }),
  body("Reddit has thousands of communities, called subreddits, and it is hard for a newcomer to know which one fits a question or a post. This project, “ThreadSense: Discovering Which Reddit Communities You Belong In,” learns what each community talks about from over a million posts and then suggests the five best communities for any text you give it."),
  body("The project uses a Kaggle dataset of 1,013,000 Reddit text posts from 1,013 subreddits. The data is loaded into MongoDB, cleaned with Python, and split into 911,474 posts for learning and 101,523 posts kept aside for testing. Three MapReduce jobs then run inside MongoDB. The first counts words in each subreddit, the second turns those counts into TF-IDF weights, and the third measures how similar the subreddits are to each other."),
  body("On 5,000 posts that the system had never seen, it put the correct community first for 72.6% of posts and among its top five for 89.1%, out of 1,013 choices. A simple baseline that always suggests the biggest communities scored almost zero, but that is partly because every community has about the same number of posts. We also found that MongoDB’s aggregation pipeline is about twice as fast as mapReduce for the same job."),
  body("The results are shown in a small web application built with FastAPI and Next.js, and everything runs in Docker. The dataset has no author or date, so the system works only from the words in a post. It is batch processing on one laptop and not a real time system."),
];

// ---------- chapters ----------
const ch1 = [
  ...chapter("CHAPTER 1", "INTRODUCTION"),
  body("If you want to ask about sourdough bread or a car problem on Reddit, you first have to find the right community, and a post in the wrong place gets ignored. There are thousands of communities, so this is not easy. We wanted to answer a simple question: given a piece of text, which subreddits does it belong in?"),
  h("1.1 Problem Statement"),
  body("Given any text, return the five best fitting subreddits and the words that led to each choice. The data must be stored in MongoDB and processed with MapReduce, and the result must be tested on posts the system has not seen."),
  h("1.2 Objectives"),
  bullet("Load a large Kaggle dataset into MongoDB and clean it."),
  bullet("Build a profile of every community using MapReduce."),
  bullet("Measure how well the recommendations work on test posts."),
  bullet("Show the workflow and results in a web page that can be demonstrated live."),
  h("1.3 Dataset"),
  body("We used the Kaggle dataset “Reddit self post classification task” (https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts). It has 1,013,000 text posts from 1,013 subreddits, about 1,000 per subreddit. Each post has an id, a subreddit, a title and the body text. A second file groups the subreddits into 39 categories."),
  h("1.4 Limits"),
  body("The dataset has no author and no date. So the system can only judge a post by its words. It cannot give personal recommendations or show trends over time. All processing is done in batches on a single machine."),
];

const ch2 = [
  ...chapter("CHAPTER 2", "LITERATURE REVIEW"),
  body("MapReduce was introduced by Dean and Ghemawat as a way to process large data in two steps. A map function turns each record into key and value pairs, and a reduce function combines the values that share a key [1]. MongoDB supports this through its mapReduce command, where both functions are written in JavaScript. MongoDB has marked this command as deprecated since version 5.0 and recommends aggregation pipelines instead [5]. It still works on MongoDB 7.0, which we confirmed before starting."),
  body("TF-IDF is an old and reliable way to find the words that matter in a text. A word that appears in only a few documents tells you more than a word that appears everywhere [3]. Salton and Buckley showed that combining how often a word appears with how rare it is gives good results [2]. Documents can then be compared with cosine similarity, which measures how close two lists of weights are [8]."),
  body("Recommender systems are usually either collaborative, which use what many users did, or content based, which use the item itself [7]. Our data has no users, so we use a content based method that matches the words of a post to the vocabulary of each community. Large Reddit collections such as Pushshift are common in research [4], and the Kaggle dataset we used is a smaller and more balanced sample [6]."),
  body("Hadoop and Spark run MapReduce across many machines. We use a single MongoDB instance and do not claim distributed processing. What this project adds is one complete workflow from raw data to a live demo, with a fair test and a comparison between mapReduce and aggregation."),
];

const ch3 = [
  ...chapter("CHAPTER 3", "METHODOLOGY"),
  body("The project is a batch pipeline. Every step reads from MongoDB and writes back to it, and each step saves its input count, output count and time so that the web page can show them."),
  h("3.1 Loading and Cleaning"),
  body("The dataset is downloaded with the Kaggle tool inside Docker and loaded with mongoimport, which imported all 1,013,000 posts. Cleaning joins the title and body, removes web links and HTML leftovers, turns the text to lower case and keeps only letters. Posts with fewer than five words and duplicate ids are removed. Only 3 posts were dropped."),
  body("Before learning anything, we set aside 10% of the posts for testing. That left 911,474 posts for learning and 101,523 for testing. The MapReduce jobs never see the test posts."),
  h("3.2 The Three MapReduce Jobs"),
  body([run("Job 1 counts words. ", { bold: true }), run("Each subreddit is treated as one big document. For every post, the map function emits each distinct word with its subreddit, and the reduce function adds the counts up. This gave 8,100,109 word and subreddit counts.")]),
  body([run("Job 2 builds the TF-IDF index. ", { bold: true }), run("For a word with count c in a subreddit, the weight is (1 + ln c) × ln(N / df), where N is 1,013 subreddits and df is the number of subreddits that use the word. We drop rare words and words used in more than 300 subreddits. The index keeps 69,944 words.")]),
  body([run("Job 3 compares communities. ", { bold: true }), run("It multiplies the weights of every pair of subreddits that share a word and adds them up, then divides by the vector lengths to get cosine similarity. Each subreddit keeps its ten closest neighbours.")]),
  h("3.3 Recommending and Testing"),
  body("To score a text, we look up each of its words in the index, add up the weights for every subreddit and return the top five. We tested this on 5,000 random test posts. It counts as correct when the real subreddit is first (top 1) or among the five results (hit rate at 5). The baseline always suggests the five biggest subreddits."),
  h("3.4 System Setup"),
  body("There are three Docker services: MongoDB, a FastAPI service that serves the stored results and scores new text, and a Next.js web page. The Python steps run in a separate container when needed."),
];

const ch4 = [
  ...chapter("CHAPTER 4", "IMPLEMENTATION"),
  body("The project was built with MongoDB 7.0, Python 3.12 with PyMongo, FastAPI, Next.js with TypeScript, and Docker Compose. The Python steps connect to the database like this:"),
  code("from pymongo import MongoClient\n\nclient = MongoClient(\"mongodb://mongo:27017\")\ndb = client[\"threadsense\"]\nprint(db.posts_clean.count_documents({}))"),
  gap(),
  body("Job 1 is the simplest of the three jobs and shows how MapReduce was written. The map function emits a word once per post, and the reduce function adds the counts. Jobs 2 and 3 follow the same pattern and are shown in the appendices."),
  code(JOB1_MAP + "\n\n" + JOB1_REDUCE),
  gap(),
  body("The FastAPI service has nine endpoints that return the stored results. One of them, /api/recommend, scores pasted text against the saved index. The Next.js page shows the pipeline steps, a category chart, a network of related communities, a box to paste text and the final results. It only displays results that were already computed. It does not run MapReduce when you click."),
  h("4.1 Problems We Faced"),
  body("Our first cleaning attempt used a JavaScript function inside a MongoDB aggregation and ran out of memory, so we moved cleaning to Python and inserted posts in batches. Docker builds failed on the campus network because DNS did not work inside containers, so we built on a different network. We also dropped a second Kaggle dataset after finding that it was raw HTML pages and not a table."),
];

const ch5 = [
  ...chapter("CHAPTER 5", "TESTING AND VALIDATION"),
  body("We tested each stage by comparing what it reported with direct queries on the database, and we called every API endpoint and opened the web page in a browser. The table below lists the main checks."),
  table([
    ["Test case", "Expected result", "Observed result"],
    ["Import", "All rows load into MongoDB", "1,013,000 imported, 0 failed"],
    ["Cleaning", "Duplicates and tiny posts removed", "1,012,997 kept, 3 dropped"],
    ["Train and test split", "10% kept aside", "911,474 train and 101,523 test"],
    ["mapReduce on MongoDB 7.0", "Deprecated command still runs", "All three jobs completed"],
    ["Job 1 word counts", "Counts per word and subreddit", "8,100,109 counts"],
    ["Job 2 TF-IDF index", "Weights for useful words", "69,944 words indexed"],
    ["Job 3 similarity", "Neighbours for every subreddit", "1,013 subreddits, 10 each"],
    ["Recommender", "Score unseen posts", "72.6% top 1, 89.1% at 5"],
    ["mapReduce and aggregation", "Same output", "388,647 documents from both"],
    ["API and web page", "Show the stored results", "All endpoints answered, page works"],
  ], [2400, 3100, 3526]),
  gap(),
  body("Testing found two bugs that we fixed. Two endpoints failed because an async call was not awaited, and the step times showed a five and a half hour shift because MongoDB dates carry no time zone. We did not write formal unit tests, so correctness was checked through these counts and the test posts."),
];

const ch6 = [
  ...chapter("CHAPTER 6", "RESULTS AND DISCUSSION"),
  body("All eight pipeline steps together took about 12 minutes on a laptop. Job 1 was the slowest at 8 minutes 11 seconds, because it creates one record for each distinct word in each post. Job 2 took 40 seconds and Job 3 took 33 seconds."),
  h("6.1 How Well It Recommends"),
  table([
    ["Measure (5,000 test posts)", "ThreadSense", "Baseline"],
    ["Top 1 accuracy", "72.6%", "0.02%"],
    ["Hit rate at 5", "89.1%", "0.26%"],
  ], [4200, 2400, 2426]),
  gap(),
  img("docs/figures/accuracy.png", 360),
  caption("Figure 6.1 Recommendation quality on test posts."),
  body("A random guess among 1,013 communities is right 0.1% of the time, so these numbers show that the word profiles carry real information. We should be honest about two things. The baseline is near zero because every subreddit has about 1,000 posts, so the gap is large partly by design. Also, many posts mention their own community name, for example “breadit” in r/Breadit, which probably makes the task easier than it would be on text that never says where it belongs."),
  h("6.2 Examples"),
  table([
    ["Text", "Top suggestions"],
    ["My sourdough starter will not rise", "r/Breadit, with the words sourdough, flour, starter and rise"],
    ["Which camera lens is best for portraits", "r/photography, r/cinematography, r/gopro"],
    ["Debug a segmentation fault in my C code", "r/golang, r/rust, r/javahelp"],
  ], [3600, 5426]),
  gap(),
  body("The last example shows a limit. There is no subreddit about C programming in this data, so the system suggests the nearest programming communities. It can only recommend communities that exist in the dataset."),
  h("6.3 Related Communities"),
  body("The neighbours found by Job 3 make sense. The closest communities to r/Volvo are r/saab, r/Lexus, r/Honda and r/BMW, and related communities group together in the network below."),
  img("docs/figures/shot_graph.png", 400),
  caption("Figure 6.2 Network of related subreddits, coloured by category."),
  h("6.4 mapReduce and Aggregation"),
  table([
    ["Method", "With index", "Without index"],
    ["mapReduce", "15.44 s", "16.92 s"],
    ["Aggregation pipeline", "7.25 s", "8.64 s"],
  ], [3600, 2700, 2726]),
  gap(),
  body("Both methods counted words for 50 subreddits (44,971 posts) and produced the same 388,647 documents. Aggregation was about twice as fast, which fits MongoDB’s decision to deprecate mapReduce. The index helped only a little. This is one task on one machine, so we do not claim more than that."),
  h("6.5 The Web Page"),
  img("docs/shots/try-it.png", 400),
  caption("Figure 6.3 Paste a post and get the top five communities."),
  body("The page lets a viewer follow the whole workflow, from the step by step run records to the final recommendations, without running any commands."),
];

const conclusion = [
  ...unnumbered("CONCLUSION"),
  body("ThreadSense learns the vocabulary of 1,013 Reddit communities from over a million posts and suggests the best fitting communities for new text. MongoDB held the data and ran three MapReduce jobs, Python cleaned and tested the results, and a small web application presented them."),
  body("On posts it had never seen, the system chose the right community first 72.6% of the time and within its top five 89.1% of the time. Related communities were grouped sensibly, and aggregation turned out to be about twice as fast as mapReduce on the same task."),
  body("The limits are clear. The work is batch processing on one machine. The dataset has no author or date, so there are no personal recommendations or trends. The balanced data and the community names inside posts make the accuracy a little optimistic."),
  body("In the future we would add authors and dates from a larger Reddit archive, try text embeddings against TF-IDF, and move the jobs to Hadoop or Spark for bigger data. The project also gave us real practice with MongoDB, MapReduce, honest testing and building a complete data application."),
];

const references = [
  ...unnumbered("REFERENCES"),
  ...[
    "[1] J. Dean and S. Ghemawat, “MapReduce: Simplified Data Processing on Large Clusters,” OSDI, 2004.",
    "[2] G. Salton and C. Buckley, “Term weighting approaches in automatic text retrieval,” Information Processing & Management, vol. 24, no. 5, 1988.",
    "[3] K. Spärck Jones, “A statistical interpretation of term specificity and its application in retrieval,” Journal of Documentation, vol. 28, no. 1, 1972.",
    "[4] J. Baumgartner et al., “The Pushshift Reddit Dataset,” ICWSM, 2020.",
    "[5] MongoDB, “Map Reduce.” Available at: https://www.mongodb.com/docs/manual/core/map-reduce/",
    "[6] Kaggle, “The reddit self post classification task.” Available at: https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts",
    "[7] F. Ricci, L. Rokach and B. Shapira (eds.), Recommender Systems Handbook, Springer, 2011.",
    "[8] C. D. Manning, P. Raghavan and H. Schütze, Introduction to Information Retrieval, Cambridge University Press, 2008.",
    "[9] FastAPI, “Documentation.” Available at: https://fastapi.tiangolo.com/",
    "[10] Docker, “Compose Documentation.” Available at: https://docs.docker.com/compose/",
  ].map((t) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 140, line: 280 }, indent: { left: 540, hanging: 540 }, children: [run(t)] })),
];

const appendices = [
  ...unnumbered("APPENDICES"),
  body("These appendices give a few extra details about the project “ThreadSense: Discovering Which Reddit Communities You Belong In.”"),
  h("Appendix A: Technologies Used"),
  bullet("MongoDB 7.0: stores the posts and runs the MapReduce jobs."),
  bullet("Python and PyMongo: cleaning, testing and logging."),
  bullet("FastAPI: serves the stored results."),
  bullet("Next.js and TypeScript: the web page."),
  bullet("Docker Compose: runs every service."),
  h("Appendix B: Job 2 Finalize Function"),
  body("This function turns the word counts into TF-IDF weights."),
  code(JOB2_FINALIZE),
  gap(),
  h("Appendix C: Job 3 Map Function"),
  body("This function multiplies the weights of every pair of subreddits that share a word."),
  code(JOB3_PAIR),
  gap(),
  h("Appendix D: Sample Post"),
  body("A raw post has the fields id, subreddit, title and selftext. For example, id 58mbft, subreddit teenmom, title “So what was Matt “addicted” to?” and text “Did he ever say what his addiction was or is”. After cleaning, the text becomes “so what was matt addicted to did he ever say what his addiction was or is”."),
  h("Appendix E: How to Run"),
  code("docker compose up -d mongo\ndocker compose run --rm pipeline clean.py\ndocker compose run --rm pipeline split.py\ndocker compose run --rm pipeline job1_wordcount.py\ndocker compose run --rm pipeline job2_index.py\ndocker compose run --rm pipeline job3_similarity.py\ndocker compose run --rm pipeline recommend.py\ndocker compose up -d api frontend"),
  gap(),
  body("Source code: https://github.com/lebiraja/threadsense (private repository, access on request)."),
];

const mainFooter = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] });
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } };

const doc = new Document({
  creator: "Lebi Raja C", title: TITLE,
  styles: { default: { document: { run: { font: FONT, size: 24 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [
    { properties: { page }, children: [...cover, ...certificate, ...titlePage] },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...page, pageNumbers: { start: 1 } } }, footers: { default: mainFooter },
      children: [...abstract, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...conclusion, ...references, ...appendices] },
  ],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("report/ThreadSense_IA3_Report.docx", buf); console.log("written", buf.length); });
