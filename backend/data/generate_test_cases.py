import csv
import os

import numpy as np


def inject_spikes(values, positions, amp_range):
    out = values.copy()
    for idx in positions:
        out[idx] += np.random.uniform(*amp_range)
    return out


def save_case(name, values, freq):
    path = f"backend/data/test_cases/{name}.csv"
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["frequency", "magnitude"])
        for fval, mval in zip(freq, values):
            writer.writerow([float(fval), float(mval)])


def main():
    os.makedirs("backend/data/test_cases", exist_ok=True)

    np.random.seed(42)
    x = np.linspace(0, 1, 500)
    freq = np.linspace(100, 1_000_000, 500)

    normal = 1.2 + (20.0 - 1.2) * np.exp(-2.2 * x)
    normal += np.random.normal(0, 0.003, size=500)
    for i in range(1, len(normal)):
        normal[i] = min(normal[i], normal[i - 1])

    minor = 1.2 + (20.0 - 1.2) * np.exp(-2.2 * x)
    minor += 0.8 * np.sin(2.0 * np.pi * 1.5 * x + 0.4)
    minor += np.random.normal(0, 0.03, size=500)

    moderate = 1.2 + (20.0 - 1.2) * np.exp(-2.1 * x)
    moderate += 2.0 * np.sin(2.0 * np.pi * 8.0 * x + 0.7)
    moderate += np.random.normal(0, 0.08, size=500)
    for center, width, delta in [(140, 18, 1.6), (275, 22, -1.9), (380, 16, 1.4)]:
        moderate[center - width:center + width] += delta * np.hanning(2 * width)

    high = 1.2 + (20.0 - 1.2) * np.exp(-2.0 * x)
    high += 2.6 * np.sin(2.0 * np.pi * 16.0 * x + 1.1)
    high += np.random.normal(0, 0.18, size=500)
    high[120:] += 2.4
    high[250:] -= 3.1
    high[360:] += 1.9
    high[90:125] -= 2.6
    high[305:340] += 3.4
    high = inject_spikes(high, positions=[55, 103, 149, 211, 287, 344, 401, 458], amp_range=(5.5, 9.0))

    normal = np.clip(normal, 0, 30)
    minor = np.clip(minor, 0, 30)
    moderate = np.clip(moderate, 0, 30)
    high = np.clip(high, 0, 30)

    save_case("normal", normal, freq)
    save_case("minor", minor, freq)
    save_case("moderate", moderate, freq)
    save_case("high_fault", high, freq)

    print("FRA test files generated successfully.")


if __name__ == "__main__":
    main()
