"""Job 1 (MapReduce): word counts per subreddit over the training split."""
import sys
import time

from bson.code import Code

from db import get_db, log_step

MAP = Code("""
function () {
  var seen = {};
  var words = this.text.split(' ');
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (w.length < 3 || w.length > 20 || STOP[w] || seen[w]) continue;
    seen[w] = 1;                      // count each word once per post
    emit(w + '|' + this.subreddit, 1);
  }
}""")
REDUCE = Code("function (key, values) { return Array.sum(values); }")
STOP = {w: 1 for w in (
    "the and for are but not you all any can had her was one our out has have this that with "
    "from they will would there their what about which when your said them then than these "
    "been were being more also just like get got its it's i'm don't can't didn't i've i'll "
    "im dont cant ive ill").split()}


def main() -> None:
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    started = time.time()
    db = get_db()
    cmd = {"mapReduce": "posts_clean", "map": MAP, "reduce": REDUCE,
           "query": {"split": "train"}, "scope": {"STOP": STOP},
           "out": {"replace": "word_counts" if not limit else "word_counts_sample"}}
    if limit:
        cmd["limit"] = limit
    res = db.command(cmd)
    out = "word_counts" if not limit else "word_counts_sample"
    n_in = db.posts_clean.count_documents({"split": "train"}) if not limit else limit
    n_out = db[out].count_documents({})
    entry = log_step(db, "03_job1_wordcount" + ("_sample" if limit else ""), started,
                     n_in, n_out, "mapReduce word|subreddit -> count (train split only)")
    print(entry)


if __name__ == "__main__":
    main()
