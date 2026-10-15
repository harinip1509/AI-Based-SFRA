"""
ControlVisionQA-10K: Engineering Visual Question Answering Dataset Generator
for Control Systems and Transformer Frequency Response Analysis.

Generates:
  - 512x512 resolution visual engineering plots:
      * Bode Plots (Magnitude & Phase)
      * Nyquist Plots (Real vs Imaginary G(jw))
      * Polar Plots (|G(jw)| vs Phase)
      * Nichols Charts (dB vs Phase degrees)
      * Inverse Nyquist Plots (1 / G(jw))
      * Transformer SFRA Plots (|H(f)| sweeps across frequency bands)
  - Automatic transfer function synthesis:
      * 1st-order, 2nd-order, and higher-order dynamic systems
      * Stable and unstable systems (Routh-Hurwitz / pole locations)
      * Minimum-phase and non-minimum-phase systems (right-half plane zeros)
      * Complex conjugate poles with varying damping ratios (zeta)
      * Realistic transformer ladder networks with resonance modes
  - High-density Question-Answer annotations (~14 QA pairs per image):
      * Stability, pole/zero counts, minimum phase, gain/phase margins,
        crossover frequencies, resonance peaks, and engineering interpretations.
  - Export in standard CSV and JSON formats.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
from pathlib import Path
from typing import Any

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal


PLOT_TYPES = ["bode", "nyquist", "polar", "nichols", "inverse_nyquist", "sfra"]


def generate_random_system(rng: random.Random) -> dict[str, Any]:
    """Synthesize a random continuous-time LTI system or transformer SFRA model."""
    sys_category = rng.choice(["first_order", "second_order", "higher_order", "transformer_sfra"])

    if sys_category == "first_order":
        tau = rng.uniform(0.01, 2.0)
        k = rng.uniform(0.5, 5.0)
        is_stable = rng.random() > 0.15
        pole = -1.0 / tau if is_stable else 1.0 / tau
        has_zero = rng.random() > 0.5
        zero = (-rng.uniform(0.5, 5.0)) if has_zero else None

        num = [k * (-zero), k] if (has_zero and zero) else [k]
        den = [tau, 1.0] if is_stable else [-tau, 1.0]
        poles = [complex(pole, 0.0)]
        zeros = [complex(zero, 0.0)] if zero is not None else []
        is_min_phase = (zero is None) or (zero < 0)
        zeta = 1.0
        order_desc = "First-order system"

    elif sys_category == "second_order":
        wn = rng.uniform(2.0, 30.0)
        zeta = rng.choice([rng.uniform(0.1, 0.9), rng.uniform(1.05, 2.5), 1.0])
        is_stable = rng.random() > 0.12
        if not is_stable:
            zeta = -abs(zeta)
        k = rng.uniform(1.0, 10.0)

        # den = s^2 + 2*zeta*wn*s + wn^2
        den = [1.0, 2.0 * zeta * wn, wn**2]
        has_zero = rng.random() > 0.6
        if has_zero:
            z_val = rng.uniform(-10.0, 10.0)
            num = [k, -k * z_val]
            zeros = [complex(z_val, 0.0)]
            is_min_phase = z_val < 0 and is_stable
        else:
            num = [k * (wn**2)]
            zeros = []
            is_min_phase = is_stable

        roots = np.roots(den)
        poles = [complex(r) for r in roots]
        order_desc = "Second-order system"

    elif sys_category == "higher_order":
        n_poles = rng.choice([3, 4])
        n_zeros = rng.randint(0, n_poles - 1)
        p_list = []
        is_stable = rng.random() > 0.15

        for _ in range(n_poles // 2):
            re = -rng.uniform(0.5, 8.0) if is_stable else rng.uniform(-2.0, 5.0)
            im = rng.uniform(2.0, 25.0)
            p_list.extend([complex(re, im), complex(re, -im)])
        if len(p_list) < n_poles:
            re = -rng.uniform(0.5, 10.0) if is_stable else rng.uniform(-3.0, 5.0)
            p_list.append(complex(re, 0.0))

        z_list = []
        is_min_phase = is_stable
        for _ in range(n_zeros):
            z_val = rng.uniform(-15.0, 15.0)
            z_list.append(complex(z_val, 0.0))
            if z_val > 0:
                is_min_phase = False

        k = rng.uniform(1.0, 15.0)
        den = np.poly(p_list).real.tolist()
        num = (k * np.poly(z_list).real).tolist() if z_list else [k]
        poles = p_list
        zeros = z_list
        zeta = rng.uniform(0.2, 0.8)
        order_desc = f"{n_poles}th-order system"

    else:  # transformer_sfra ladder proxy
        n_disks = rng.randint(4, 8)
        p_list = []
        for i in range(n_disks):
            wn = 50.0 + 800.0 * (i + 1)
            damping = rng.uniform(0.02, 0.08)
            p_list.extend([complex(-damping * wn, wn), complex(-damping * wn, -wn)])
        z_list = []
        for i in range(n_disks - 1):
            wz = 80.0 + 780.0 * (i + 1)
            z_list.extend([complex(-0.01 * wz, wz), complex(-0.01 * wz, -wz)])

        k = 1.0
        den = np.poly(p_list[:6]).real.tolist()
        num = np.poly(z_list[:4]).real.tolist()
        poles = p_list[:6]
        zeros = z_list[:4]
        is_stable = True
        is_min_phase = True
        zeta = 0.05
        order_desc = "Transformer winding ladder network"

    # Compute frequency response via scipy.signal
    w = np.logspace(-1, 3, 500)
    try:
        sys = signal.TransferFunction(num, den)
        w, mag, phase = signal.bode(sys, w=w)
        response_freq = w
        response_mag = mag
        response_phase = phase
    except Exception:
        # Fallback to simple first order
        num, den = [1.0], [1.0, 1.0]
        sys = signal.TransferFunction(num, den)
        w, mag, phase = signal.bode(sys, w=w)
        poles = [-1.0]
        zeros = []
        is_stable = True
        is_min_phase = True
        zeta = 1.0
        order_desc = "First-order fallback"

    # Calculate Margins
    mag_linear = 10.0 ** (mag / 20.0)
    # Gain crossover: mag_linear = 1 (mag = 0 dB)
    gc_idx = np.argmin(np.abs(mag))
    w_gc = float(w[gc_idx]) if abs(mag[gc_idx]) < 3.0 else None
    pm = float(180.0 + phase[gc_idx]) if w_gc is not None else None
    if pm is not None and pm > 180.0:
        pm -= 360.0

    # Phase crossover: phase = -180 deg
    pc_idx = np.argmin(np.abs(phase + 180.0))
    w_pc = float(w[pc_idx]) if abs(phase[pc_idx] + 180.0) < 15.0 else None
    gm = float(-mag[pc_idx]) if w_pc is not None else None

    # Resonance peak
    max_idx = int(np.argmax(mag))
    m_r = float(mag[max_idx]) if mag[max_idx] > mag[0] + 0.5 else None
    w_r = float(w[max_idx]) if m_r is not None else None

    stable_str = "Yes" if is_stable else "No"
    min_phase_str = "Yes" if is_min_phase else "No"

    return {
        "order_desc": order_desc,
        "is_stable": is_stable,
        "stable_str": stable_str,
        "n_poles": len(poles),
        "n_zeros": len(zeros),
        "is_min_phase": min_phase_str,
        "gain_margin": f"{gm:.1f} dB" if gm is not None else "Infinity",
        "phase_margin": f"{pm:.1f} deg" if pm is not None else "Infinite / Unbounded",
        "gain_crossover_freq": f"{w_gc:.2f} rad/s" if w_gc is not None else "None",
        "phase_crossover_freq": f"{w_pc:.2f} rad/s" if w_pc is not None else "None",
        "resonance_peak": f"{m_r:.1f} dB" if m_r is not None else "No resonant peak",
        "resonance_freq": f"{w_r:.2f} rad/s" if w_r is not None else "None",
        "zeta": round(float(zeta), 2),
        "w": w,
        "mag": mag,
        "phase": phase,
    }


def render_plot(system_data: dict[str, Any], plot_type: str, out_img_path: Path) -> None:
    """Render a 512x512 publication-quality engineering plot."""
    w = system_data["w"]
    mag = system_data["mag"]
    phase = system_data["phase"]

    # Set 512x512 pixels at 100 DPI
    fig = plt.figure(figsize=(5.12, 5.12), dpi=100)
    fig.patch.set_facecolor("#ffffff")

    if plot_type == "bode":
        ax1 = fig.add_subplot(2, 1, 1)
        ax1.semilogx(w, mag, color="#1f77b4", linewidth=1.8)
        ax1.set_ylabel("Magnitude (dB)", fontsize=9)
        ax1.grid(True, which="both", linestyle="--", alpha=0.6)
        ax1.set_title("Bode Frequency Response", fontsize=10, fontweight="bold")
        ax1.tick_params(labelsize=8)

        ax2 = fig.add_subplot(2, 1, 2)
        ax2.semilogx(w, phase, color="#d62728", linewidth=1.8)
        ax2.set_xlabel("Frequency (rad/s)", fontsize=9)
        ax2.set_ylabel("Phase (deg)", fontsize=9)
        ax2.grid(True, which="both", linestyle="--", alpha=0.6)
        ax2.tick_params(labelsize=8)

    elif plot_type == "nyquist":
        mag_lin = 10.0 ** (mag / 20.0)
        rad = np.radians(phase)
        re = mag_lin * np.cos(rad)
        im = mag_lin * np.sin(rad)

        ax = fig.add_subplot(1, 1, 1)
        ax.plot(re, im, color="#2ca02c", linewidth=1.8, label="G(jw)")
        ax.plot(re, -im, color="#2ca02c", linestyle=":", alpha=0.5)  # Negative conjugate
        ax.plot([-1.0], [0.0], "rx", markersize=8, markeredgewidth=2, label="Critical (-1, 0)")
        ax.set_title("Nyquist Stability Diagram", fontsize=10, fontweight="bold")
        ax.set_xlabel("Real Axis", fontsize=9)
        ax.set_ylabel("Imaginary Axis", fontsize=9)
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.axhline(0, color="black", linewidth=0.8, alpha=0.7)
        ax.axvline(0, color="black", linewidth=0.8, alpha=0.7)
        ax.legend(fontsize=8, loc="upper right")
        ax.tick_params(labelsize=8)

    elif plot_type == "polar":
        ax = fig.add_subplot(1, 1, 1, projection="polar")
        mag_lin = 10.0 ** (mag / 20.0)
        rad = np.radians(phase)
        ax.plot(rad, mag_lin, color="#9467bd", linewidth=1.8)
        ax.set_title("Polar Frequency Plot", fontsize=10, fontweight="bold", va="bottom")
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.tick_params(labelsize=8)

    elif plot_type == "nichols":
        ax = fig.add_subplot(1, 1, 1)
        ax.plot(phase, mag, color="#ff7f0e", linewidth=1.8)
        ax.set_title("Nichols Chart", fontsize=10, fontweight="bold")
        ax.set_xlabel("Open-Loop Phase (degrees)", fontsize=9)
        ax.set_ylabel("Open-Loop Magnitude (dB)", fontsize=9)
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.plot([-180.0], [0.0], "rx", markersize=8, markeredgewidth=2, label="Critical (-180 deg, 0 dB)")
        ax.legend(fontsize=8, loc="upper right")
        ax.tick_params(labelsize=8)

    elif plot_type == "inverse_nyquist":
        mag_lin = np.clip(10.0 ** (mag / 20.0), 1e-4, 1e4)
        rad = np.radians(phase)
        inv_re = (1.0 / mag_lin) * np.cos(-rad)
        inv_im = (1.0 / mag_lin) * np.sin(-rad)

        ax = fig.add_subplot(1, 1, 1)
        ax.plot(inv_re, inv_im, color="#8c564b", linewidth=1.8, label="1 / G(jw)")
        ax.plot([-1.0], [0.0], "rx", markersize=8, markeredgewidth=2, label="Critical Point")
        ax.set_title("Inverse Nyquist Plot", fontsize=10, fontweight="bold")
        ax.set_xlabel("Real {1 / G(jw)}", fontsize=9)
        ax.set_ylabel("Imag {1 / G(jw)}", fontsize=9)
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.axhline(0, color="black", linewidth=0.8, alpha=0.7)
        ax.axvline(0, color="black", linewidth=0.8, alpha=0.7)
        ax.legend(fontsize=8, loc="upper right")
        ax.tick_params(labelsize=8)

    else:  # SFRA sweep
        ax = fig.add_subplot(1, 1, 1)
        f_hz = np.logspace(3, 6.3, len(mag))
        sfra_db = mag - np.max(mag) - 10.0
        ax.semilogx(f_hz, sfra_db, color="#17becf", linewidth=1.8, label="Transformer |H(f)|")
        ax.set_title("Transformer Sweep Frequency Response (SFRA)", fontsize=10, fontweight="bold")
        ax.set_xlabel("Frequency (Hz)", fontsize=9)
        ax.set_ylabel("Transfer Function Magnitude 20*log10(|Vout/Vin|) (dB)", fontsize=8)
        ax.grid(True, which="both", linestyle="--", alpha=0.6)
        ax.legend(fontsize=8, loc="lower left")
        ax.tick_params(labelsize=8)

    plt.tight_layout()
    out_img_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_img_path, format="png", dpi=100, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close(fig)


def generate_qa_pairs(system_data: dict[str, Any], plot_type: str) -> list[dict[str, str]]:
    """Generate ~14 diverse engineering question-answer pairs for the given plot."""
    plot_name_map = {
        "bode": "Bode",
        "nyquist": "Nyquist",
        "polar": "Polar",
        "nichols": "Nichols Chart",
        "inverse_nyquist": "Inverse Nyquist",
        "sfra": "Sweep Frequency Response Analysis (SFRA)",
    }

    qa = [
        {"question": "What type of plot is shown?", "answer": plot_name_map[plot_type]},
        {"question": "Is the dynamic system stable?", "answer": system_data["stable_str"]},
        {"question": "How many poles are present in the system transfer function?", "answer": str(system_data["n_poles"])},
        {"question": "How many finite zeros are present in the transfer function?", "answer": str(system_data["n_zeros"])},
        {"question": "Is the system minimum-phase?", "answer": system_data["is_min_phase"]},
        {"question": "What is the estimated gain margin of the system?", "answer": system_data["gain_margin"]},
        {"question": "What is the estimated phase margin of the system?", "answer": system_data["phase_margin"]},
        {"question": "What is the gain crossover frequency?", "answer": system_data["gain_crossover_freq"]},
        {"question": "What is the phase crossover frequency?", "answer": system_data["phase_crossover_freq"]},
        {"question": "Does the magnitude response exhibit a resonant peak?", "answer": "Yes" if "dB" in system_data["resonance_peak"] else "No"},
        {"question": "What is the resonance peak magnitude?", "answer": system_data["resonance_peak"]},
        {"question": "What dynamic order best describes the underlying system?", "answer": system_data["order_desc"]},
        {"question": "What is the approximate damping ratio (zeta) of the dominant modes?", "answer": str(system_data["zeta"])},
        {
            "question": "Does the response indicate transformer structural degradation or high-frequency deformation?",
            "answer": "Yes, localized resonant shifts are present" if plot_type == "sfra" and system_data["n_poles"] >= 6 else "No structural fault indicated",
        },
    ]
    return qa


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate ControlVisionQA-10K multimodal dataset.")
    parser.add_argument("--samples", type=int, default=120, help="Number of images to generate (e.g. 120 for test, up to 10000).")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent / "control_vision_qa"
    images_dir = base_dir / "images"
    base_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    rng = random.Random(args.seed)
    csv_rows = []
    json_records = []

    print(f"\n=======================================================")
    print(f"Generating ControlVisionQA Dataset ({args.samples} samples)")
    print(f"Images resolution: 512 x 512 pixels")
    print(f"Output directory: {base_dir}")
    print(f"=======================================================\n")

    for idx in range(1, args.samples + 1):
        plot_type = rng.choice(PLOT_TYPES)
        rel_img_path = f"{plot_type}/{idx:06d}.png"
        abs_img_path = images_dir / rel_img_path

        sys_data = generate_random_system(rng)
        render_plot(sys_data, plot_type, abs_img_path)

        qa_list = generate_qa_pairs(sys_data, plot_type)

        # Append to CSV rows
        for item in qa_list:
            csv_rows.append({"image": rel_img_path, "question": item["question"], "answer": item["answer"]})

        # Append to JSON records
        json_records.append(
            {
                "image": rel_img_path,
                "plot_type": plot_type,
                "order": sys_data["order_desc"],
                "is_stable": sys_data["is_stable"],
                "qa": qa_list,
            }
        )

        if idx % max(1, args.samples // 10) == 0 or idx == args.samples:
            print(f"  [{idx}/{args.samples}] Generated {plot_type} image -> {rel_img_path} ({len(qa_list)} QA pairs)")

    # Save CSV
    csv_path = base_dir / "annotations.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["image", "question", "answer"])
        writer.writeheader()
        writer.writerows(csv_rows)

    # Save JSON
    json_path = base_dir / "annotations.json"
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(json_records, f, indent=2)

    print("\n-------------------------------------------------------")
    print(f"ControlVisionQA generation complete!")
    print(f"  Total Images:        {args.samples}")
    print(f"  Total QA Pairs:      {len(csv_rows)}")
    print(f"  Avg QA per image:    {len(csv_rows) / max(1, args.samples):.1f}")
    print(f"  CSV Annotations:     {csv_path}")
    print(f"  JSON Annotations:    {json_path}")
    print(f"-------------------------------------------------------\n")


if __name__ == "__main__":
    main()
