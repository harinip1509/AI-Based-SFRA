"""
Dataset generator for physics-inspired SFRA traces.

Generates:
  1. Main training/validation dataset: fra_dataset.csv (balanced across 6 archetypes & 4 severities)
  2. Shifted out-of-distribution held-out test set: held_out_test.csv
     (frequency shift +/-15%, altered Q damping, elevated noise sigma in [0.03, 0.08], unseen seeds)

Each sample record contains:
  - series: JSON array of 500 magnitude values (scaled [0, 30])
  - label: Severity class (Normal, Minor Deviation, Moderate Fault, High Fault Risk)
  - archetype: Physical fault type (NF, DLF, CLF, RDF, IDF, SCF)
"""
from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path

from physics_fra_synthesis import (
    ARCHETYPE_TO_SEVERITY,
    FaultArchetype,
    SeverityLabel,
    synthesize_fra_magnitude,
)

SERIES_LENGTH = 500
ALL_ARCHETYPES: list[FaultArchetype] = ["NF", "DLF", "CLF", "RDF", "IDF", "SCF"]
SEVERITY_LABELS: list[SeverityLabel] = ["Normal", "Minor Deviation", "Moderate Fault", "High Fault Risk"]


def generate_samples(
    total_samples: int,
    seed_base: int,
    is_held_out: bool = False,
    noise_boost: float = 0.0,
) -> list[dict]:
    per_archetype = max(1, total_samples // len(ALL_ARCHETYPES))
    samples = []

    for arch_idx, arch in enumerate(ALL_ARCHETYPES):
        for i in range(per_archetype):
            seed = seed_base + arch_idx * 1_000_000 + i
            series, archetype, severity = synthesize_fra_magnitude(
                length=SERIES_LENGTH,
                archetype=arch,
                seed=seed,
                is_held_out=is_held_out,
                noise_boost=noise_boost,
            )
            samples.append(
                {
                    "series": json.dumps([round(float(v), 4) for v in series]),
                    "label": severity,
                    "archetype": archetype,
                    "is_held_out": int(is_held_out),
                }
            )

    rng = random.Random(seed_base + 999)
    rng.shuffle(samples)
    return samples


def save_dataset_csv(samples: list[dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["series", "label", "archetype", "is_held_out"])
        writer.writeheader()
        writer.writerows(samples)
    print(f"Saved {len(samples)} samples to {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate labeled SFRA datasets (train/val and held-out test).")
    parser.add_argument("--samples", type=int, default=12000, help="Total samples for main dataset (default: 12000).")
    parser.add_argument(
        "--held_out_samples",
        type=int,
        default=2400,
        help="Total samples for held-out test set (default: 2400).",
    )
    args = parser.parse_args()

    data_dir = Path(__file__).resolve().parent

    print("\n--- Generating Main Dataset (In-Distribution) ---")
    main_samples = generate_samples(
        total_samples=args.samples,
        seed_base=42,
        is_held_out=False,
    )
    save_dataset_csv(main_samples, data_dir / "fra_dataset.csv")

    print("\n--- Generating Held-Out Test Set (Out-of-Distribution) ---")
    held_out_samples = generate_samples(
        total_samples=args.held_out_samples,
        seed_base=999999,  # Completely distinct seed space
        is_held_out=True,  # Parameter shifts +/-15%, perturbed damping, elevated noise
    )
    save_dataset_csv(held_out_samples, data_dir / "held_out_test.csv")

    print("\nSummary of generated datasets:")
    print(f"  Main dataset:     {len(main_samples)} samples -> {data_dir / 'fra_dataset.csv'}")
    print(f"  Held-out test:    {len(held_out_samples)} samples -> {data_dir / 'held_out_test.csv'}")


if __name__ == "__main__":
    main()
