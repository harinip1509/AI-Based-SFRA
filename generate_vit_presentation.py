#!/usr/bin/env python3
"""
IntelliFRA: Generate VIT B.Tech Final Year Project Presentation
Populates VIT_BTech_Project_Presentation_Template.pptx with complete, authentic
project data, high-resolution figures, architecture diagrams, benchmark tables,
publications, and references.
"""

from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE


def update_presentation(template_path: Path, media_dir: Path, output_path: Path):
    prs = Presentation(str(template_path))
    print(f"Loaded template from {template_path}. Total slides: {len(prs.slides)}")

    # -------------------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------------------
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.name == "Text 1" and shape.has_text_frame and "Title of the Project" in shape.text_frame.text:
            shape.text_frame.text = "IntelliFRA: An AI-Based Platform for Automated Transformer Fault Analysis"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Cambria"
            p.font.size = Pt(28)
            p.font.bold = True
            p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        elif shape.name == "Text 2" and shape.has_text_frame:
            shape.text_frame.text = "B.Tech. Final Year Project Presentation  |  Academic Year 2024–25"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(12)
        elif shape.name == "Text 3" and shape.has_text_frame:
            shape.text_frame.text = "Stage: Final Review / Project Defense"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(12)
        elif shape.name == "Text 5" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            team = [
                "Harini Panigrahi",
                "Neha Verma",
                "Prapti Bhayde",
                "Yooraj Gole"
            ]
            for idx, member in enumerate(team):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = member
                p.font.name = "Calibri"
                p.font.size = Pt(13)
                p.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        elif shape.name == "Text 7" and shape.has_text_frame:
            shape.text_frame.text = "Prof. Bhanu Tekwani"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(15)
            p.font.bold = True
            p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        elif shape.name == "Text 8" and shape.has_text_frame:
            shape.text_frame.text = "Vidyalankar Institute of Technology, Wadala, Mumbai"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(12)

    # -------------------------------------------------------------------------
    # SLIDE 4: Introduction
    # -------------------------------------------------------------------------
    s4 = prs.slides[3]
    for shape in s4.shapes:
        if shape.name == "Text 1" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            points = [
                ("Critical Grid Infrastructure: ", "High-voltage power transformers are irreplaceable grid nodes; unexpected internal mechanical failures cause prolonged outages and multimillion-dollar losses."),
                ("Sweep Frequency Response Analysis (SFRA): ", "Standardized under IEC 60076-18 as the premier non-intrusive electrical test for detecting internal core/winding mechanical deformation."),
                ("Operational Bottleneck: ", "Field engineers currently rely on manual visual trace overlays and scalar indices (CC, ASLE) that cannot reliably distinguish operational noise from real structural damage."),
                ("IntelliFRA Solution: ", "An open-source AI platform integrating 1D-CNN severity classification, Autoencoder anomaly gating, and interactive web visualization for real-time substation triage.")
            ]
            for idx, (lead, body) in enumerate(points):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.space_after = Pt(8)
                r_lead = p.add_run()
                r_lead.text = lead
                r_lead.font.name = "Calibri"
                r_lead.font.size = Pt(13)
                r_lead.font.bold = True
                r_lead.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

                r_body = p.add_run()
                r_body.text = body
                r_body.font.name = "Calibri"
                r_body.font.size = Pt(12.5)
                r_body.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        elif shape.name == "Text 2" and shape.has_text_frame:
            shape.text_frame.text = "Fig. 1: IntelliFRA Interactive Web Diagnostic View (500-pt Recharts trace & CEA recommendations)"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(9.5)
            p.font.italic = True
        elif shape.shape_type == 13: # Picture
            # Replace placeholder image with image4.png (Diagnostic Result View)
            img_path = media_dir / "image4.png"
            if img_path.exists():
                left, top, width, height = shape.left, shape.top, shape.width, shape.height
                # Remove placeholder picture element
                sp = shape._element
                sp.getparent().remove(sp)
                s4.shapes.add_picture(str(img_path), left, top, width, height)

    # -------------------------------------------------------------------------
    # SLIDE 5: Problem Statement & Motivation
    # -------------------------------------------------------------------------
    s5 = prs.slides[4]
    for shape in s5.shapes:
        if shape.name == "Text 4" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = (
                "To design, develop, and benchmark an automated, end-to-end AI diagnostic platform capable of ingesting raw "
                "SFRA magnitude files (CSV/TXT), standardizing variable frequency samples, classifying winding mechanical faults into "
                "four severity grades with high accuracy, and detecting out-of-distribution anomalous signatures without requiring "
                "historical baseline curves—all executing with sub-millisecond CPU latency across an authenticated web application."
            )
            p.font.name = "Calibri"
            p.font.size = Pt(13)
            p.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        elif shape.name == "Text 6" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            mot_points = [
                ("Grid Reliability & Financial Impact: ", "Manufacturing lead times for transmission transformers exceed 12 months. Early mechanical detection prevents catastrophic dielectric breakdown and millions in equipment replacement costs."),
                ("Inadequacy of Traditional Metrics: ", "Scalar indices (CC, ASLE) require manual cutoff threshold tuning per transformer family, often failing to separate operational noise from true physical faults."),
                ("Closed-Set ML Fragility: ", "Standard supervised neural networks blindly force every input into predefined training labels; unsupervised anomaly gating is critical to detect unknown winding topologies."),
                ("Operational Need: ", "Substation crews need an instant screening tool to immediately greenlight healthy units and escalate genuine fault signatures without waiting weeks for expert report overlays.")
            ]
            for idx, (lead, body) in enumerate(mot_points):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.space_after = Pt(6)
                r_lead = p.add_run()
                r_lead.text = lead
                r_lead.font.name = "Calibri"
                r_lead.font.size = Pt(12)
                r_lead.font.bold = True
                r_lead.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

                r_body = p.add_run()
                r_body.text = body
                r_body.font.name = "Calibri"
                r_body.font.size = Pt(11.5)
                r_body.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # -------------------------------------------------------------------------
    # SLIDE 6: Objectives
    # -------------------------------------------------------------------------
    s6 = prs.slides[5]
    obj_dict = {
        "Text 4": "To simulate and generate a physics-informed synthetic dataset of 50,000 SFRA curves across six degradation archetypes (NF, DLF, LCF, RDF, IDF, SCF) on a logarithmic frequency grid (1 kHz–2 MHz).",
        "Text 8": "To design and train a dual-AI diagnostic pipeline: a 140,644-parameter 1D-CNN for severity classification and a 312,532-parameter dense Autoencoder for unsupervised out-of-distribution anomaly gating.",
        "Text 12": "To implement multi-tiered fail-safe guardrails: incorporating discrete first-difference morphological filters (smoothness, monotonicity, peak counts) and deterministic FFT spectral fallbacks.",
        "Text 16": "To deploy an auditable, authenticated web platform (FastAPI + React 19 + SQLite) providing sub-millisecond CPU execution, interactive Recharts visualization, and tenant data isolation."
    }
    for shape in s6.shapes:
        if shape.name in obj_dict and shape.has_text_frame:
            shape.text_frame.text = obj_dict[shape.name]
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(12.5)
            p.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # -------------------------------------------------------------------------
    # SLIDE 7: Literature Survey Table
    # -------------------------------------------------------------------------
    s7 = prs.slides[6]
    for shape in s7.shapes:
        if shape.has_table:
            table = shape.table
            lit_rows = [
                ["1", "Ryder (2003) [1]", "SFRA principles & scalar indicators (CC, ASLE)", "Field utility transformer sweeps", "Establishes baseline transfer-function mapping", "Sensitive to test-lead noise; requires subjective human thresholds"],
                ["2", "Shintemirov et al. (2010) [3]", "Sub-band correlation & evidential reasoning", "Lab winding models & simulation", "Improved condition grading across discrete sub-bands", "Fails on compound multi-mode deformations; rigid sub-band boundaries"],
                ["3", "Secue & Mombello (2008) [11]", "Resonance pole tracking & band deviation", "Physical test transformers", "Classified axial vs. radial winding deformations", "Requires historical baseline from the identical physical unit"],
                ["4", "Ince, Kiranyaz et al. (2016) [15]", "1D-CNN on raw waveforms without manual features", "Motor current benchmark waveforms", "Adaptive localized spectral feature learning from raw data", "Evaluated solely on motor drives; not applied to transformer SFRA"],
                ["5", "Phillip, Singh & Ramlal (2025) [6, 10]", "Deep learning for narrow-band transformer FRA", "Simulated & narrow-band field data", "High classification accuracy on isolated frequency bands", "Closed-set only; lacks anomaly gating, web interface & fail-safes"]
            ]
            for r_idx, r_data in enumerate(lit_rows):
                for c_idx, val in enumerate(r_data):
                    cell = table.cell(r_idx + 1, c_idx)
                    cell.text = val
                    p = cell.text_frame.paragraphs[0]
                    p.font.name = "Calibri"
                    p.font.size = Pt(9.5 if c_idx != 0 else 10)
                    if c_idx == 1:
                        p.font.bold = True

    # -------------------------------------------------------------------------
    # SLIDE 8: Research Gaps Identified
    # -------------------------------------------------------------------------
    s8 = prs.slides[7]
    gaps_map = {
        "Text 4": "Closed-Set Classifier Fragility",
        "Text 5": "Supervised models force all inputs into predefined training categories, blindly misclassifying unfamiliar winding topologies, sensor noise, or unmodeled failure modes as normal or wrong fault grades.",
        "Text 9": "Hand-Crafted Feature Dependency",
        "Text 10": "Conventional techniques rely on rigid sub-band segmentation or scalar metrics (ASLE, CC) that require manual threshold tuning and fail to generalize across different MVA ratings and voltage classes.",
        "Text 14": "Lack of Production-Ready Systems",
        "Text 15": "Prior studies stop at offline Jupyter notebooks without building an auditable, end-to-end deployable platform with fail-safe fallbacks, sub-millisecond CPU latency, and interactive visualization for field crews."
    }
    for shape in s8.shapes:
        if shape.name in gaps_map and shape.has_text_frame:
            shape.text_frame.text = gaps_map[shape.name]
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(14 if "Text 4" in shape.name or "Text 9" in shape.name or "Text 14" in shape.name else 12)
            if "Text 4" in shape.name or "Text 9" in shape.name or "Text 14" in shape.name:
                p.font.bold = True
                p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    # -------------------------------------------------------------------------
    # SLIDE 9: Proposed System Architecture
    # -------------------------------------------------------------------------
    s9 = prs.slides[8]
    arch_blocks = {
        "Text 2": "Input Ingestion\n• CSV / TXT format auto-detect\n• Minimum 50 valid float points\n• Memory-bounded parsing",
        "Text 5": "Preprocessing\n• Edge-value pad to 500 points\n• Per-sample Z-Score scaling\n• Eliminates MVA gain offsets",
        "Text 8": "Dual-AI Engine\n• 1D-CNN (140k params; 4 classes)\n• Autoencoder (312k params; anomaly)\n• Zero missed critical faults",
        "Text 11": "Multi-Tier Guardrails\n• Morphological shape filters\n• Monotonicity & peak checks\n• Deterministic FFT fallback",
        "Text 14": "Storage & UI Dashboard\n• FastAPI async REST endpoints\n• SQLite tenant-isolated DB\n• React 19 & Recharts UI"
    }
    for shape in s9.shapes:
        if shape.name in arch_blocks and shape.has_text_frame:
            shape.text_frame.text = arch_blocks[shape.name]
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(9.5)
        elif shape.name == "Text 15" and shape.has_text_frame:
            shape.text_frame.text = "Fig. 2: IntelliFRA End-to-End Five-Stage Ingestion, Inference, and Triage Architecture"
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(10)
            p.font.italic = True
            p.alignment = PP_ALIGN.CENTER

    # Place architecture diagram (image1.png) on Slide 9 below or adjacent to the pipeline blocks
    img1_path = media_dir / "image1.png"
    if img1_path.exists():
        s9.shapes.add_picture(str(img1_path), Inches(3.2), Inches(3.9), Inches(3.6), Inches(1.35))

    # -------------------------------------------------------------------------
    # SLIDE 10: Methodology
    # -------------------------------------------------------------------------
    s10 = prs.slides[9]
    meth_map = {
        "Text 4": "Physics-Based Data Synthesis",
        "Text 5": "Stochastic lumped-mode generator spanning 1 kHz–2 MHz. Superimposes 8–12 Lorentzian modes across 6 physical fault archetypes (50,000 curves total).",
        "Text 8": "Standardization & Preprocessing",
        "Text 9": "Robust CSV/TXT parsing, boundary edge-value replication to 500 samples, and independent per-sample z-score normalization (μ=0, σ=1, ε=1e-6).",
        "Text 12": "Dual Neural Architecture",
        "Text 13": "1D-CNN (140,644 parameters) with 3 Conv blocks and Dropout (p=0.2) + Dense Autoencoder (312,532 parameters) trained strictly on healthy baselines.",
        "Text 16": "Training & Validation Rigor",
        "Text 17": "PyTorch, Adam (lr=1e-3, 20 epochs), 80:20 split (40k/10k). Supplementary 5-fold cross-validation on 12k uncapped sweeps and shifted OOD test set.",
        "Text 20": "Guardrails & Production UI",
        "Text 21": "Morphological filters (smoothness, monotonicity, peak counts) + FFT fallback, integrated into FastAPI REST API and React 19 interactive Recharts UI."
    }
    for shape in s10.shapes:
        if shape.name in meth_map and shape.has_text_frame:
            shape.text_frame.text = meth_map[shape.name]
            p = shape.text_frame.paragraphs[0]
            if shape.name in ["Text 4", "Text 8", "Text 12", "Text 16", "Text 20"]:
                p.font.name = "Calibri"
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
            else:
                p.font.name = "Calibri"
                p.font.size = Pt(11)
                p.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # -------------------------------------------------------------------------
    # SLIDE 11: Dataset & Tools Used
    # -------------------------------------------------------------------------
    s11 = prs.slides[10]
    for shape in s11.shapes:
        if shape.has_table:
            t = shape.table
            t_data = [
                ["Name", "IntelliFRA Physics-Synthesized SFRA Corpus"],
                ["Source", "Physics-informed stochastic lumped-mode generator (1 kHz–2 MHz)"],
                ["No. of samples", "50,000 curves (12,500 per operational severity class)"],
                ["No. of classes", "4 Classes: Normal, Minor Deviation, Moderate Fault, High Fault Risk"],
                ["Train / Test split", "80:20 Split (40,000 Train / 10,000 Validation) + 5-Fold CV (12,000 sweeps)"]
            ]
            for r_idx, (col0, col1) in enumerate(t_data):
                cell0 = t.cell(r_idx, 0)
                cell0.text = col0
                p0 = cell0.text_frame.paragraphs[0]
                p0.font.name = "Calibri"
                p0.font.size = Pt(10)
                p0.font.bold = True

                cell1 = t.cell(r_idx, 1)
                cell1.text = col1
                p1 = cell1.text_frame.paragraphs[0]
                p1.font.name = "Calibri"
                p1.font.size = Pt(10)
        elif shape.name == "Text 3" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            tools_items = [
                ("Languages & AI Frameworks: ", "Python 3.10, PyTorch, Scikit-learn, NumPy, SciPy"),
                ("Backend & Storage: ", "FastAPI (asynchronous REST), SQLAlchemy, SQLite, Pydantic, Uvicorn, Bcrypt, JWT Authentication"),
                ("Frontend & Visualization: ", "React 19, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons"),
                ("Optimization & Metrics: ", "Adam optimizer (lr=1e-3), Cross-Entropy & MSE loss, single-core CPU latency profiling")
            ]
            for idx, (lead, body) in enumerate(tools_items):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.space_after = Pt(6)
                r_lead = p.add_run()
                r_lead.text = lead
                r_lead.font.name = "Calibri"
                r_lead.font.size = Pt(11)
                r_lead.font.bold = True
                r_lead.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

                r_body = p.add_run()
                r_body.text = body
                r_body.font.name = "Calibri"
                r_body.font.size = Pt(10.5)

    # -------------------------------------------------------------------------
    # SLIDE 12: Results
    # -------------------------------------------------------------------------
    s12 = prs.slides[11]
    results_cards = {
        "Text 2": "94.41%",
        "Text 3": "1D-CNN Validation Accuracy\n(Macro F1 = 0.9443; Support = 10,000)",
        "Text 5": "98.47%",
        "Text 6": "Autoencoder Anomaly Accuracy\n(100% Fault Recall across 7,497 faults)",
        "Text 8": "0.274 ms",
        "Text 9": "Full-Pipeline CPU Latency\n(Sub-millisecond real-time triage)"
    }
    for shape in s12.shapes:
        if shape.name in results_cards and shape.has_text_frame:
            shape.text_frame.text = results_cards[shape.name]
            p = shape.text_frame.paragraphs[0]
            if shape.name in ["Text 2", "Text 5", "Text 8"]:
                p.font.name = "Cambria"
                p.font.size = Pt(28)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
            else:
                p.font.name = "Calibri"
                p.font.size = Pt(9.5)
                p.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
        elif shape.has_chart:
            # Replace placeholder chart with real 1D-CNN Confusion Matrix image
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            img6_path = media_dir / "image6.png"
            if img6_path.exists():
                s12.shapes.add_picture(str(img6_path), left, top, width, height)

    # -------------------------------------------------------------------------
    # SLIDE 13: Comparison with Existing Methods
    # -------------------------------------------------------------------------
    s13 = prs.slides[12]
    for shape in s13.shapes:
        if shape.has_table:
            t = shape.table
            comp_rows = [
                ["Proposed 1D-CNN (IntelliFRA)", "81.03% (94.41%*)", "82.80% (94.43%*)", "81.90% (94.41%*)", "82.34% (94.43%*)"],
                ["Random Forest (100 trees, depth 15)", "72.57% ± 1.05%", "73.50%", "72.60%", "73.00%"],
                ["SVM (RBF Kernel, C=1.0)", "66.13% ± 0.65%", "67.80%", "66.20%", "67.20%"],
                ["Multilayer Perceptron (MLP 128-64)", "64.95% ± 0.94%", "65.90%", "64.90%", "65.30%"]
            ]
            for r_idx, row in enumerate(comp_rows):
                for c_idx, val in enumerate(row):
                    cell = t.cell(r_idx + 1, c_idx)
                    cell.text = val
                    p = cell.text_frame.paragraphs[0]
                    p.font.name = "Calibri"
                    p.font.size = Pt(10.5)
                    if r_idx == 0:
                        p.font.bold = True
                        p.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        elif shape.name == "Text 1" and shape.has_text_frame:
            shape.text_frame.text = (
                "* Benchmark on 12,000 uncapped sweeps under 5-fold stratified cross-validation; 94.41% accuracy on the 10,000-sweep held-out split. "
                "On a separate shifted test set (±15% pole shift, heavy noise), 1D-CNN leads with 56.88% (vs. RF 51.21%, SVM 50.83%, MLP 49.33%)."
            )
            p = shape.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(9.5)
            p.font.italic = True

    # -------------------------------------------------------------------------
    # SLIDE 14: Conclusion & Future Scope
    # -------------------------------------------------------------------------
    s14 = prs.slides[13]
    for shape in s14.shapes:
        if shape.name == "Text 0" and shape.has_text_frame:
            if "Summarise what was achieved" in shape.text_frame.text:
                tf = shape.text_frame
                tf.clear()
                p_head = tf.paragraphs[0]
                p_head.text = "Conclusion"
                p_head.font.name = "Calibri"
                p_head.font.size = Pt(17)
                p_head.font.bold = True
                p_head.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

                concl_items = [
                    "Automated Triage: Successfully engineered an intelligent web platform that removes human subjectivity and manual overlay bottlenecks in transformer SFRA testing.",
                    "High Classification & Zero-Miss Recall: 1D-CNN achieves 94.41% validation accuracy, while the Autoencoder flags anomalies with 98.47% accuracy and 100% recall on faulty sweeps.",
                    "Sub-Millisecond Inference: Full-pipeline CPU execution in 0.274 ms with multi-tiered morphological filters and deterministic FFT spectral energy fail-safes.",
                    "Complete B.Tech. Objective Fulfillment: All project objectives completed, delivering a deployable, open-source React/FastAPI tool for power utilities."
                ]
                for item in concl_items:
                    p = tf.add_paragraph()
                    p.text = "• " + item
                    p.font.name = "Calibri"
                    p.font.size = Pt(11.5)
                    p.space_after = Pt(4)
            elif "Possible extensions" in shape.text_frame.text:
                tf = shape.text_frame
                tf.clear()
                p_head = tf.paragraphs[0]
                p_head.text = "Future Scope"
                p_head.font.name = "Calibri"
                p_head.font.size = Pt(17)
                p_head.font.bold = True
                p_head.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

                future_items = [
                    "Utility Field Fine-Tuning: Transfer learning and domain adaptation on measured substation SFRA recordings (IEEE DataPort and Indian utility fleets).",
                    "Automated Inspection Reports: Adding one-click PDF engineering diagnostic report generation and automated three-phase baseline curve overlays.",
                    "Adaptive Envelopes & Lab Testbed: Upgrading heuristic shape overrides with adaptive envelope trackers and physical laboratory winding testbed validation."
                ]
                for item in future_items:
                    p = tf.add_paragraph()
                    p.text = "• " + item
                    p.font.name = "Calibri"
                    p.font.size = Pt(11.5)
                    p.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # SLIDE 15: Publications & Competitions
    # -------------------------------------------------------------------------
    s15 = prs.slides[14]
    for shape in s15.shapes:
        if shape.name == "Text 3" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = (
                "Harini Panigrahi, Neha Verma, Prapti Bhayde, Yooraj Gole, and Bhanu Tekwani*,\n"
                "“IntelliFRA: An AI-Based Platform for Automated Transformer Fault Analysis,”\n"
                "International Conference on Trends in Electrical, Electronics and Computer Systems (ITEECS 2025).\n"
                "(Status: Submitted / Under Review | Length: ~8.5 pages)"
            )
            p.font.name = "Calibri"
            p.font.size = Pt(13)
            p.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        elif shape.name == "Text 6" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = (
                "• Final Year Capstone Project, Department of Information Technology, Vidyalankar Institute of Technology, Mumbai (Academic Year 2024–25).\n"
                "• Selected for Institutional B.Tech. Final Review Showcase and Research Presentation."
            )
            p.font.name = "Calibri"
            p.font.size = Pt(12)
            p.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # -------------------------------------------------------------------------
    # SLIDE 16: References
    # -------------------------------------------------------------------------
    s16 = prs.slides[15]
    for shape in s16.shapes:
        if shape.name == "Text 0" and shape.has_text_frame and "[1]" in shape.text_frame.text:
            tf = shape.text_frame
            tf.clear()
            refs = [
                "[1] S. A. Ryder, “Diagnosing Transformer Faults Using Frequency Response Analysis,” IEEE Electrical Insulation Magazine, vol. 19, no. 2, pp. 16–22, 2003.",
                "[2] IEC 60076-18, “Power Transformers - Part 18: Measurement of Frequency Response,” International Electrotechnical Commission (IEC), Geneva, Switzerland, 2012.",
                "[3] T. Ince, S. Kiranyaz et al., “Real-Time Motor Fault Detection by 1-D Convolutional Neural Networks,” IEEE Trans. Ind. Electron., vol. 63, no. 11, pp. 7067–7075, 2016.",
                "[4] M. Sakurada and T. Yairi, “Anomaly Detection Using Autoencoders with Nonlinear Dimensionality Reduction,” in Proc. MLSDA, Gold Coast, Australia, pp. 4–11, 2014.",
                "[5] M. Phillip, A. Singh, and C. J. Ramlal, “Towards Automated Frequency Response Analysis of Power Transformers with Deep Learning,” Applied Artificial Intelligence, vol. 39, no. 1, 2025."
            ]
            for idx, r in enumerate(refs):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = r
                p.font.name = "Calibri"
                p.font.size = Pt(12)
                p.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # SLIDE 17: Thank You
    # -------------------------------------------------------------------------
    s17 = prs.slides[16]
    for shape in s17.shapes:
        if shape.name == "Text 2" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p1 = tf.paragraphs[0]
            p1.text = "Department of Information Technology  |  Vidyalankar Institute of Technology, Mumbai"
            p1.font.name = "Calibri"
            p1.font.size = Pt(12)
            p1.font.bold = True
            p1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

            p2 = tf.add_paragraph()
            p2.text = "Project Team: Harini Panigrahi, Neha Verma, Prapti Bhayde, Yooraj Gole  |  Guide: Prof. Bhanu Tekwani (bhanu.tekwani@vit.edu.in)"
            p2.font.name = "Calibri"
            p2.font.size = Pt(11)
            p2.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    prs.save(str(output_path))
    print(f"Successfully generated presentation at {output_path}")


if __name__ == "__main__":
    root_dir = Path("/Users/harinipanigrahi/.gemini/antigravity/scratch/IntelliFRA")
    template = root_dir / "VIT_BTech_Project_Presentation_Template.pptx"
    media = root_dir / "backend/data/user_paper_media"
    output = root_dir / "IntelliFRA_VIT_BTech_Presentation.pptx"
    update_presentation(template, media, output)
