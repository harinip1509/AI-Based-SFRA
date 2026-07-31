from typing import Dict, List

import numpy as np


def _zero_crossings(values: List[float]) -> int:
    count = 0
    for i in range(1, len(values)):
        a = values[i - 1]
        b = values[i]
        if (a < 0 <= b) or (a > 0 >= b):
            count += 1
    return count


def analyze_fra(values: List[float]) -> Dict[str, object]:
    cleaned = [float(v) for v in values if np.isfinite(v)]
    if not cleaned:
        return {
            "classification": "Normal",
            "metrics": {
                "mean": 0.0,
                "max": 0.0,
                "min": 0.0,
                "std": 0.0,
                "peak_to_peak": 0.0,
                "energy": 0.0,
                "spectral_energy": 0.0,
                "zero_crossings": 0,
            },
            "signals": {
                "std_flag": False,
                "range_flag": False,
                "energy_flag": False,
                "spectral_flag": False,
            },
        }

    arr = np.asarray(cleaned, dtype=np.float64)
    n = int(arr.size)
    mean_v = float(np.mean(arr))
    max_v = float(np.max(arr))
    min_v = float(np.min(arr))
    std_v = float(np.std(arr))
    peak_to_peak = float(max_v - min_v)
    energy = float(np.sum(arr ** 2))
    fft_vals = np.fft.fft(arr)
    fft_magnitude = np.abs(fft_vals)
    spectral_energy = float(np.sum(fft_magnitude[: len(fft_magnitude) // 2]))
    zero_crossings = int(_zero_crossings(cleaned))

    scale = max(abs(mean_v), 1e-6)
    norm_std = std_v / scale
    norm_range = peak_to_peak / scale
    norm_spectral = spectral_energy / (n + 1e-6)
    dynamic_energy_threshold = max(1e-6, float(np.mean(arr ** 2)) * n * 1.3)
    spectral_threshold = 10.0

    std_flag = norm_std > 0.5
    range_flag = norm_range > 1.0
    energy_flag = energy > dynamic_energy_threshold
    spectral_flag = norm_spectral > spectral_threshold
    score = int(std_flag) + int(range_flag) + int(energy_flag) + int(spectral_flag)

    if score == 0:
        classification = "Normal"
    elif score == 1:
        classification = "Minor Deviation"
    elif score == 2:
        classification = "Moderate Fault"
    else:
        classification = "High Fault Risk"

    return {
        "classification": classification,
        "metrics": {
            "mean": float(mean_v),
            "max": float(max_v),
            "min": float(min_v),
            "std": float(std_v),
            "peak_to_peak": float(peak_to_peak),
            "energy": float(energy),
            "spectral_energy": float(spectral_energy),
            "zero_crossings": int(zero_crossings),
        },
        "signals": {
            "std_flag": std_flag,
            "range_flag": range_flag,
            "energy_flag": energy_flag,
            "spectral_flag": spectral_flag,
        },
    }
