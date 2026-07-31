"""
Physics-inspired SFRA magnitude synthesis (ladder-model approximation).

Inspired by lumped ladder winding models and fault classes used in SFRA literature
(RDF, IDF, DLF, LCF, SCF, NF — e.g. MDPI Energies 2023, en16176347).

This is simulation, not FEM or field measurements. It produces |H(f)|-like curves
on a logarithmic frequency grid (≈1 kHz–2 MHz), resampled to a fixed length.
"""
from __future__ import annotations

import random
from typing import Literal

import numpy as np

FaultKind = Literal["NF", "DLF", "LCF", "RDF", "IDF", "SCF"]

F_MIN_HZ = 1e3
F_MAX_HZ = 2e6


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
    """Non-fault: tiny parameter drift (repeatability / measurement noise band)."""
    out = []
    for center, q, amp in modes:
        out.append(
            (
                center + rng.uniform(-0.002, 0.002),
                q * rng.uniform(0.998, 1.002),
                amp * rng.uniform(0.998, 1.002),
            )
        )
    return out


def _apply_dlf_lcf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """Dielectric leakage / clamping loss: broader peaks (lower Q), slight leakage floor."""
    tan_delta = rng.uniform(0.05, 0.55)
    out = []
    for center, q, amp in modes:
        q_new = max(1.2, q * (1.0 - 0.65 * tan_delta))
        amp_new = amp * rng.uniform(0.92, 1.08)
        out.append((center, q_new, amp_new))
    return out


def _apply_rdf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """Radial deformation: shift mode centers (±10% radius proxy)."""
    shift = rng.uniform(-0.10, 0.10)
    out = []
    for center, q, amp in modes:
        out.append((np.clip(center * (1.0 + shift), 0.02, 0.98), q, amp * rng.uniform(0.9, 1.1)))
    return out


def _apply_idf(modes: list[tuple[float, float, float]], rng: random.Random) -> list[tuple[float, float, float]]:
    """Inter-disk displacement: split modes (100% spacing change → paired peaks)."""
    out = []
    gap = rng.uniform(0.015, 0.045)
    for center, q, amp in modes:
        split = rng.uniform(0.4, 0.6)
        out.append((np.clip(center - gap, 0.02, 0.98), q * 0.85, amp * split))
        out.append((np.clip(center + gap, 0.02, 0.98), q * 0.85, amp * (1.0 - split)))
    return out


def _apply_scf(fn: np.ndarray, y: np.ndarray, rng: random.Random) -> np.ndarray:
    """Short-circuit: strong mid/high attenuation + localized impedance spike."""
    severity = rng.uniform(0.35, 1.0)
    r_sc = rng.uniform(0.08, 0.45)
    notch_center = rng.uniform(0.35, 0.75)
    notch = severity * 0.9 / (1.0 + ((fn - notch_center) / 0.04) ** 2)
    hf_mask = 1.0 - severity * 0.65 * np.clip((fn - 0.45) / 0.55, 0.0, 1.0)
    y = y * hf_mask - notch
    y += severity * r_sc * np.exp(-((fn - rng.uniform(0.2, 0.5)) ** 2) / 0.008)
    return y


def _fault_for_label(label: str, rng: random.Random) -> FaultKind:
    if label == "Normal":
        return "NF"
    if label == "Minor Deviation":
        return rng.choice(["DLF", "LCF"])
    if label == "Moderate Fault":
        return rng.choice(["RDF", "IDF"])
    return "SCF"


def synthesize_fra_magnitude(length: int, label: str, seed: int | None = None) -> np.ndarray:
    """Generate one physics-style magnitude vector for the given IntelliFRA label."""
    rng = random.Random(seed)
    fn, _hz = sfra_frequency_grid(length)
    n_disks = rng.randint(8, 12)
    modes = _disk_modes(rng, n_disks=n_disks)
    fault = _fault_for_label(label, rng)

    if fault == "NF":
        modes = _apply_nf(modes, rng)
    elif fault in ("DLF", "LCF"):
        modes = _apply_dlf_lcf(modes, rng)
    elif fault == "RDF":
        modes = _apply_rdf(modes, rng)
    elif fault == "IDF":
        modes = _apply_idf(modes, rng)

    y = _combine_modes(fn, modes)

    # Winding capacitive roll-off (high-frequency decay of |H|).
    alpha = rng.uniform(0.35, 0.95)
    y *= np.exp(-alpha * fn)

    if fault == "SCF":
        y = _apply_scf(fn, y, rng)

    # Instrument noise (repeatability band).
    noise_std = rng.uniform(0.002, 0.025) if label == "Normal" else rng.uniform(0.01, 0.06)
    y += np.random.default_rng(seed).normal(0, noise_std, size=length)

    # Map to project magnitude scale and enforce physical bounds.
    y = y - np.min(y)
    peak = max(float(np.max(y)), 1e-6)
    target_peak = rng.uniform(14.0, 26.0)
    y = y * (target_peak / peak)

    if label == "Normal":
        for i in range(1, length):
            y[i] = min(y[i], y[i - 1] + rng.uniform(0.0, 0.02))

    return np.clip(y, 0.0, 30.0).astype(np.float64)
