"""
Substation Diagnostic Copilot & LLM Assistant Engine
=====================================================
Standards-Primed Engineering Assistant for Transformer Asset Management:
  - IEEE Std C57.149-2012 (FRA Interpretation)
  - IS 2026 (Part 1-5) (Indian Standard for Power Transformers)
  - IS 10593 / IEC 60599 (DGA Interpretation in Mineral Oil)
  - Central Electricity Authority (CEA) Technical Standards
  - CBIP Publication 325 (Manual on Transformers)
  - IEC 60270 (Partial Discharge Measurements)
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional


# -----------------------------------------------------------------------------
# 1. Comprehensive Substation Knowledge Base & Expert Reasoning Engine
# -----------------------------------------------------------------------------

KNOWLEDGE_TOPICS = {
    "ccf_drop": {
        "keywords": ["ccf", "cross correlation", "drop", "below 0.95", "correlation", "mid-frequency", "mid band"],
        "title": "IEEE C57.149 & IS 2026 Cross-Correlation Factor (CCF) Interpretation",
        "content": (
            "Per **IEEE Std C57.149-2012** and **IS 2026**, the Cross-Correlation Factor ($R_{xy}$) assesses transfer function pole stability:\n\n"
            "- **CCF $\\ge 0.98$ (Healthy)**: Normal structural condition. Resonance poles match baseline within measurement tolerances.\n"
            "- **$0.95 \\le$ CCF $< 0.98$ (Investigate)**: Minor winding displacement, slight localized axial compression, or tap-changer lead alteration.\n"
            "- **CCF $< 0.95$ (Action Required / Critical)**: Significant physical alteration. In the **Medium Frequency Band (2 kHz – 100 kHz)**, this strongly indicates **radial winding deformation (hoop buckling)** or **axial winding collapse** caused by through-fault electromagnetic forces ($I^2R$ and $F \\propto I_{sc}^2$).\n\n"
            "**Recommended Action**: Immediately restrict loading to 70% MVA, perform offline DGA gas ratio checks, and check recent grid line fault logs."
        ),
        "standards": ["IEEE Std C57.149-2012 Sec 7.3", "IS 2026-1", "DL/T 911-2016"],
    },
    "bad_grounding": {
        "keywords": ["ground", "grounding", "rusted", "earthing", "monsoon", "test lead", "high frequency", "> 1 mhz", "noise"],
        "title": "Monsoon Earthing & High-Frequency Noise Filter (IEEE C57.149 Sec 7.2)",
        "content": (
            "During Indian monsoons or in aging switchyards, rusted grounding flats and poor instrument lead connections are the #1 source of false alarms:\n\n"
            "1. **Signature of Bad Grounding**: A uniform, upward or downward dB shift occurring **EXCLUSIVELY above 1 MHz**, while low (< 2 kHz) and mid (2 kHz – 100 kHz) frequency bands remain perfectly identical to baseline ($CCF \\ge 0.98$).\n"
            "2. **Physical Explanation**: Frequencies above 1 MHz are dominated by the stray inductance and capacitance of the test leads and tank earthing loop ($L_{lead} \\approx 1\\,\\mu\\text{H/m}$). Physical transformer windings have too much series inductance to show isolated shifts at UHF without mid-band disruption.\n"
            "3. **Resolution**: Inspect the substation earth flat, grind off copper oxide/rust, ensure braid length is under 0.5 m, clean the bushing test-tap surfaces with isopropyl alcohol, and repeat the sweep before taking the unit offline."
        ),
        "standards": ["IEEE Std C57.149-2012 Sec 7.2.1", "CEA Substation Guidelines 2020", "CBIP Manual 325"],
    },
    "dga_limits": {
        "keywords": ["dga", "is 10593", "acetylene", "ethylene", "c2h2", "c2h4", "gas", "ppm", "dissolved gas"],
        "title": "IS 10593 / IEC 60599 Dissolved Gas Analysis Limits (EHV Transformers)",
        "content": (
            "Under Indian Standard **IS 10593:2006** (equivalent to IEC 60599), dissolved gas limits for transformers $> 100\\text{ MVA}$ / $> 220\\text{ kV}$ are:\n\n"
            "- **Acetylene ($C_2H_2$)**: Limit is **2 ppm**. Any concentration $\\ge 2\\text{ ppm}$ indicates active high-energy electric arcing or catastrophic flashover. Immediate outage required!\n"
            "- **Ethylene ($C_2H_4$)**: Limit is **50 ppm**. Concentrations $> 50\\text{ ppm}$ indicate severe thermal oil cracking ($T > 700^\\circ\\text{C}$), typical of through-fault current overheating.\n"
            "- **Methane ($CH_4$)**: Limit is **120 ppm** (sparking / moderate thermal faulting $300 - 700^\\circ\\text{C}$).\n"
            "- **Hydrogen ($H_2$)**: Limit is **100 ppm** (partial discharge or electrolysis).\n"
            "- **$CO_2 / CO$ Ratio**: Normal between 3 and 10. A ratio $< 3$ indicates severe cellulose paper insulation overheating and degradation."
        ),
        "standards": ["IS 10593:2006 Table 1", "IEC 60599:2022", "IEEE C57.104-2019"],
    },
    "through_fault": {
        "keywords": ["through fault", "through-fault", "short circuit", "line fault", "fault stress", "overhead line"],
        "title": "CEA Guidelines on Transformer Through-Fault Mechanical Stress",
        "content": (
            "In the Indian power grid, transformers connected to overhead transmission lines endure severe through-faults during monsoons and thunderstorms:\n\n"
            "- **Electromagnetic Forces**: Radial forces proportional to $I_{fault}^2$ attempt to burst the outer HV winding and crush the inner LV winding toward the core.\n"
            "- **Multi-Modal Rule**: If an SFRA sweep shows **Mid-Band CCF $< 0.95$** AND DGA reveals an active spike in **$C_2H_4 > 50\\text{ ppm}$** or **$C_2H_2 > 2\\text{ ppm}$**, this confirms that through-fault current has caused both mechanical winding displacement and thermal/electrical insulation damage.\n"
            "- **CEA Mandatory Action**: Unit must be isolated from the grid for internal endoscope inspection and short-circuit impedance ($Z_k$) measurement per IS 2026-1."
        ),
        "standards": ["CEA Technical Standards for Substation Maintenance 2020", "IS 2026 Part 1", "CIGRE WG A2.26"],
    },
    "subbands": {
        "keywords": ["band", "subband", "sub-band", "three band", "low frequency", "high frequency", "core", "leads"],
        "title": "IEEE C57.149 3-Band Frequency Zoning Framework",
        "content": (
            "The standard SFRA frequency spectrum (20 Hz to 2 MHz) is segregated into three functional physical zones:\n\n"
            "1. **Low Frequency Band (< 2 kHz) — Core & Inductance Zone**:\n"
            "   - Dominated by core magnetizing inductance ($L_m$) and magnetic circuit.\n"
            "   - Detects: Core laminations shift, residual magnetization, core grounding rupture, or open circuits.\n"
            "2. **Medium Frequency Band (2 kHz to 100 kHz) — Winding Interaction Zone**:\n"
            "   - Dominated by series inter-disk capacitance ($C_s$) and winding leakage inductance ($L_s$).\n"
            "   - Detects: Radial hoop buckling, axial winding collapse, and disk tilting.\n"
            "3. **High Frequency Band (100 kHz to 2 MHz) — Main Winding Structure & Leads**:\n"
            "   - Dominated by shunt capacitance to ground ($C_g$) and test lead inductance ($L_{lead}$).\n"
            "   - Detects: Tap changer lead movement, bushing shield defects, and test lead earthing discrepancies."
        ),
        "standards": ["IEEE Std C57.149-2012 Sec 5.2", "IEC 60076-18 Sec 6"],
    },
    "radial_vs_axial": {
        "keywords": ["radial", "axial", "deformation", "tilt", "hoop", "difference", "buckling"],
        "title": "Radial vs. Axial Winding Deformation Diagnostic Signatures",
        "content": (
            "**Radial (Hoop Buckling) Deformation**:\n"
            "- Occurs when electromagnetic radial bursting forces compress inner winding or expand outer winding.\n"
            "- Results in significant change in leakage channel geometry $\\implies$ substantial shift in mid-frequency resonant peaks (5 kHz – 60 kHz).\n"
            "- Usually lowers the dominant resonant frequency due to increased inductance.\n\n"
            "**Axial (Disk Tilting / Displacement)**:\n"
            "- Occurs when axial compressive forces crush winding spacers or tilt disks.\n"
            "- Alters inter-disk capacitance ($C_s$) $\\implies$ changes peak amplitudes and resonant pole damping rather than pure frequency shift.\n"
            "- Both conditions drop Mid-Band CCF $< 0.95$, requiring offline impedance verification."
        ),
        "standards": ["CIGRE Brochure 342", "IEEE C57.149 Sec 7.4"],
    },
}


def _find_matching_topic(query: str) -> Optional[Dict[str, Any]]:
    q = query.lower()
    best_match = None
    max_score = 0
    for key, data in KNOWLEDGE_TOPICS.items():
        score = sum(1 for kw in data["keywords"] if kw in q)
        if score > max_score:
            max_score = score
            best_match = data
    return best_match if max_score > 0 else None


def generate_expert_response(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Generates an authoritative, standard-compliant response for transformer engineers.
    Supports contextual asset reasoning if telemetry data is passed.
    """
    q = message.strip()
    q_lower = q.lower()

    # 1. Contextual Transformer Inspection (if engineer asks about currently active asset)
    is_context_query = any(k in q_lower for k in ["this transformer", "this asset", "current asset", "the result", "diagnose this", "explain this status", "active unit"])
    if is_context_query and context:
        asset_id = context.get("asset_id") or context.get("asset_tag") or "Monitored Unit"
        status = context.get("status") or context.get("Asset_Health_Status") or "Under Evaluation"
        justification = context.get("justification") or context.get("Technical_Justification") or ""
        action = context.get("action") or context.get("Recommended_Action") or ""
        subbands = context.get("subbands") or {}
        dga = context.get("dga") or {}

        reply = (
            f"### Substation Engineering Telemetry Assessment for **{asset_id}**\n\n"
            f"- **Health Status**: **`{status.upper()}`**\n"
            f"- **CEA Technical Justification**: {justification}\n"
            f"- **Mandated Operational Action**: {action}\n\n"
        )

        if subbands:
            reply += "#### IEEE C57.149 Sub-Band Breakdown:\n"
            for bname, binfo in subbands.items():
                if isinstance(binfo, dict):
                    reply += f"- **{binfo.get('band_name', bname)}**: CCF = **`{binfo.get('ccf', 'N/A')}`** | Status: **{binfo.get('zone_status', 'N/A')}**\n"

        if dga:
            reply += "\n#### IS 10593 Key Gas Telemetry:\n"
            reply += f"- Ethylene ($C_2H_4$): `{dga.get('C2H4', 'N/A')} ppm` (Limit: 50 ppm)\n"
            reply += f"- Acetylene ($C_2H_2$): `{dga.get('C2H2', 'N/A')} ppm` (Limit: 2 ppm)\n"
            reply += f"- Hydrogen ($H_2$): `{dga.get('H2', 'N/A')} ppm` (Limit: 100 ppm)\n"

        followups = [
            f"What specific internal tests should be run on {asset_id}?",
            "How to compute the Rogers Gas Ratios for this asset?",
            "Is it safe to keep this unit energized at partial MVA?",
        ]
        return {
            "reply": reply,
            "suggested_followups": followups,
            "references": ["IS 2026 Part 1", "IS 10593:2006", "IEEE Std C57.149-2012"],
        }

    # 2. Topic Matching from Knowledge Base
    topic = _find_matching_topic(q)
    if topic:
        reply = f"### {topic['title']}\n\n{topic['content']}\n\n**Key Standard References:**\n"
        for ref in topic["standards"]:
            reply += f"- `{ref}`\n"
        
        followups = [
            "How does CEA mandate transformer isolation after short circuits?",
            "What is the physical meaning of DL/T 911 factor K?",
            "How to prepare Doble M5400 test leads to avoid high-frequency noise?",
        ]
        return {
            "reply": reply,
            "suggested_followups": followups,
            "references": topic["standards"],
        }

    # 3. General Intelligent Substation Diagnostic Synthesis
    reply = (
        f"### IntelliFRA Diagnostic Copilot Response\n\n"
        f"Regarding your query on: *\"{q}\"*\n\n"
        "In power transformer condition assessment per **CEA**, **IS 2026**, and **IEEE C57.149**:\n\n"
        "1. **SFRA (Sweep Frequency Response Analysis)** is the primary non-invasive fingerprint for mechanical integrity. Deviations in the 2 kHz – 100 kHz range reflect inter-disk winding geometry alteration.\n"
        "2. **DGA (Dissolved Gas Analysis)** under **IS 10593** evaluates chemical insulation breakdown. Elevated $C_2H_4$ (> 50 ppm) or $C_2H_2$ (> 2 ppm) signifies thermal oil overheating or internal electrical arcing.\n"
        "3. **Noise Discrimination**: Ensure high-frequency deviations (> 1 MHz) are verified against earthing flat continuity before attributing them to mechanical failure.\n\n"
        "Please select one of the suggested engineering inquiries below or provide specific test readings (CCF, $C_2H_4$ ppm, $C_2H_2$ ppm) for immediate assessment."
    )
    followups = [
        "Why did mid-frequency CCF drop below 0.95?",
        "How to distinguish bad earthing from real winding deformation?",
        "What are the IS 10593 DGA limits for 400 kV transformers?",
        "Explain the IEEE C57.149 3-band zoning framework.",
    ]
    return {
        "reply": reply,
        "suggested_followups": followups,
        "references": ["IEEE Std C57.149-2012", "IS 10593:2006", "IS 2026 Part 1-5", "CEA Guidelines"],
    }
