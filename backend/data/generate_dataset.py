import argparse
import csv
import json
from pathlib import Path

from physics_fra_synthesis import synthesize_fra_magnitude

DEFAULT_TOTAL_SAMPLES = 50000
SERIES_LENGTH = 500
LABELS = ["Normal", "Minor Deviation", "Moderate Fault", "High Fault Risk"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate labeled FRA magnitude dataset (physics-style ladder SFRA synthesis)."
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=DEFAULT_TOTAL_SAMPLES,
        help=f"Number of labeled curves (default: {DEFAULT_TOTAL_SAMPLES}).",
    )
    args = parser.parse_args()
    total_samples = max(len(LABELS), args.samples - (args.samples % len(LABELS)))

    out_path = Path(__file__).with_name("fra_dataset.csv")
    per_class = total_samples // len(LABELS)
    rows = []
    seed_base = 42
    for label_idx, label in enumerate(LABELS):
        for i in range(per_class):
            seed = seed_base + label_idx * 1_000_000 + i
            series = synthesize_fra_magnitude(SERIES_LENGTH, label, seed=seed)
            rows.append((json.dumps([float(v) for v in series]), label))

    import random

    random.shuffle(rows)

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["series", "label"])
        writer.writerows(rows)

    print(f"Saved {len(rows)} physics-style SFRA samples ({per_class} per class) to {out_path}")


if __name__ == "__main__":
    main()
