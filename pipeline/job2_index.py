"""Job 2 (MapReduce): TF-IDF inverted index. word -> [[subreddit, weight], ...]

Map emits one posting per (word, subreddit) pair from Job 1 counts. Reduce
concatenates postings. Finalize turns counts into TF-IDF weights: document
frequency is the number of postings, so idf = ln(N / df).
"""
import time

from bson.code import Code

from db import get_db, log_step

MIN_COUNT = 5     # ignore words seen fewer times in a subreddit (typos, hapax)
MAX_DF = 300      # words in more subreddits than this carry no topic signal
TOP_PER_WORD = 60  # keep only the strongest subreddits per word

MAP = Code("""
function () {
  if (this.value < MIN_COUNT) return;
  var i = this._id.indexOf('|');
  emit(this._id.substring(0, i), {p: [[this._id.substring(i + 1), this.value]]});
}""")
REDUCE = Code("""
function (key, values) {
  var p = [];
  values.forEach(function (v) { for (var i = 0; i < v.p.length; i++) p.push(v.p[i]); });
  return {p: p};
}""")
FINALIZE = Code("""
function (key, v) {
  var df = v.p.length;
  if (df > MAX_DF) return {p: [], df: df};
  var idf = Math.log(N_SUB / df);
  var out = v.p.map(function (x) { return [x[0], (1 + Math.log(x[1])) * idf]; });
  out.sort(function (a, b) { return b[1] - a[1]; });
  return {p: out.slice(0, TOP_PER_WORD), df: df};
}""")


def main() -> None:
    started = time.time()
    db = get_db()
    n_sub = len(db.posts_clean.distinct("subreddit"))
    db.command({"mapReduce": "word_counts", "map": MAP, "reduce": REDUCE, "finalize": FINALIZE,
                "scope": {"MIN_COUNT": MIN_COUNT, "MAX_DF": MAX_DF,
                          "TOP_PER_WORD": TOP_PER_WORD, "N_SUB": n_sub},
                "out": {"replace": "word_index"}})
    db.word_index.delete_many({"value.p": {"$size": 0}})
    entry = log_step(db, "04_job2_index", started, db.word_counts.estimated_document_count(),
                     db.word_index.count_documents({}),
                     f"mapReduce TF-IDF inverted index; min_count={MIN_COUNT}, max_df={MAX_DF}, "
                     f"top {TOP_PER_WORD} subreddits per word")
    print(entry)


if __name__ == "__main__":
    main()
