"""
Physics-inspired SFRA magnitude synthesis (ladder-model approximation).

Inspired by lumped ladder winding models and fault classes used in SFRA literature:
  - NF:  Normal / Healthy Baseline
  - DLF: Dielectric Loss Factor (insulation degradation / moisture in oil/paper)
  - CLF: Clamping Looseness Fault (previously misnamed LCF in draft; relaxation of clamping pressure)
  - RDF: Radial Deformation Fault (buckling / radial displacement of winding disks)
  - IDF: Inter-Disk Fault (axial displacement / spacing changes between disks)
  - SCF: Short-Circuit Fault (inter-turn or inter-winding short circuit)

Reference taxonomy:
  - IEEE Std C57.149-2012 (Guide for the Application and Interpretation of Frequency Response Analysis)
  - IEC 60076-18 (Measurement of frequency response)
  - MDPI Energies 2023 (en16176347)

Produces |H(f)|-like curves on a logarithmic frequency grid (1 kHz to 2 MHz).
Crucially: Circular monotonicity on "Normal" curves has been REMOVED so Normal
reflects physical multi-mode winding resonances with physical tolerances.
"""
from __future__ import annotations

import random
from typing import Literal

import numpy as np

FaultArchetype = Literal["NF", "DLF", "CLF", "RDF", "IDF", "SCF"]
SeverityLabel = Literal["Normal", "Minor Deviation", "Moderate Fault", "High Fault Risk"]

F_MIN_HZ = 1e3
F_MAX_HZ = 2e6

ARCHETYPE_TO_SEVERITY: dict[FaultArchetype, SeverityLabel] = {
    "NF": "Normal",
    "DLF": "Minor Deviation",
    "CLF": "Minor Deviation",
    "RDF": "Moderate Fault",
    "IDF": "Moderate Fault",
    "SCF": "High Fault Risk",
}


def sfra_frequency_grid(length: int) -> tuple[np.ndarray, np.ndarray]:
    """Log-spaced Hz grid and normalized coordinate in [0, 1]."""
    hz = np.logspace(np.log10(F_MIN_HZ), np.log10(F_MAX_HZ), length, dtype=np.float64)
    fn = (np.log10(hz) - np.log10(F_MIN_HZ)) / (np.log10(F_MAX_HZ) - np.log10(F_MIN_HZ))
    return fn, hz


def _lorentzian_peak(fn: np.ndarray, center: float, q: float, amplitude: float) -> np.ndarray:
    """Magnitude contribution of one winding mode (resonance peak)."""
    width = max(0.008, 0.12 / max(q, 0.5))
    return amplitude / (1.0 + ((fn - center) / width) ** 2)


def _disk_modes(rng: random.Random, n_disks: int = 10) -> list[tuple[float, float, float]]:
    """Random healthy ladder disk modes: (center fn, Q, amplitude)."""
    modes = []
    for i in range(n_disks):
        center = 0.08 + 0.82 * (i + rng.uniform(0.0, 0.85)) / n_disks
        q = rng.uniform(4.0, 14.0)
        amp = rng.uniform(0.35, 1.4)
        modes.append((center, q, amp))
    return modes


def _combine_modes(fn: np.ndarray, modes: list[tuple[float, float, float]]) -> np.ndarray:
    y = np.zeros_like(fn)
    for center, q, amp in modes:
        y += _lorentzian_peak(fn, center, q, amp)
    return y


def _apply_nf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """
    Healthy baseline with realistic manufacturing / repeatability tolerances:
    Slight variation in resonance frequencies (+/-0.5%) and damping (+/-1%).
    """
    out = []
    for center, q, amp in modes:
        out.append(
            (
                center + rng.uniform(-0.005, 0.005),
                q * rng.uniform(0.97, 1.03),
                amp * rng.uniform(0.97, 1.03),
            )
        )
    return out


def _apply_dlf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """
    Dielectric Loss Factor (DLF):
    Moisture / thermal aging in paper/oil insulation increases conductance (tan delta).
    Results in broadened resonance peaks (decreased Q) and elevated dielectric leakage floor.
    """
    tan_delta = rng.uniform(0.08, 0.50)
    out = []
    for center, q, amp in modes:
        q_new = max(1.2, q * (1.0 - 0.60 * tan_delta))
        amp_new = amp * rng.uniform(0.92, 1.08)
        out.append((center, q_new, amp_new))
    return out


def _apply_clf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """
    Clamping Looseness Fault (CLF):
    Loss of mechanical clamping pressure shifts low-frequency core and clamping
    modes downward (frequency shift in 0.05-0.30 fn range) and broadens clamping Q.
    """
    out = []
    for center, q, amp in modes:
        if center < 0.35:
            # Low-frequency downward shift & damping from loose clamping
            c_new = np.clip(center * rng.uniform(0.88, 0.96), 0.02, 0.98)
            q_new = q * rng.uniform(0.75, 0.90)
        else:
            c_new = center
            q_new = q
        out.append((c_new, q_new, amp * rng.uniform(0.95, 1.05)))
    return out


def _apply_rdf(
    modes: list[tuple[float, float, float]], rng: random.Random, shift_scale: float = 0.10
) -> list[tuple[float, float, float]]:
    """
    Radial Deformation Fault (RDF):
    Radial buckling / forced displacement changes shunt capacitance to core/tank,
    shifting mode resonance centers across mid and high frequencies.
    """
    shift = rng.uniform(-shift_scale, shift_scale)
    out = []
    for center, q, amp in modes:
        c_new = np.clip(center * (1.0 + shift), 0.02, 0.98)
        out.append((c_new, q * rng.uniform(0.85, 1.15), amp * rng.uniform(0.90, 1.10)))
    return out


def _apply_idf(
    modes: list[tuple[float, float, float]], rng: random.Random, gap_scale: float = 0.035
) -> list[tuple[float, float, float]]:
    """
    Inter-Disk Fault (IDF):
    Axial displacement / tilt causes non-uniform series capacitance between disks,
    producing paired split resonance peaks.
    """
    out = []
    gap = rng.uniform(gap_scale * 0.5, gap_scale * 1.5)
    for center, q, amp in modes:
        split = rng.uniform(0.4, 0.6)
        out.append((np.clip(center - gap, 0.02, 0.98), q * 0.85, amp * split))
        out.append((np.clip(center + gap, 0.02, 0.98), q * 0.85, amp * (1.0 - split)))
    return out


def _apply_scf(
    fn: np.ndarray, y: np.ndarray, rng: random.Random, severity_boost: float = 0.0
) -> np.ndarray:
    """
    Short-Circuit Fault (SCF):
    Inter-turn or inter-winding short produces severe localized impedance notch,
    pronounced mid-to-high frequency roll-off, and loss of fine resonant peaks.
    """
    severity = np.clip(rng.uniform(0.40, 1.0) + severity_boost, 0.35, 1.25)
    r_sc = rng.uniform(0.10, 0.50)
    notch_center = rng.uniform(0.30, 0.75)
    notch = severity * 0.95 / (1.0 + ((fn - notch_center) / 0.04) ** 2)
    hf_mask = 1.0 - severity * 0.65 * np.clip((fn - 0.40) / 0.60, 0.0, 1.0)
    y = y * hf_mask - notch
    y += severity * r_sc * np.exp(-((fn - rng.uniform(0.20, 0.50)) ** 2) / 0.008)
    return y


def synthesize_fra_magnitude(
    length: int,
    archetype: FaultArchetype,
    seed: int | None = None,
    is_held_out: bool = False,
    noise_boost: float = 0.0,
) -> tuple[np.ndarray, FaultArchetype, SeverityLabel]:
    """
    Generate one physics-style magnitude vector for the given fault archetype.

    Args:
        length: Number of frequency points (e.g. 500).
        archetype: One of 'NF', 'DLF', 'CLF', 'RDF', 'IDF', 'SCF'.
        seed: Random seed for repeatability.
        is_held_out: When True, shifts resonance frequencies (+/-15%), alters Q damping,
                     and tests out-of-distribution generalization.
        noise_boost: Additional noise level for out-of-distribution robustness evaluation.

    Returns:
        (magnitude_array, archetype, severity_label)
    """
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)

    fn, _hz = sfra_frequency_grid(length)
    n_disks = rng.randint(8, 12)
    modes = _disk_modes(rng, n_disks=n_disks)

    if is_held_out:
        # Parameter shift for OOD held-out evaluation:
        # +/-15% frequency scaling shift and perturbed damping
        freq_shift_factor = rng.uniform(0.85, 1.15)
        modes = [
            (
                float(np.clip(c * freq_shift_factor, 0.02, 0.98)),
                float(max(1.0, q * rng.uniform(0.70, 1.30))),
                float(a * rng.uniform(0.80, 1.20)),
            )
            for c, q, a in modes
        ]

    # Apply physical archetype perturbation
    if archetype == "NF":
        modes = _apply_nf(modes, rng)
    elif archetype == "DLF":
        modes = _apply_dlf(modes, rng)
    elif archetype == "CLF":
        modes = _apply_clf(modes, rng)
    elif archetype == "RDF":
        shift_scale = 0.15 if is_held_out else 0.10
        modes = _apply_rdf(modes, rng, shift_scale=shift_scale)
    elif archetype == "IDF":
        gap_scale = 0.05 if is_held_out else 0.035
        modes = _apply_idf(modes, rng, gap_scale=gap_scale)

    y = _combine_modes(fn, modes)

    # Winding capacitive roll-off (high-frequency decay of |H|)
    alpha = rng.uniform(0.35, 0.95)
    y *= np.exp(-alpha * fn)

    if archetype == "SCF":
        y = _apply_scf(fn, y, rng, severity_boost=0.15 if is_held_out else 0.0)

    # Instrument noise & repeatability band
    if is_held_out:
        # Elevated noise range for held-out evaluation: sigma in [0.03, 0.08]
        noise_std = rng.uniform(0.03, 0.08) + noise_boost
    else:
        # Standard in-distribution noise
        noise_std = rng.uniform(0.005, 0.025) if archetype == "NF" else rng.uniform(0.015, 0.055)

    y += np_rng.normal(0, noise_std, size=length)

    # Map to project magnitude scale [0, 30]
    y = y - np.min(y)
    peak = max(float(np.max(y)), 1e-6)
    target_peak = rng.uniform(14.0, 26.0)
    y = y * (target_peak / peak)

    # NOTE: Circular monotonic clipping on Normal curves has been PERMANENTLY REMOVED.
    # Healthy transformers exhibit authentic multiple resonant peaks and anti-resonances,
    # consistent with real physical FRA sweeps (IEEE C57.149 / IEC 60076-18).

    severity = ARCHETYPE_TO_SEVERITY[archetype]
    return np.clip(y, 0.0, 30.0).astype(np.float64), archetype, severity
