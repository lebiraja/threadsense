"""Job 3 (MapReduce): subreddit-to-subreddit cosine similarity from the TF-IDF index.

3a: squared-weight sums give each subreddit vector's norm.
3b: for every word, emit each pair of subreddits sharing it with the product
    of their weights; summing over words gives the dot product.
"""
import time

from bson.code import Code

from db import get_db, log_step

NORM_MAP = Code("""
function () {
  for (var i = 0; i < this.value.p.length; i++)
    emit(this.value.p[i][0], this.value.p[i][1] * this.value.p[i][1]);
}""")
PAIR_MAP = Code("""
function () {
  var p = this.value.p;
  for (var i = 0; i < p.length; i++)
    for (var j = i + 1; j < p.length; j++) {
      var a = p[i][0], b = p[j][0];
      emit(a < b ? a + '|' + b : b + '|' + a, p[i][1] * p[j][1]);
    }
}""")
SUM = Code("function (key, values) { return Array.sum(values); }")
TOP_NEIGHBOURS = 10


def main() -> None:
    started = time.time()
    db = get_db()
    db.command({"mapReduce": "word_index", "map": NORM_MAP, "reduce": SUM,
                "out": {"replace": "sub_norms"}})
    db.command({"mapReduce": "word_index", "map": PAIR_MAP, "reduce": SUM,
                "out": {"replace": "sub_dots"}})
    norms = {d["_id"]: d["value"] ** 0.5 for d in db.sub_norms.find()}
    neighbours: dict[str, list[tuple[str, float]]] = {}
    for d in db.sub_dots.find():
        a, b = d["_id"].split("|")
        if a in norms and b in norms:
            sim = d["value"] / (norms[a] * norms[b])
            neighbours.setdefault(a, []).append((b, sim))
            neighbours.setdefault(b, []).append((a, sim))
    db.subreddit_sim.drop()
    db.subreddit_sim.insert_many(
        {"_id": s, "neighbours": [{"subreddit": n, "sim": round(v, 4)}
                                  for n, v in sorted(lst, key=lambda x: -x[1])[:TOP_NEIGHBOURS]]}
        for s, lst in neighbours.items())
    entry = log_step(db, "05_job3_similarity", started, db.word_index.count_documents({}),
                     db.subreddit_sim.count_documents({}),
                     f"mapReduce pair dot products + norms -> cosine; top {TOP_NEIGHBOURS} neighbours")
    print(entry)


if __name__ == "__main__":
    main()
