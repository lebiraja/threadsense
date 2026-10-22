"""Download the ThreadSense Reddit datasets from Kaggle into /data."""
import subprocess
import sys
from pathlib import Path

DATASETS: dict[str, str] = {
    "submissions": "pypiahmad/reddit-submissions",
    "selfposts": "mswarbrickjones/reddit-selfposts",
}
DATA_DIR = Path("/data")


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "download"
    only = sys.argv[2:]
    for name, slug in DATASETS.items():
        if only and name not in only:
            continue
        if mode == "list":
            run(["kaggle", "datasets", "files", slug])
            continue
        target = DATA_DIR / name
        target.mkdir(parents=True, exist_ok=True)
        run(["kaggle", "datasets", "download", slug, "-p", str(target), "--unzip"])


if __name__ == "__main__":
    main()
