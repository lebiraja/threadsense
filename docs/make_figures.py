"""Build report charts from the live API (run with a venv that has matplotlib + pillow)."""
import json
import urllib.request

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = "docs/figures"
INK, AMBER, GREY = "#1d1d1b", "#d98b0b", "#9a968c"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "axes.edgecolor": GREY, "axes.labelcolor": INK,
                     "xtick.color": INK, "ytick.color": INK, "font.size": 10})


def get(path: str):
    with urllib.request.urlopen(f"http://localhost:8000/api/{path}") as r:
        return json.load(r)


cats = get("categories")[:12][::-1]
fig, ax = plt.subplots(figsize=(7, 4))
ax.barh([c["category"] for c in cats], [c["posts"] for c in cats], color=AMBER)
for i, c in enumerate(cats):
    ax.text(c["posts"] + 1200, i, f'{c["posts"]:,}', va="center", fontsize=8, color=INK)
ax.set_xlabel("posts in the dataset")
ax.set_title("Top 12 of 39 subreddit categories by number of posts", loc="left", fontsize=10)
fig.tight_layout(); fig.savefig(f"{OUT}/categories.png", dpi=200); plt.close(fig)

ev = get("results")["eval"]
fig, ax = plt.subplots(figsize=(6, 3.6))
labels, model = ["Top-1 accuracy", "Hit rate @ 5"], [ev["top1_accuracy"], ev["hit_rate_at_5"]]
base = [ev["baseline_top1"], ev["baseline_hit_rate_at_5"]]
x = range(2)
ax.bar([i - 0.2 for i in x], [m * 100 for m in model], 0.4, color=AMBER, label="ThreadSense (TF-IDF)")
ax.bar([i + 0.2 for i in x], [b * 100 for b in base], 0.4, color=GREY, label="Most-popular baseline")
for i in x:
    ax.text(i - 0.2, model[i] * 100 + 1.5, f"{model[i]*100:.1f}%", ha="center", fontsize=9)
    ax.text(i + 0.2, base[i] * 100 + 1.5, f"{base[i]*100:.2f}%", ha="center", fontsize=9)
ax.set_xticks(list(x), labels); ax.set_ylim(0, 100); ax.set_ylabel("% of 5,000 held-out posts")
ax.legend(frameon=False, loc="upper right")
ax.set_title("Recommendation quality on held-out posts", loc="left", fontsize=10)
fig.tight_layout(); fig.savefig(f"{OUT}/accuracy.png", dpi=200); plt.close(fig)

rows = get("results")["timing"]
fig, ax = plt.subplots(figsize=(6, 3.6))
for k, (method, colour) in enumerate((("mapReduce", AMBER), ("aggregation", INK))):
    vals = [next(r["seconds"] for r in rows if r["method"] == method and r["indexed"] == idx)
            for idx in (True, False)]
    pos = [i + (k - 0.5) * 0.36 for i in range(2)]
    ax.bar(pos, vals, 0.36, color=colour, label=method)
    for p, v in zip(pos, vals):
        ax.text(p, v + 0.3, f"{v:.1f}s", ha="center", fontsize=9)
ax.set_xticks([0, 1], ["with index on subreddit", "without index"])
ax.set_ylabel("seconds"); ax.legend(frameon=False)
ax.set_title("Word counts for 50 subreddits (44,971 posts)", loc="left", fontsize=10)
fig.tight_layout(); fig.savefig(f"{OUT}/timing.png", dpi=200); plt.close(fig)

steps = get("pipeline")
fig, ax = plt.subplots(figsize=(7, 3.8))
names = [s["step"][3:].replace("_", " ") for s in steps][::-1]
secs = [s["duration_s"] for s in steps][::-1]
ax.barh(names, secs, color=[AMBER if "job" in n else GREY for n in names])
ax.set_xscale("log"); ax.set_xlabel("duration in seconds (log scale)")
for i, v in enumerate(secs):
    ax.text(v * 1.08, i, f"{v:.1f}s", va="center", fontsize=8)
ax.set_xlim(1, 2000)
ax.set_title("Duration of each pipeline step (MapReduce jobs in amber)", loc="left", fontsize=10)
fig.tight_layout(); fig.savefig(f"{OUT}/steps.png", dpi=200); plt.close(fig)
print("ok")
