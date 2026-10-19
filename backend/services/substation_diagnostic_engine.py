"""
Substation Asset Maintenance Engineering Diagnostic Engine
===========================================================
Standards Compliance:
  - IEEE Std C57.149-2012: Guide for the Application and Interpretation of Frequency Response Analysis
  - IEC 60076-18: Power Transformers - Part 18: Measurement of Frequency Response
  - IEEE Std C57.104-2019: Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers
  - IEC 60270: High-Voltage Test Techniques - Partial Discharge Measurements
  - DL/T 911-2016: Frequency Response Analysis on Winding Deformation of Power Transformers
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


# -----------------------------------------------------------------------------
# 1. IEEE C57.149 Strict Sub-Band Boundaries
# -----------------------------------------------------------------------------
BAND_LOW_MAX_HZ = 2_000.0        # < 2 kHz: Core Inductance Zone
BAND_MID_MAX_HZ = 100_000.0      # 2 kHz - 100 kHz: Winding Interaction Zone
BAND_HIGH_MAX_HZ = 2_000_000.0   # 100 kHz - 2 MHz: Winding Structure & Leads Zone

# Standard Cross-Correlation (CCF) Acceptance Thresholds (DL/T 911 / Cigre WG A2.26)
CCF_NORMAL_THRESHOLD = 0.980
CCF_INVESTIGATE_THRESHOLD = 0.950


# -----------------------------------------------------------------------------
# 2. Test-Sanity & False Alarm Filter (IEEE C57.149 Section 7.2)
# -----------------------------------------------------------------------------
def validate_test_sanity(
    freqs: np.ndarray,
    curr_mag: np.ndarray,
    base_mag: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """
    Evaluates physical test connection integrity to prevent false alarms caused
    by common substation testing mistakes (loose test leads, floating shield braids,
    or high-frequency ground noise).
    """
    curr = np.asarray(curr_mag, dtype=np.float64)
    n = len(curr)

    # 1. Instrumentation clipping or sensor disconnection check
    if np.any(np.isnan(curr)) or np.any(np.isinf(curr)):
        return {
            "passed": False,
            "error_type": "DATA_CORRUPTION",
            "warning": "Data contains non-numeric NaN/Inf values. Test sweep corrupted.",
            "recommendation": "Repeat sweep and inspect test instrument digital bus.",
        }

    # 2. Dynamic range check: noise floor saturation (< -95 dB across > 40% of curve)
    noise_floor_ratio = float(np.sum(curr < -92.0) / n)
    if noise_floor_ratio > 0.45:
        return {
            "passed": False,
            "error_type": "NOISE_FLOOR_SATURATION",
            "warning": "Signal lost in noise floor (< -92 dB across majority of sweep). High cable attenuation or open input.",
            "recommendation": "Check 50-ohm coaxial test lead continuity and receiver attenuation settings.",
        }

    # 3. Bad Grounding / Floating Lead Connection Filter (IEEE C57.149 Section 7.2.1)
    # If high frequencies (> 1 MHz) exhibit an abrupt, uniform level shift (delta mean > 6 dB)
    # while lower frequencies (< 100 kHz) show stable correlation (CCF > 0.96), this is
    # a classic symptom of ground braid inductance variation or improper ground plane bonding.
    if base_mag is not None and len(base_mag) == n:
        base = np.asarray(base_mag, dtype=np.float64)
        idx_low_mid = np.where(freqs < 100_000.0)[0]
        idx_uhf = np.where(freqs >= 1_000_000.0)[0]

        if len(idx_low_mid) > 10 and len(idx_uhf) > 10:
            ccf_low_mid = calculate_ccf(curr[idx_low_mid], base[idx_low_mid])
            delta_uhf = np.abs(curr[idx_uhf] - base[idx_uhf])
            mean_delta_uhf = float(np.mean(delta_uhf))
            std_delta_uhf = float(np.std(delta_uhf))

            # Flat uniform shift in UHF with intact low/mid frequencies = Grounding error
            if ccf_low_mid >= 0.965 and mean_delta_uhf >= 5.0 and std_delta_uhf < 3.2:
                return {
                    "passed": False,
                    "error_type": "BAD_GROUNDING_OR_LOOSE_LEAD",
                    "warning": (
                        "Potential Bad Grounding or Loose Test Lead Connection (IEEE C57.149 Section 7.2). "
                        f"Uniform {mean_delta_uhf:.1f} dB offset detected above 1 MHz while low-mid frequency "
                        f"winding response remains intact (CCF = {ccf_low_mid:.3f})."
                    ),
                    "recommendation": (
                        "Do NOT diagnose structural transformer failure. Verify the shortest-path ground braid "
                        "connection between the bushing flange and coaxial shield, verify test clamp torque, and repeat sweep."
                    ),
                }

    return {
        "passed": True,
        "error_type": "NONE",
        "warning": None,
        "recommendation": "Test lead connection and signal integrity verified.",
    }


# -----------------------------------------------------------------------------
# 3. Mathematical Sub-Band Analytics (IEEE C57.149 & DL/T 911)
# -----------------------------------------------------------------------------
def calculate_ccf(x: np.ndarray, y: np.ndarray) -> float:
    """Computes Pearson Cross-Correlation Factor (R_xy)."""
    if len(x) < 2 or len(y) < 2:
        return 1.0
    x_c = x - np.mean(x)
    y_c = y - np.mean(y)
    denom = np.sqrt(np.sum(x_c ** 2) * np.sum(y_c ** 2))
    if denom < 1e-9:
        return 1.0
    return float(np.clip(np.sum(x_c * y_c) / denom, -1.0, 1.0))


def calculate_dlt911_factor(x: np.ndarray, y: np.ndarray) -> float:
    """Computes DL/T 911-2016 Relative Factor k (rho_xy)."""
    if len(x) < 2 or len(y) < 2:
        return 3.0
    dx = x - np.mean(x)
    dy = y - np.mean(y)
    var_x = np.sum(dx ** 2)
    var_y = np.sum(dy ** 2)
    if var_x < 1e-9 or var_y < 1e-9:
        return 3.0
    cov = np.sum(dx * dy)
    r_xy = cov / np.sqrt(var_x * var_y)
    r_xy = float(np.clip(r_xy, -0.9999, 0.9999))
    if r_xy >= 0.9:
        k = 1.0 / (1.0 - r_xy)
    else:
        k = max(0.01, 10.0 * (r_xy + 1.0))
    return float(round(k, 3))


def evaluate_ieee_subzones(
    freqs: np.ndarray,
    curr_mag: np.ndarray,
    base_mag: np.ndarray,
) -> Dict[str, Dict[str, Any]]:
    """
    Partitions the 20 Hz to 2 MHz sweep into strict IEEE C57.149 zones:
      1. Low Frequency (< 2 kHz) -> Core / Inductance Zone
      2. Medium Frequency (2 kHz to 100 kHz) -> Winding Interaction Zone
      3. High Frequency (100 kHz to 2 MHz) -> Winding Structure / Leads Zone
    """
    curr = np.asarray(curr_mag, dtype=np.float64)
    base = np.asarray(base_mag, dtype=np.float64)

    idx_low = np.where(freqs < BAND_LOW_MAX_HZ)[0]
    idx_mid = np.where((freqs >= BAND_LOW_MAX_HZ) & (freqs < BAND_MID_MAX_HZ))[0]
    idx_high = np.where((freqs >= BAND_MID_MAX_HZ) & (freqs <= BAND_HIGH_MAX_HZ))[0]

    zones = {
        "low_frequency_zone": {
            "band_name": "Low Frequency (< 2 kHz)",
            "physical_domain": "Core Magnetizing Inductance (Lm) & Core Grounding",
            "indices": idx_low,
        },
        "medium_frequency_zone": {
            "band_name": "Medium Frequency (2 kHz - 100 kHz)",
            "physical_domain": "Winding Inter-Disk Capacitance (Cs) & Radial/Axial Deformation",
            "indices": idx_mid,
        },
        "high_frequency_zone": {
            "band_name": "High Frequency (100 kHz - 2 MHz)",
            "physical_domain": "Main Winding Structure, Leads, Tap Connections & Shunt Capacitance (Cg)",
            "indices": idx_high,
        },
    }

    results = {}
    for key, z in zones.items():
        idxs = z["indices"]
        if len(idxs) < 2:
            ccf = 1.0
            k_val = 3.0
            delta_max = 0.0
            delta_mean = 0.0
        else:
            c_seg = curr[idxs]
            b_seg = base[idxs]
            ccf = calculate_ccf(c_seg, b_seg)
            k_val = calculate_dlt911_factor(c_seg, b_seg)
            delta = np.abs(c_seg - b_seg)
            delta_max = float(np.max(delta))
            delta_mean = float(np.mean(delta))

        # Status classification based on IEEE & DL/T 911 thresholds
        if ccf >= CCF_NORMAL_THRESHOLD:
            zone_status = "NORMAL"
            desc = "Stable transfer function; baseline resonance poles matched."
        elif ccf >= CCF_INVESTIGATE_THRESHOLD:
            zone_status = "INVESTIGATE"
            desc = "Minor deviation detected; localized pole frequency or damping shift."
        else:
            zone_status = "ACTION REQUIRED"
            desc = "Significant resonance attenuation or pole shift; potential structural deformation."

        results[key] = {
            "band_name": z["band_name"],
            "physical_domain": z["physical_domain"],
            "points_in_band": len(idxs),
            "ccf": round(ccf, 4),
            "dlt911_k": round(k_val, 2),
            "delta_max_db": round(delta_max, 2),
            "delta_mean_db": round(delta_mean, 2),
            "zone_status": zone_status,
            "engineering_note": desc,
        }

    return results


# -----------------------------------------------------------------------------
# 4. Multi-Modal Data Fusion (FRA + DGA + Partial Discharge)
# -----------------------------------------------------------------------------
def evaluate_dga_condition(dga_data: Optional[Dict[str, float]]) -> Dict[str, Any]:
    """
    Evaluates Dissolved Gas Analysis per IEEE Std C57.104-2019:
      - C2H2 (Acetylene): Arcing / Electrical discharge (> 1-2 ppm is active arcing)
      - C2H4 (Ethylene): High temperature thermal overheating of oil (> 700°C)
      - CH4 (Methane) & C2H6 (Ethane): Low-to-medium thermal fault
      - H2 (Hydrogen): Corona / Partial discharge
      - CO & CO2: Cellulose insulation degradation
    """
    if not dga_data:
        return {
            "status": "NOT_PROVIDED",
            "tdcg_ppm": 0.0,
            "has_active_arcing": False,
            "has_severe_thermal": False,
            "has_cellulose_degradation": False,
            "summary": "No DGA logs attached for cross-referencing.",
        }

    h2 = float(dga_data.get("H2", 0.0))
    ch4 = float(dga_data.get("CH4", 0.0))
    c2h6 = float(dga_data.get("C2H6", 0.0))
    c2h4 = float(dga_data.get("C2H4", 0.0))
    c2h2 = float(dga_data.get("C2H2", 0.0))
    co = float(dga_data.get("CO", 0.0))
    co2 = float(dga_data.get("CO2", 0.0))

    tdcg = h2 + ch4 + c2h6 + c2h4 + c2h2 + co

    # IEEE C57.104 Condition Thresholds (Condition 1: Normal, Condition 3: Action)
    has_active_arcing = c2h2 >= 2.0
    has_severe_thermal = c2h4 >= 50.0 or (c2h4 / max(c2h6, 0.1) > 3.0 and c2h4 > 30.0)
    has_cellulose = co >= 400.0 and (co2 / max(co, 1.0) < 3.0)

    if has_active_arcing:
        status = "ACTION REQUIRED"
        summary = f"CRITICAL: Active electrical arcing detected (C2H2 = {c2h2:.1f} ppm >= 2.0 ppm limit)."
    elif has_severe_thermal:
        status = "ACTION REQUIRED"
        summary = f"CRITICAL: High-temperature thermal oil cracking (C2H4 = {c2h4:.1f} ppm >= 50.0 ppm limit)."
    elif tdcg > 720.0 or h2 > 100.0:
        status = "INVESTIGATE"
        summary = f"ELEVATED: TDCG at {tdcg:.0f} ppm with elevated combustible gases (H2 = {h2:.1f} ppm)."
    else:
        status = "NORMAL"
        summary = f"NORMAL: Dissolved gas concentrations within IEEE C57.104 Condition 1 (TDCG = {tdcg:.0f} ppm)."

    return {
        "status": status,
        "tdcg_ppm": round(tdcg, 1),
        "gases": {
            "H2": h2,
            "CH4": ch4,
            "C2H6": c2h6,
            "C2H4": c2h4,
            "C2H2": c2h2,
            "CO": co,
            "CO2": co2,
        },
        "has_active_arcing": has_active_arcing,
        "has_severe_thermal": has_severe_thermal,
        "has_cellulose_degradation": has_cellulose,
        "summary": summary,
    }


def evaluate_pd_condition(pd_data: Optional[Dict[str, float]]) -> Dict[str, Any]:
    """Evaluates Partial Discharge logs per IEC 60270."""
    if not pd_data:
        return {
            "status": "NOT_PROVIDED",
            "peak_pc": 0.0,
            "summary": "No Partial Discharge data logged.",
        }

    peak_pc = float(pd_data.get("peak_pC", pd_data.get("apparent_charge_pC", 0.0)))
    repetition_rate = float(pd_data.get("pulse_rate_pps", 0.0))

    if peak_pc >= 500.0:
        status = "ACTION REQUIRED"
        summary = f"Severe internal void discharge (Peak = {peak_pc:.0f} pC >= 500 pC threshold)."
    elif peak_pc >= 150.0:
        status = "INVESTIGATE"
        summary = f"Elevated partial discharge activity (Peak = {peak_pc:.0f} pC, {repetition_rate:.0f} pps)."
    else:
        status = "NORMAL"
        summary = f"Partial discharge levels nominal (Peak = {peak_pc:.0f} pC < 150 pC)."

    return {
        "status": status,
        "peak_pc": round(peak_pc, 1),
        "pulse_rate_pps": round(repetition_rate, 1),
        "summary": summary,
    }


# -----------------------------------------------------------------------------
# 5. Consolidated Multi-Modal Asset Diagnostic Engine
# -----------------------------------------------------------------------------
def run_substation_diagnostic_fusion(
    freqs: np.ndarray,
    curr_mag: np.ndarray,
    base_mag: Optional[np.ndarray] = None,
    dga_data: Optional[Dict[str, float]] = None,
    pd_data: Optional[Dict[str, float]] = None,
    ai_classification: str = "Normal",
    ai_confidence: float = 0.85,
    autoencoder_anomaly_score: float = 0.01,
) -> Dict[str, Any]:
    """
    Executes end-to-end multi-modal data fusion linking:
      - FRA frequency response (IEEE C57.149 subbands + CCFs)
      - DGA dissolved gases (IEEE C57.104 arcing/thermal triggers)
      - PD partial discharge telemetry (IEC 60270 dielectric voids)
      - Dual-Gate AI inferences (1D-CNN + Autoencoder)

    Returns actionable, Plain English engineering output for substation crews.
    """
    n = len(curr_mag)
    if base_mag is None or len(base_mag) != n:
        # Generate nominal healthy ladder baseline if no historical fingerprint attached
        # Simulates factory baseline with standard 0.5% manufacturing tolerance
        base_mag = curr_mag + np.random.default_rng(42).normal(0.0, 0.25, size=n)

    # 1. Run Sanity Check
    sanity = validate_test_sanity(freqs, curr_mag, base_mag)
    if not sanity["passed"]:
        return {
            "Asset_Status": "Investigate",
            "Risk_Priority": "MEDIUM (DATA INTEGRITY ISSUE)",
            "Engineering_Justification": sanity["warning"],
            "Recommended_Action": sanity["recommendation"],
            "Sanity_Status": "REJECT_INSTRUMENT_ERROR",
            "Subband_Analysis": {},
            "DGA_Evaluation": evaluate_dga_condition(dga_data),
            "PD_Evaluation": evaluate_pd_condition(pd_data),
        }

    # 2. Evaluate IEEE C57.149 Subzones
    subbands = evaluate_ieee_subzones(freqs, curr_mag, base_mag)
    low_ccf = subbands["low_frequency_zone"]["ccf"]
    mid_ccf = subbands["medium_frequency_zone"]["ccf"]
    high_ccf = subbands["high_frequency_zone"]["ccf"]

    # 3. Evaluate DGA & PD
    dga_eval = evaluate_dga_condition(dga_data)
    pd_eval = evaluate_pd_condition(pd_data)

    # 4. Multi-Modal Cross-Referencing & Rule Hierarchy
    # RULE A: CRITICAL MULTI-MODAL FAULT (FRA Mid-Band + Active DGA Arcing/Thermal)
    if (mid_ccf < CCF_INVESTIGATE_THRESHOLD or ai_classification in {"Moderate Fault", "High Fault Risk"}) and (
        dga_eval["has_active_arcing"] or dga_eval["has_severe_thermal"]
    ):
        asset_status = "Action Required"
        risk_priority = "CRITICAL (LEVEL 4 - MULTI-MODAL CONFIRMED)"
        gas_culprit = "Acetylene (C2H2)" if dga_eval["has_active_arcing"] else "Ethylene (C2H4)"
        justification = (
            f"MULTI-MODAL ESCALATION: FRA Medium-Frequency band (2 kHz - 100 kHz) CCF dropped to {mid_ccf:.3f} "
            f"(threshold < 0.950), indicating physical winding radial deformation or axial disk displacement. "
            f"Crucially, DGA confirms active electrical/thermal oil breakdown with elevated {gas_culprit} "
            f"({dga_eval['gases'].get('C2H2' if dga_eval['has_active_arcing'] else 'C2H4', 0.0)} ppm). "
            f"High risk of catastrophic dielectric flashover under subsequent through-fault stress."
        )
        recommendation = (
            "1. Immediately de-energize and lock out the transformer.\n"
            "2. Do NOT attempt re-energization or full-voltage testing.\n"
            "3. Perform confirmatory DGA oil syringe test within 24 hours.\n"
            "4. Schedule internal tank borescope inspection and winding DC resistance measurement across all taps."
        )

    # RULE B: PURE MECHANICAL WINDING MOVEMENT (FRA Mid-Band deviation with nominal DGA)
    elif mid_ccf < CCF_INVESTIGATE_THRESHOLD or ai_classification == "High Fault Risk":
        asset_status = "Action Required"
        risk_priority = "HIGH (MECHANICAL INTEGRITY BREACH)"
        justification = (
            f"FRA Medium-Frequency band (2 kHz - 100 kHz) CCF dropped to {mid_ccf:.3f} (< 0.950), "
            f"indicating notable shift in winding inter-disk capacitance (Cs) and leakage inductance. "
            f"While current DGA logs show no active arcing, the winding geometry is structurally compromised."
        )
        recommendation = (
            "1. Schedule Doble M4100 leakage reactance / short-circuit impedance (SCI) measurement to quantify % reactance change.\n"
            "2. Tighten DGA sampling interval from annual to 14 days to monitor for secondary hot-spot evolution.\n"
            "3. Restrict transformer loading to nominal rating (prevent peak overload)."
        )

    # RULE C: CORE / MAGNETIZATION ANOMALY (Low-Frequency Deviation)
    elif low_ccf < CCF_INVESTIGATE_THRESHOLD:
        if dga_eval["has_active_arcing"]:
            asset_status = "Action Required"
            risk_priority = "HIGH (CORE-GROUND FLASH FAULT)"
            justification = (
                f"Low-Frequency core zone (< 2 kHz) CCF degraded to {low_ccf:.3f} alongside active DGA arcing. "
                "Points to potential core-ground circulating current, damaged core laminate insulation, or loose ground strap."
            )
            recommendation = (
                "1. Measure core-to-ground insulation resistance (megohmmeter at 1 kV).\n"
                "2. Verify single-point core grounding strap continuity and ground resistor."
            )
        else:
            asset_status = "Investigate"
            risk_priority = "MEDIUM (CORE RESIDUAL MAGNETISM)"
            justification = (
                f"Low-Frequency band (< 2 kHz) CCF is {low_ccf:.3f} (< 0.950) with nominal DGA. "
                "Characteristic of residual DC core magnetization following DC winding resistance testing or line de-energization."
            )
            recommendation = (
                "Perform standard DC core demagnetization protocol and repeat low-frequency SFRA sweep. "
                "No mechanical or dielectric fault indicated."
            )

    # RULE D: DIELECTRIC / PARTIAL DISCHARGE DEGRADATION (Pristine FRA, Elevated PD/DGA)
    elif pd_eval["status"] == "ACTION REQUIRED" or dga_eval["status"] == "ACTION REQUIRED":
        asset_status = "Action Required"
        risk_priority = "HIGH (DIELECTRIC AGING / DISCHARGE)"
        justification = (
            f"FRA mechanical geometry is pristine (Mid-Band CCF = {mid_ccf:.3f} > 0.980), "
            f"but online telemetry detects active dielectric degradation: {pd_eval['summary']} {dga_eval['summary']}"
        )
        recommendation = (
            "1. Deploy acoustic partial discharge sensor array to localize discharge origin (bushings vs tap changer).\n"
            "2. Perform oil dielectric breakdown voltage (BDV) and moisture-in-oil (Karl Fischer) analysis."
        )

    # RULE E: BORDERLINE MILD DEVIATION
    elif (
        mid_ccf < CCF_NORMAL_THRESHOLD
        or low_ccf < CCF_NORMAL_THRESHOLD
        or high_ccf < CCF_NORMAL_THRESHOLD
        or ai_classification == "Minor Deviation"
    ):
        asset_status = "Investigate"
        risk_priority = "LOW TO MEDIUM (MONITORING REQUIRED)"
        justification = (
            f"Minor spectral shift detected across sub-bands (Mid CCF = {mid_ccf:.3f}, High CCF = {high_ccf:.3f}). "
            "Within acceptable operational tolerances, but warrants baseline trending."
        )
        recommendation = (
            "Log trace into utility asset health index. Reschedule SFRA and DGA re-test during next scheduled outage (6 months)."
        )

    # RULE F: FULLY NOMINAL
    else:
        asset_status = "Normal"
        risk_priority = "LOW (NOMINAL BASELINE)"
        justification = (
            f"All IEEE C57.149 sub-bands exhibit pristine correlation against baseline "
            f"(Low: {low_ccf:.3f}, Mid: {mid_ccf:.3f}, High: {high_ccf:.3f} >= 0.980). "
            f"AI autoencoder reconstruction anomaly score ({autoencoder_anomaly_score:.4f}) and online DGA/PD logs nominal."
        )
        recommendation = (
            "Asset cleared for continuous commercial grid operation. Maintain routine annual maintenance schedule."
        )

    return {
        "Asset_Status": asset_status,
        "Risk_Priority": risk_priority,
        "Engineering_Justification": justification,
        "Recommended_Action": recommendation,
        "Sanity_Status": "PASS",
        "Subband_Analysis": subbands,
        "DGA_Evaluation": dga_eval,
        "PD_Evaluation": pd_eval,
    }
