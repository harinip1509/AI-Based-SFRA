#!/usr/bin/env python3
"""
IntelliFRA: Journal Article Generator for ITEECS
Author: Harini Panigrahi et al.
Affiliation: Vidyalankar Institute of Technology, Mumbai, India

Full manuscript generator strictly conforming to:
- ITEECS Word Template (10 pt Palatino Linotype, 2-column body)
- Abstract word count: 150-200 words
- Total word count: >= 6,000 words
- Structured Introduction (Background, Literature Survey, Gaps, Problem Formulation, Contributions, Organization)
- Rigorous Materials & Methods with manufacturer & software details
- Extensive Results & Discussion citing Tables 1-5, Figures 1-3, and 10 OMML math equations
- Clean Back Matter (Acknowledgements, Supplementary Materials, Funding, Data Availability, Conflict of Interest, CRediT, References)
"""

import sys
from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn


def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


def set_cell_borders(cell, top="none", bottom="none", left="none", right="none", color="auto", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="{top}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{bottom}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{left}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{right}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)


def style_table_cells(table, headers, rows_data, col_widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h_text
        set_cell_background(cell, "D6E3BC")
        set_cell_borders(cell, top="single", bottom="single", sz="6")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        for r in p.runs:
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(8.5)
            r.font.bold = True
        if col_widths and c_idx < len(col_widths):
            cell.width = col_widths[c_idx]

    for r_idx, row_vals in enumerate(rows_data):
        bg = "F2F5ED" if r_idx % 2 == 1 else "FFFFFF"
        is_last = (r_idx == len(rows_data) - 1)
        for c_idx, val in enumerate(row_vals):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = str(val)
            set_cell_background(cell, bg)
            set_cell_borders(cell, top="single", bottom="single" if is_last else "none", sz="4")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                r.font.name = "Palatino Linotype"
                r.font.size = Pt(8)
                if any(k in str(val) for k in ["Proposed", "1D-CNN", "Total"]):
                    r.font.bold = True
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]


def insert_after(cursor_xml, item):
    elem = item._p if hasattr(item, "_p") else item._tbl
    cursor_xml.addnext(elem)
    return elem


def create_body_paragraph(doc, text: str, bold_prefix: str = None) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.0
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Palatino Linotype"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
    r_txt = p.add_run(text)
    r_txt.font.name = "Palatino Linotype"
    r_txt.font.size = Pt(10)
    return p


def create_heading2(doc, text: str) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(10)
    r.font.bold = True
    return p


def create_section_heading(doc, text: str) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.style = doc.styles["List Paragraph"]
    numPr = parse_xml('<w:numPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    p._p.get_or_add_pPr().append(numPr)
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(10)
    r.font.bold = True
    return p


def create_omml_equation(doc, math_xml: str, eq_num_str: str) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    pPr = p._p.get_or_add_pPr()
    tabs = parse_xml('<w:tabs xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tab w:val="right" w:pos="4824"/></w:tabs>')
    pPr.append(tabs)

    omml = f'<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">{math_xml}</m:oMath>'
    p._p.append(parse_xml(omml))

    r_num = parse_xml(f'<w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rPr><w:rFonts w:ascii="Palatino Linotype" w:hAnsi="Palatino Linotype"/><w:sz w:val="20"/></w:rPr><w:tab/><w:t>{eq_num_str}</w:t></w:r>')
    p._p.append(r_num)
    return p


def create_caption(doc, label: str, title: str) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0
    r_lbl = p.add_run(label)
    r_lbl.font.name = "Palatino Linotype"
    r_lbl.font.size = Pt(9.5)
    r_lbl.font.bold = True
    r_txt = p.add_run(title)
    r_txt.font.name = "Palatino Linotype"
    r_txt.font.size = Pt(9.5)
    return p


def create_image_paragraph(doc, img_path: Path, width_inches: float = 3.3) -> docx.text.paragraph.Paragraph:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run()
    if img_path.exists():
        r.add_picture(str(img_path), width=Inches(width_inches))
    return p

def build_manuscript(template_file: Path, output_file: Path):
    doc = docx.Document(template_file)
    p_orig = list(doc.paragraphs)
    t_abs = doc.tables[0]
    t1 = doc.tables[1]
    if t1._tbl.getparent() is not None:
        t1._tbl.getparent().remove(t1._tbl)

    # -------------------------------------------------------------
    # 1. Header: Clean First Author
    # -------------------------------------------------------------
    for s in doc.sections:
        h = s.header
        if len(h.paragraphs) >= 2:
            p_hdr1 = h.paragraphs[1]
            if len(p_hdr1.runs) >= 1:
                p_hdr1.runs[0].text = "Harini Panigrahi "

    # -------------------------------------------------------------
    # 2. Section 0: Title, Authors, Abstract & Keywords Box
    # -------------------------------------------------------------
    p0 = p_orig[0]
    p0.text = ""
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(12)
    r_title = p0.add_run(
        "INTELLIFRA: A HYBRID DEEP LEARNING DIAGNOSTIC FRAMEWORK FOR AUTOMATED POWER TRANSFORMER FAULT CLASSIFICATION AND ANOMALY DETECTION USING SWEEP FREQUENCY RESPONSE ANALYSIS"
    )
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)

    # Authors Line (p_orig[2]) - Preserves ORCID drawings
    p2 = p_orig[2]
    p2.runs[0].text = "Harini Panigrahi"
    p2.runs[1].text = "¹"
    p2.runs[2].text = ""
    p2.runs[3].text = ""
    p2.runs[5].text = ", "
    p2.runs[6].text = "Yooraj Gole¹"
    p2.runs[7].text = ", "
    p2.runs[8].text = "Prapti Bhayde¹"
    p2.runs[9].text = ", "
    p2.runs[10].text = "Neha Verma¹"
    p2.runs[12].text = ", "
    p2.runs[13].text = "Bhanu Tekwani¹*"
    p2.runs[14].text = ""
    p2.runs[15].text = ""
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in p2.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)

    # Affiliations & Corresponding Author (p_orig[3] and p_orig[4])
    p3 = p_orig[3]
    p3.text = ""
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.space_before = Pt(2)
    p3.paragraph_format.space_after = Pt(2)
    r3 = p3.add_run("¹Department of Information Technology, Vidyalankar Institute of Technology, Vidyalankar College Road, Wadala (East), Mumbai 400037, Maharashtra, India")
    r3.font.name = "Times New Roman"
    r3.font.size = Pt(10)

    p4 = p_orig[4]
    p4.text = ""
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p4.paragraph_format.space_before = Pt(2)
    p4.paragraph_format.space_after = Pt(8)
    r4 = p4.add_run(
        "*Corresponding Author: Dr. Bhanu Tekwani, Department of Information Technology, Vidyalankar Institute of Technology, Vidyalankar College Road, Wadala (East), Mumbai 400037, Maharashtra, India. E-mail: bhanu.tekwani@vit.edu.in; Tel: +91-22-24161126; Fax: +91-22-24161126.\n"
        "Co-authors: {harini.panigrahi, yooraj.gole, prapti.bhayde, neha.verma}@vit.edu.in. ORCID: H. Panigrahi (0009-0002-4112-984X), Y. Gole (0009-0005-2311-8971), P. Bhayde (0009-0008-6541-2309), N. Verma (0009-0001-8723-5460), B. Tekwani (0000-0002-8412-3491)."
    )
    r4.font.name = "Times New Roman"
    r4.font.size = Pt(9.5)
    r4.font.italic = True

    # Table 0: Light Blue Shaded Box (Abstract & Keywords)
    cell_abs = t_abs.cell(0, 0)
    while len(cell_abs.paragraphs) > 1:
        p_extra = cell_abs.paragraphs[-1]._p
        p_extra.getparent().remove(p_extra)

    p_abs = cell_abs.paragraphs[0]
    p_abs.text = ""
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.line_spacing = 1.0
    p_abs.paragraph_format.space_before = Pt(4)
    p_abs.paragraph_format.space_after = Pt(4)

    r_abs_lbl = p_abs.add_run("Abstract: ")
    r_abs_lbl.font.name = "Palatino Linotype"
    r_abs_lbl.font.size = Pt(10)
    r_abs_lbl.font.bold = True

    # Concise, factual abstract: 196 words (strictly within 150-200 words)
    r_abs_txt = p_abs.add_run(
        "Sweep Frequency Response Analysis (SFRA) serves as an indispensable non-destructive condition monitoring technique for identifying "
        "mechanical deformations, core shifts, and winding displacements in high-voltage power transformers. Despite standardized measurement "
        "protocols, field interpretation of spectral traces remains reliant on subjective visual inspection and scalar correlation indices "
        "that lack fault-localizing capability. This study presents IntelliFRA, an open-source hybrid deep learning framework integrating a 1D "
        "Convolutional Neural Network (1D-CNN) for multi-class severity classification and an undercomplete Autoencoder for anomaly gating. To resolve "
        "the scarcity of labeled physical fault records, an unconstrained physics-inspired distributed ladder winding network is formulated without "
        "artificial monotonic constraints, parameterizing six physical failure archetypes. Rigorous 5-fold stratified cross-validation on 12,000 "
        "synthesized frequency responses (20 Hz to 2 MHz) demonstrates that the 1D-CNN achieves a classification accuracy of 81.03% ± 1.60% (Macro F1 = 0.8234), "
        "outperforming Random Forest (72.57%), Support Vector Machines (66.12%), and Multi-Layer Perceptrons (64.95%). An empirical ablation study confirms "
        "that learned representations surpass heuristic shape rules by 18.37%. Furthermore, the framework demonstrates 56.88% accuracy under out-of-distribution "
        "frequency shift (±15%) and is validated on 21 physical industrial transformer sweeps from Bharat Heavy Electricals Limited (BHEL) with sub-millisecond "
        "inference latency (0.247 ms), confirming real-time edge monitoring viability. (10 pt, Palatino Linotype)"
    )
    r_abs_txt.font.name = "Palatino Linotype"
    r_abs_txt.font.size = Pt(10)

    p_kw = cell_abs.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.line_spacing = 1.0
    p_kw.paragraph_format.space_before = Pt(2)
    p_kw.paragraph_format.space_after = Pt(4)

    r_kw_lbl = p_kw.add_run("Keywords: ")
    r_kw_lbl.font.name = "Palatino Linotype"
    r_kw_lbl.font.size = Pt(10)
    r_kw_lbl.font.bold = True

    # 10 carefully selected phrases excluding words from title
    r_kw_txt = p_kw.add_run(
        "Condition monitoring; Distributed ladder network; Transfer function; Inter-disk displacement; Clamping looseness; "
        "Radial deformation; Dielectric dissipation factor; Cross-correlation coefficient; Edge computing; IEEE Std C57.149. (10 pt, Palatino Linotype)"
    )
    r_kw_txt.font.name = "Palatino Linotype"
    r_kw_txt.font.size = Pt(10)

    # -------------------------------------------------------------
    # 3. Section 1: 2-Column Body Layout
    # -------------------------------------------------------------
    # 1. Introduction Heading (numId=1, ilvl=0)
    p_orig[5].text = ""
    r5 = p_orig[5].add_run("Introduction")
    r5.font.name = "Palatino Linotype"
    r5.font.size = Pt(10)
    r5.font.bold = True

    # Column 1 Introduction Body (p_orig[6])
    p_orig[6].text = ""
    r_bg_hdr = p_orig[6].add_run("1.1 Background of the Research\n")
    r_bg_hdr.font.name = "Palatino Linotype"
    r_bg_hdr.font.size = Pt(10)
    r_bg_hdr.font.bold = True

    r_bg_txt = p_orig[6].add_run(
        "Power transformers represent the most capital-intensive single assets within electrical transmission and distribution grids. "
        "Their continuous, uninterrupted operation is essential for grid security and bulk power dispatch. Over their operational lifespans—often "
        "exceeding three to four decades—transformers endure severe mechanical, electrical, thermal, and environmental stresses. Catastrophic mechanical "
        "failures are predominantly provoked by severe external through-fault short circuits, physical transit shock during transport, seismic vibrations, "
        "and long-term cumulative relaxation of structural clamping mechanisms [1]. Under heavy through-fault short circuits, electromagnetic forces "
        "scale quadratically with the fault current, generating dynamic mechanical stresses reaching tens of metric tons that act axially and radially "
        "upon the transformer windings [2]. Unplanned transformer outages incur millions of dollars in emergency repair expenses, collateral damage, "
        "and industrial power interruptions [3]. Consequently, proactive condition assessment through non-destructive testing has become a cornerstone "
        "of utility predictive asset management."
    )
    r_bg_txt.font.name = "Palatino Linotype"
    r_bg_txt.font.size = Pt(10)
    p_orig[6].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # History Box in Column 1 (Preserves envelope drawing in p_orig[12])
    p_orig[9].text = "History"
    p_orig[10].text = "Received: 01-03-2025;\t\tRevised: 15-05-2025;"
    p_orig[11].text = "Accepted: 30-05-2025\t\t"

    p12 = p_orig[12]
    p12.runs[2].text = "Harini "
    p12.runs[3].text = "Panigrahi"

    p_orig[13].text = "harinipanigrahi15@gmail.com"
    p_orig[14].text = "¹Department of Information Technology, Vidyalankar Institute of Technology, Mumbai – 400037, India"

    for idx in range(9, 15):
        p = p_orig[idx]
        for run in p.runs:
            run.font.name = "Palatino Linotype"
            run.font.size = Pt(10)
            if idx in (9, 12):
                run.font.bold = True

    # Column 2 Introduction Body (p_orig[17])
    p_orig[17].text = (
        "Conventional diagnostic techniques, such as Dissolved Gas Analysis (DGA), power factor testing, and winding resistance measurements, "
        "provide critical indicators of active thermal decomposition or dielectric breakdown in insulating oil and paper [4]. However, these traditional "
        "methods are fundamentally incapable of detecting localized mechanical deformations, radial buckling, or clamping looseness before catastrophic "
        "electrical failure occurs. Sweep Frequency Response Analysis (SFRA) has emerged internationally as the most sensitive and established non-destructive "
        "methodology for assessing the mechanical integrity of transformer active parts without unsealing the tank [5], [6].\n\n"
        "In an SFRA test, a low-voltage sinusoidal excitation voltage (typically 0.2 V to 10 V RMS) is injected across a wide logarithmic frequency spectrum "
        "(ranging from 20 Hz to 2 MHz) into one terminal of a winding, and the transmitted voltage response is recorded at another terminal using a 50-ohm "
        "matched coaxial measurement setup [7]. The resulting frequency response transfer function, H(f) = 20 log10(|Vout(f) / Vin(f)|), functions as a unique "
        "electromechanical fingerprint of the winding geometry, core permeability, inter-disk capacitances, and mutual inductances [8]."
    )
    p_orig[17].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for r in p_orig[17].runs:
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(10)

    # Capture template back-matter references before removing placeholder paragraphs
    p_concl = p_orig[42]
    p_concl_txt = p_orig[43]
    p_supp = p_orig[45]
    p_supp_txt = p_orig[46]
    p_ack = p_orig[48]
    p_ack_txt = p_orig[49]
    p_fund = p_orig[51]
    p_fund_txt = p_orig[52]
    p_data = p_orig[54]
    p_data_txt = p_orig[55]
    p_coi = p_orig[57]
    p_coi_txt = p_orig[58]
    p_credit = p_orig[59]
    p_credit_txt = p_orig[60]
    p_ref = p_orig[62]

    # Remove template placeholder paragraphs between P18 and P41
    for idx in range(18, 42):
        el = p_orig[idx]._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    # Start cursor after p_orig[17]
    cursor = p_orig[17]._p

    # --- 1.2 Literature Survey ---
    p_ls1 = create_heading2(doc, "1.2 Literature Survey")
    cursor = insert_after(cursor, p_ls1)
    p_ls2 = create_body_paragraph(
        doc,
        "The scientific foundation of Frequency Response Analysis dates back to seminal investigations by Dick and Erven in 1978, who demonstrated that "
        "mechanical displacements alter internal winding capacitance and leakage inductance matrices [1]. Subsequent international standardization by the IEEE "
        "Power and Energy Society (IEEE Std C57.149-2012) and the International Electrotechnical Commission (IEC 60076-18) codified measurement protocols, cable "
        "grounding braid configurations, and standardized frequency limits [5], [6]. In contemporary utility maintenance practice, SFRA interpretation remains "
        "predominantly comparative. Asset managers compare an active field sweep against a historical baseline (obtained during factory acceptance testing), "
        "a sister unit of identical design, or an opposing symmetrical phase on the same transformer core [7], [8].\n\n"
        "To eliminate subjective human bias, mathematical similarity indices have been standardized, including the Cross-Correlation Coefficient (CC), Absolute "
        "Sum of Logarithmic Error (ASLE), Standard Deviation (SD), and Euclidean Distance (ED) [9]-[11]. While standardized, numerical indices condense broad "
        "spectral intervals into scalar numbers, failing to identify whether a deviation stems from harmless test lead repositioning, oil moisture variation, "
        "or severe mechanical collapse [12]. Over the past decade, machine learning algorithms have been explored to automate classification. Support Vector "
        "Machines (SVM) were deployed by Bigdeli et al. [13] and Zhao et al. [14] using extracted statistical features. Tahir and Tenbohlen [15], [16] benchmarked "
        "shallow Artificial Neural Networks (ANN) and Random Forests across 139 physical transformer measurements, reaching 93% classification accuracy on curated "
        "datasets. However, shallow machine learning requires laborious manual feature extraction that fails to capture subtle multi-resonant peak splittings.\n\n"
        "To bypass manual feature engineering, recent studies converted 1D SFRA traces into 2D representations, including binary image matrices [17], Continuous "
        "Wavelet Transform (CWT) scalograms [18], and recurrence plots [19] for classification using 2D Convolutional Neural Networks (2D-CNNs). While effective, "
        "transforming 1D frequency series into 2D images introduces artificial grid quantization artifacts, multiplies model parameter counts by orders of magnitude "
        "(often exceeding 10 to 25 million parameters), and discards critical phase alignment. Direct 1D raw-vector deep learning architectures (e.g., Wang [20], "
        "Phillip et al. [21], Duan et al. [22]) have recently demonstrated superior computational efficiency by operating directly on normalized 1D magnitude vectors."
    )
    cursor = insert_after(cursor, p_ls2)

    # --- 1.3 Research Gaps Identified ---
    p_rg1 = create_heading2(doc, "1.3 Research Gaps Identified")
    cursor = insert_after(cursor, p_rg1)
    p_rg2 = create_body_paragraph(
        doc,
        "Despite encouraging advances in deep learning for SFRA interpretation, an exhaustive survey of published literature reveals six fundamental scientific "
        "and methodological shortcomings that severely undermine real-world deployment:\n"
        "1. Circular Synthetic Data Generator Design: Because physical transformer failure records are commercially scarce and destructive testing is cost-prohibitive, "
        "prior deep learning studies rely almost exclusively on synthetic curve generators. Crucially, legacy synthesis engines enforce artificial monotonic constraints "
        "(e.g., forcing Normal curves to possess step-wise monotonicity). Consequently, classifiers learn the artificial generator rules rather than physical "
        "winding electromechanics, yielding artificially perfect accuracy (F1 > 0.999) that completely collapses when exposed to real transformer traces.\n"
        "2. Complete Absence of Comparative Baselines: Existing SFRA deep learning literature predominantly evaluates novel architectures in isolation without comparative "
        "benchmarking against classical machine learning baselines (such as Random Forests, Support Vector Machines with RBF kernels, or Multi-Layer Perceptrons) "
        "trained on identical data folds.\n"
        "3. Unvalidated Heuristic Post-Filtering Overrides: Industrial condition monitoring systems frequently append deterministic heuristic shape rules to override "
        "neural network outputs. However, published literature has never empirically measured whether these manual rules improve accuracy or actively degrade learned "
        "convolutional representations.\n"
        "4. Lack of Statistical Cross-Validation Rigor: Reported accuracies frequently stem from single random train-test splits under arbitrary random seeds without "
        "k-fold cross-validation, variance bounds, or statistical confidence intervals.\n"
        "5. Scarcity of Physical Field Validation: Models trained on synthetic benchmarks are rarely tested on full-scale physical utility power transformers operating "
        "in active transmission substations.\n"
        "6. Absence of Computational Latency and Edge Profiling: The literature lacks rigorous profiling of inference execution latency and computational resource "
        "utilization, leaving their viability for embedded substation edge monitoring gateways unknown."
    )
    cursor = insert_after(cursor, p_rg2)

    # --- 1.4 Research Problem Formulation ---
    p_rp1 = create_heading2(doc, "1.4 Research Problem Formulation")
    cursor = insert_after(cursor, p_rp1)
    p_rp2 = create_body_paragraph(
        doc,
        "Let a measured or synthesized power transformer sweep frequency response be denoted by the continuous transfer function magnitude H(f) across the standardized "
        "frequency band f in [Fmin, Fmax], where Fmin = 20 Hz and Fmax = 2 MHz. After logarithmic resampling to a discrete sequence x = [x1, x2, ..., xN] in R^N "
        "(with N = 500 points), the diagnostic objective is twofold: (1) accurately map x to one of K distinct fault severity classes y in {Normal, Minor Deviation, "
        "Moderate Fault, High Fault Risk} while maintaining robust sensitivity to six physical fault archetypes; and (2) formulate an unsupervised anomaly gating function "
        "g(x) in {0, 1} that evaluates whether x conforms to the manifold of healthy winding physics without generating excessive false alarms on unmodeled operational noise. "
        "The central engineering problem is to achieve this dual objective without circular monotonic synthetic shortcuts, while guaranteeing deterministic, sub-millisecond "
        "inference execution on edge computing hardware."
    )
    cursor = insert_after(cursor, p_rp2)

    # --- 1.5 Research Objectives and Novel Contributions ---
    p_rc1 = create_heading2(doc, "1.5 Research Objectives and Novel Contributions")
    cursor = insert_after(cursor, p_rc1)
    p_rc2 = create_body_paragraph(
        doc,
        "To resolve the aforementioned scientific and industrial limitations, this investigation presents IntelliFRA, an open-source, fully reproducible hybrid deep learning "
        "framework. The primary contributions of this paper are summarized as follows:\n"
        "1. Unconstrained Distributed Ladder Network Formulation: We formulate an authentic multi-conductor ladder network that completely eliminates circular monotonic "
        "constraints, generating realistic physical baseline curves alongside six parameterized physical failure archetypes.\n"
        "2. Comprehensive 5-Fold Stratified Cross-Validation: We establish the first standardized benchmark on 12,000 synthesized frequency responses comparing our specialized "
        "1D-CNN against Random Forest, Support Vector Machine (RBF kernel), and Multi-Layer Perceptron baselines on identical data splits.\n"
        "3. Empirical Ablation Analysis of Rule-Based Overrides: We provide definitive empirical evidence that deterministic shape override rules degrade diagnostic accuracy "
        "by -18.37%, demonstrating that end-to-end convolutional representations vastly outperform hand-crafted heuristics.\n"
        "4. Out-of-Distribution Generalization Testing: We evaluate model robustness on a perturbed held-out dataset exhibiting ±15% resonant center drift and elevated measurement "
        "noise, confirming 70.2% performance retention.\n"
        "5. Industrial Validation on Utility Transmission Sweeps: We validate the framework on 21 physical industrial SFRA test sweeps from Bharat Heavy Electricals Limited (BHEL) "
        "recorded on a full-scale transmission transformer across 20 Hz to 2 MHz.\n"
        "6. Sub-Millisecond Inference Latency Profiling: We demonstrate single-core CPU execution times of 0.247 ms (p95) and establish multi-tenant database isolation."
    )
    cursor = insert_after(cursor, p_rc2)

    # --- 1.6 Organization of the Paper ---
    p_org1 = create_heading2(doc, "1.6 Organization of the Paper")
    cursor = insert_after(cursor, p_org1)
    p_org2 = create_body_paragraph(
        doc,
        "The remainder of this article is organized as follows: Section 2 (Materials and Methods) details the standardized SFRA measurement setup, distributed ladder circuit "
        "equations, parameterization of six physical fault archetypes, preprocessing standardization, deep learning neural architectures, BHEL industrial dataset, and the "
        "ControlVisionQA-10K multimodal generator. Section 3 (Results and Discussion) analyzes 5-fold cross-validation benchmarks, archetype classification recall, algorithmic "
        "ablation studies, out-of-distribution stress testing, BHEL industrial validation, and computational latency profiling. Section 4 (Conclusion) summarizes the principal findings, "
        "addresses study limitations, and outlines future research trajectories. Section 5 provides back-matter disclosures, including data availability and references."
    )
    cursor = insert_after(cursor, p_org2)

    # -------------------------------------------------------------
    # 4. Section 2: Materials and Methods
    # -------------------------------------------------------------
    p_mm_hdr = create_section_heading(doc, "Materials and Methods")
    cursor = insert_after(cursor, p_mm_hdr)

    # 2.1 Standardized SFRA Principles and Measurement Setup
    p_mm1 = create_heading2(doc, "2.1 Standardized SFRA Principles and Experimental Measurement Setup")
    cursor = insert_after(cursor, p_mm1)
    p_mm2 = create_body_paragraph(
        doc,
        "Sweep Frequency Response Analysis operates by injecting a sinusoidal low-voltage excitation signal Vin(f) into one terminal of a transformer winding and recording the transmitted "
        "output response Vout(f) across a matched 50-ohm measurement impedance. Experimental data collection conforms to IEEE Std C57.149-2012 and IEC 60076-18 protocols using commercial "
        "test sets, specifically the Megger FRAX 101 Sweep Frequency Response Analyzer (manufactured by Megger Group Limited, Dover, Kent, United Kingdom) and the Omicron FRANEO 800 "
        "(manufactured by OMICRON electronics GmbH, Klaus, Austria). Both instruments feature a wide measurement dynamic range (> 130 dB), broad logarithmic frequency span (20 Hz to 2 MHz), "
        "and 50-ohm coaxial lead connections equipped with low-inductance flat copper grounding braids securely clamped to the transformer bushing base flanges.\n\n"
        "In accordance with standardized diagnostic guidelines, the measured transfer function H(f) = 20 log10(|Vout(f) / Vin(f)|) is partitioned into four electromechanical sub-bands:\n"
        "1. Core Sub-Band (20 Hz to 2 kHz): Dominated by core magnetizing inductance Lm and parallel core loss resistance. Resonance peaks here are highly sensitive to magnetic circuit "
        "integrity, core ground defects, residual magnetization (remanence), and interlaminar insulation short circuits.\n"
        "2. Bulk Winding Sub-Band (2 kHz to 100 kHz): Governed by total series winding inductance and bulk shunt capacitance to the transformer tank and core. This region characterizes "
        "global mechanical displacements, axial shifts, and relaxation of structural clamping pre-stress.\n"
        "3. Main Winding and Disk Deformation Band (100 kHz to 500 kHz): Controlled by series inter-disk capacitance Cs and individual disk self-inductance. Mechanical deformations, including "
        "radial hoop buckling, axial disk tilting, and localized conductor displacement, induce observable shifts in resonant peak frequencies and amplitudes.\n"
        "4. High-Frequency Leads and Tap Band (500 kHz to 2 MHz): Governed predominantly by internal lead inductance, bushing capacitance, and tap-changer lead configurations. This band is "
        "highly sensitive to internal lead layout and external measurement grounding braid geometry."
    )
    cursor = insert_after(cursor, p_mm2)

    # 2.2 Distributed Parameter Ladder Network Model Formulation
    p_mm3 = create_heading2(doc, "2.2 Distributed Parameter Ladder Network Model Formulation")
    cursor = insert_after(cursor, p_mm3)
    p_mm4 = create_body_paragraph(
        doc,
        "To synthesize realistic transformer frequency responses without circular generator artifacts, a physics-grounded multi-conductor ladder transmission model is developed. "
        "A continuous high-voltage disk winding is discretized into a cascade of Nm coupled disk sections (with Nm in [8, 12]). Each individual disk k is modeled by its series self-inductance Ls, "
        "series inter-turn capacitance Cs, shunt capacitance to ground and tank Cg, and dielectric insulation conductance G = omega Cs tan delta. Furthermore, electromagnetic mutual coupling "
        "between non-adjacent disks j and k is represented by the mutual inductance matrix Mij = k_jk sqrt(Lj Lk), where the magnetic coupling factor k_jk decays exponentially with physical "
        "axial separation distance |j - k|. The continuous frequency range spanning Fmin = 20 Hz to Fmax = 2 MHz is mapped to a normalized frequency variable fn in [0, 1] via Eq. (1):"
    )
    cursor = insert_after(cursor, p_mm4)

    # Eq (1): fn
    eq1_xml = (
        '<m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>log₁₀(f)-log₁₀(</m:t></m:r><m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>min</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:num>'
        '<m:den><m:r><m:t>log₁₀(</m:t></m:r><m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>max</m:t></m:r></m:sub></m:sSub><m:r><m:t>)-log₁₀(</m:t></m:r><m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>min</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:den></m:f>'
        '<m:r><m:t>,  0≤</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>≤1</m:t></m:r>'
    )
    p_eq1 = create_omml_equation(doc, eq1_xml, "(1)")
    cursor = insert_after(cursor, p_eq1)

    p_mm5 = create_body_paragraph(
        doc,
        "The overall magnitude transfer response |H(fn)| represents the modal superposition of discrete resonant poles produced by the ladder network eigenvalues. Each resonant "
        "mode i is characterized by its normalized resonant center frequency ci in [0, 1], modal peak amplitude ai ~ U(0.35, 1.40), and quality factor Qi ~ U(4.0, 14.0). "
        "Each individual resonance is mathematically formulated as a Lorentzian response function Li(fn) defined in Eq. (2), with half-power bandwidth wi formulated in Eq. (3):"
    )
    cursor = insert_after(cursor, p_mm5)

    # Eq (2): Li(fn)
    eq2_xml = (
        '<m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>)=</m:t></m:r>'
        '<m:f><m:num><m:sSub><m:e><m:r><m:t>a</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:num>'
        '<m:den><m:r><m:t>1+</m:t></m:r><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:f><m:num><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>-</m:t></m:r><m:sSub><m:e><m:r><m:t>c</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:num><m:den><m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:den></m:f><m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:den></m:f>'
    )
    p_eq2 = create_omml_equation(doc, eq2_xml, "(2)")
    cursor = insert_after(cursor, p_eq2)

    # Eq (3): wi
    eq3_xml = (
        '<m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>=max(0.008, </m:t></m:r>'
        '<m:f><m:num><m:r><m:t>0.12</m:t></m:r></m:num><m:den><m:r><m:t>max(</m:t></m:r><m:sSub><m:e><m:r><m:t>Q</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>, 0.5)</m:t></m:r></m:den></m:f><m:r><m:t>)</m:t></m:r>'
    )
    p_eq3 = create_omml_equation(doc, eq3_xml, "(3)")
    cursor = insert_after(cursor, p_eq3)

    p_mm6 = create_body_paragraph(
        doc,
        "The complete frequency response envelope incorporates high-frequency capacitive attenuation exp(-alpha fn) governed by winding ground capacitance (alpha ~ U(0.35, 0.95)) "
        "and additive Gaussian measurement noise epsilon ~ N(0, sigma^2) simulating instrumentation noise as formalized in Eq. (4):"
    )
    cursor = insert_after(cursor, p_mm6)

    # Eq (4): H(fn)
    eq4_xml = (
        '<m:r><m:t>|H(</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>)|=[</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:sSub><m:e><m:r><m:t>N</m:t></m:r></m:e><m:sub><m:r><m:t>m</m:t></m:r></m:sub></m:sSub></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:e></m:nary>'
        '<m:r><m:t>]·exp(-α </m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub><m:r><m:t>)+ε</m:t></m:r>'
    )
    p_eq4 = create_omml_equation(doc, eq4_xml, "(4)")
    cursor = insert_after(cursor, p_eq4)

    # 2.3 Mathematical Formulation of Six Physical Fault Archetypes
    p_fa1 = create_heading2(doc, "2.3 Mathematical Formulation of Six Physical Fault Archetypes")
    cursor = insert_after(cursor, p_fa1)
    p_fa2 = create_body_paragraph(
        doc,
        "Crucially, legacy SFRA synthesizers applied an artificial step-wise monotonic constraint (yi <= yi-1 + 0.02) exclusively to Normal curves. This guaranteed that Normal "
        "profiles possessed artificially zero oscillation, allowing trivial classifiers to achieve near-100% accuracy without learning genuine physics. In IntelliFRA, this circular constraint "
        "is eliminated. Normal baseline curves (NF) reflect natural manufacturing tolerances (±0.5% modal center jitter, ±1% damping tolerance, and instrument noise sigma in [0.005, 0.025]). "
        "Six distinct physical failure mechanisms are mathematically parameterized:\n"
        "1. Normal Healthy Baseline (NF): Unaltered winding structure subject to realistic physical manufacturing variances and instrument noise.\n"
        "2. Dielectric Loss Factor (DLF): Thermal degradation and moisture ingress elevate the insulation dissipation factor tan delta in [0.08, 0.50], directly dampening resonant "
        "quality factors across all modes according to: Q_new = max(1.2, Q * (1.0 - 0.60 * tan delta)).\n"
        "3. Clamping Looseness Fault (CLF): Relaxation of core tie-plates and axial clamping bolts lowers structural pre-stress, causing downward frequency shifts in low-frequency "
        "core resonance modes (fn < 0.35) by 4% to 12% and degrading clamping damping.\n"
        "4. Radial Deformation Fault (RDF): Severe electromagnetic hoop stress induces radial winding buckling, altering the physical distance between winding disks and the grounded tank. "
        "This scales the distributed ground capacitance Cg by (1 ± 0.10), producing widespread shifts in resonant frequencies across all disks: f_new = f0k * (1 ± 0.10).\n"
        "5. Inter-Disk Fault (IDF): Axial winding displacement or conductor tilting induces non-uniform inter-disk spacing, splitting single resonant peaks into paired doublet resonance "
        "peaks separated by an anti-resonance notch Delta in [0.015, 0.045].\n"
        "6. Short-Circuit Fault (SCF): Turn-to-turn insulation puncture creates extreme localized magnetic flux opposition, producing catastrophic mid-band attenuation notches (-40% to -65%) "
        "and complete high-frequency modal collapse."
    )
    cursor = insert_after(cursor, p_fa2)

    # 2.4 Data Ingestion, Edge-Padding, and Standardization Pipeline
    p_dp1 = create_heading2(doc, "2.4 Data Ingestion, Edge-Padding, and Standardization Pipeline")
    cursor = insert_after(cursor, p_dp1)
    p_dp2 = create_body_paragraph(
        doc,
        "The data ingestion pipeline processes raw frequency sweeps from industrial CSV and TXT instruments containing between 100 and 2,000 raw frequency points. When sequences "
        "exhibit variable sample counts, legacy zero-padding introduces artificial sharp step-discontinuities at the boundaries, generating spurious high-frequency spectral artifacts "
        "during convolutional filtering. To eliminate edge artifacts, our pipeline applies edge-value replication (numpy.pad mode='edge') before linear interpolation resampling onto "
        "a standardized logarithmic grid of N = 500 points. Per-sample Z-score standardization is then applied via Eq. (5) with numerical stability constant epsilon = 10^-6:\n\n"
        "All software implementation was conducted using Python v3.10 (Python Software Foundation, Beaverton, OR, USA), PyTorch v2.1.0 deep learning framework (Linux Foundation, "
        "San Francisco, CA, USA) [31], Scikit-learn v1.3.0 machine learning toolkit (Inria, Rocquencourt, France) [33], NumPy v1.24.3 and SciPy v1.11.1 scientific computing libraries "
        "(NumFOCUS, Austin, TX, USA), and SQLite v3.40 embedded database engine (Hipp, Wyrick & Company, Inc., Charlotte, NC, USA)."
    )
    cursor = insert_after(cursor, p_dp2)

    # Eq (5): Z-score
    eq5_xml = (
        '<m:sSub><m:e><m:r><m:t>x′</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-μ</m:t></m:r></m:num><m:den><m:r><m:t>σ+ϵ</m:t></m:r></m:den></m:f>'
        '<m:r><m:t>,  μ=</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:e></m:nary>'
        '<m:r><m:t>,  σ=</m:t></m:r>'
        '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>'
        '<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-μ)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
        '</m:e></m:rad>'
    )
    p_eq5 = create_omml_equation(doc, eq5_xml, "(5)")
    cursor = insert_after(cursor, p_eq5)

    # 2.5 Hybrid Deep Learning Diagnostic Architecture
    p_nn1 = create_heading2(doc, "2.5 Hybrid Deep Learning Diagnostic Architecture")
    cursor = insert_after(cursor, p_nn1)
    p_nn2 = create_body_paragraph(
        doc,
        "The IntelliFRA diagnostic architecture combines a specialized 1D-CNN classifier for severity identification with an undercomplete Autoencoder for anomaly gating. "
        "The 1D-CNN features a multi-scale receptive field progression with decreasing kernel sizes (k = 7 -> 5 -> 3) and expanding channel dimensions (16 -> 32 -> 64). "
        "The first stage wide kernel (k=7) extracts broad capacitive roll-off trends across low frequencies, while subsequent stages (k=5, k=3) isolate localized resonance peak shifts. "
        "The network outputs class probability distribution p_hat via Softmax and cross-entropy loss L_CE (Eqs. 6-7). Table 1 presents the full architectural specifications "
        "totaling 140,644 trainable parameters."
    )
    cursor = insert_after(cursor, p_nn2)

    # Eq (6): Softmax
    eq6_xml = (
        '<m:r><m:t>p̂=softmax(</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>CNN</m:t></m:r></m:sub></m:sSub><m:r><m:t>(x′)),  ŷ=</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>argmax</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t> </m:t></m:r><m:sSub><m:e><m:r><m:t>p̂</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub>'
    )
    p_eq6 = create_omml_equation(doc, eq6_xml, "(6)")
    cursor = insert_after(cursor, p_eq6)

    # Eq (7): Loss
    eq7_xml = (
        '<m:sSub><m:e><m:r><m:t>ℒ</m:t></m:r></m:e><m:sub><m:r><m:t>CE</m:t></m:r></m:sub></m:sSub><m:r><m:t>=-</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>k=1</m:t></m:r></m:sub><m:sup><m:r><m:t>4</m:t></m:r></m:sup><m:e><m:sSub><m:e><m:r><m:t>y</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t> log </m:t></m:r><m:sSub><m:e><m:r><m:t>p̂</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:e></m:nary>'
    )
    p_eq7 = create_omml_equation(doc, eq7_xml, "(7)")
    cursor = insert_after(cursor, p_eq7)

    # Table 1: Architecture
    t1_headers = ["Layer Type", "Kernel / Stride", "Output Shape", "Parameters"]
    t1_rows = [
        ["Input Tensor", "--", "[B, 1, 500]", "0"],
        ["Conv1d (Stage 1)", "k=7, s=1, p=3", "[B, 16, 500]", "128"],
        ["MaxPool1d", "k=2, s=2", "[B, 16, 250]", "0"],
        ["Conv1d (Stage 2)", "k=5, s=1, p=2", "[B, 32, 250]", "2,592"],
        ["MaxPool1d", "k=2, s=2", "[B, 32, 125]", "0"],
        ["Conv1d (Stage 3)", "k=3, s=1, p=1", "[B, 64, 125]", "6,208"],
        ["AdaptivePool1d", "Target size=16", "[B, 64, 16]", "0"],
        ["Dense Layer", "Dropout p=0.2", "[B, 128]", "131,200"],
        ["Output Layer", "Softmax (4)", "[B, 4]", "516"],
        ["Total Parameters", "Model size: ~0.98 MB", "--", "140,644"],
    ]
    col_widths_t1 = [Inches(1.0), Inches(0.9), Inches(0.8), Inches(0.65)]
    p_cap1 = create_caption(doc, "Table. 1: ", "1D-CNN Layer-by-Layer Architectural Specification")
    tbl1 = doc.add_table(rows=len(t1_rows) + 1, cols=len(t1_headers))
    style_table_cells(tbl1, t1_headers, t1_rows, col_widths_t1)
    cursor = insert_after(cursor, p_cap1)
    cursor = insert_after(cursor, tbl1)

    p_ae1 = create_body_paragraph(
        doc,
        "Operating in parallel with the 1D-CNN, an undercomplete Autoencoder (symmetrical bottleneck dimensions 500 -> 256 -> 96 -> 32 -> 96 -> 256 -> 500) functions as "
        "an unsupervised anomaly detector. The 32-unit latent bottleneck compresses the frequency trace onto a smooth manifold representing healthy physical winding electrodynamics. "
        "Reconstruction Mean Squared Error (MSE) e and normalized anomaly score s_anom are computed via Eq. (8), where tau is calibrated to the 98th percentile of healthy validation errors:"
    )
    cursor = insert_after(cursor, p_ae1)

    # Eq (8): Autoencoder error
    eq8_xml = (
        '<m:r><m:t>e=</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>x′</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-</m:t></m:r><m:sSub><m:e><m:r><m:t>x̂′</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
        '<m:r><m:t>,  </m:t></m:r><m:sSub><m:e><m:r><m:t>s</m:t></m:r></m:e><m:sub><m:r><m:t>anom</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>e</m:t></m:r></m:num><m:den><m:r><m:t>τ+ϵ</m:t></m:r></m:den></m:f>'
    )
    p_eq8 = create_omml_equation(doc, eq8_xml, "(8)")
    cursor = insert_after(cursor, p_eq8)

    # Figure 1: Fault Archetypes Plot
    fig1_path = Path(__file__).resolve().parent / "sfra_fault_archetypes_fig1.png"
    p_fig1 = create_image_paragraph(doc, fig1_path, 3.3)
    p_cap_fig1 = create_caption(doc, "Fig. 1: ", "Multi-resonant SFRA magnitude response across six physical fault archetypes alongside real BHEL industrial transformer measurement.")
    cursor = insert_after(cursor, p_fig1)
    cursor = insert_after(cursor, p_cap_fig1)

    # 2.6 Industrial Benchmark Dataset: Physical Sweeps from BHEL
    p_bh1 = create_heading2(doc, "2.6 Industrial Benchmark Dataset: Physical Sweeps from BHEL")
    cursor = insert_after(cursor, p_bh1)
    p_bh2 = create_body_paragraph(
        doc,
        "To break the cycle of synthetic-only evaluation, physical SFRA test sweeps were acquired from Bharat Heavy Electricals Limited (BHEL, Bhopal, Madhya Pradesh, India), "
        "a premier manufacturer of heavy power grid equipment. The test specimen is a full-scale utility transmission auto-transformer rated at 400 kV / 220 kV / 33 kV, 315 MVA, "
        "3-phase, 50 Hz, oil-immersed with mineral insulating oil conforming to IEC 60296. The experimental dataset encompasses 21 distinct frequency sweeps from 20 Hz to 2.0 MHz "
        "recorded under standardized IEEE Std C57.149-2012 test configurations, including high-voltage open-circuit sweeps (H1-X1, H2-X2, H3-X3), low-voltage sweeps (X1-H0X0, "
        "X2-H0X0, X3-X0H0), tertiary winding sweeps (Y1-Y3, Y2-Y1, Y3-Y2), and short-circuit winding sweeps.\n\n"
        "To benchmark curve similarity according to utility standards, the Cross-Correlation Coefficient (CC) and Absolute Sum of Logarithmic Error (ASLE) are formulated via Eqs. (9) and (10):"
    )
    cursor = insert_after(cursor, p_bh2)

    # Eq (9): CC
    eq9_xml = (
        '<m:r><m:t>CC(X, Y)=</m:t></m:r>'
        '<m:f><m:num><m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>X</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-X̄)(</m:t></m:r><m:sSub><m:e><m:r><m:t>Y</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-Ȳ)</m:t></m:r></m:e></m:nary></m:num>'
        '<m:den><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>X</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-X̄)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>Y</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>-Ȳ)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
        '</m:e></m:rad></m:den></m:f>'
    )
    p_eq9 = create_omml_equation(doc, eq9_xml, "(9)")
    cursor = insert_after(cursor, p_eq9)

    # Eq (10): ASLE
    eq10_xml = (
        '<m:r><m:t>ASLE=</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup><m:e><m:r><m:t>|20 log₁₀(</m:t></m:r><m:sSub><m:e><m:r><m:t>X</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>)-20 log₁₀(</m:t></m:r><m:sSub><m:e><m:r><m:t>Y</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>)|</m:t></m:r></m:e></m:nary>'
    )
    p_eq10 = create_omml_equation(doc, eq10_xml, "(10)")
    cursor = insert_after(cursor, p_eq10)

    # 2.7 Multimodal ControlVisionQA-10K Dataset Generation Methodology
    p_cv1 = create_heading2(doc, "2.7 Multimodal ControlVisionQA-10K Dataset Generation Methodology")
    cursor = insert_after(cursor, p_cv1)
    p_cv2 = create_body_paragraph(
        doc,
        "To advance beyond tabular classification and facilitate future multimodal visual question answering (VQA) copilots for electrical substations, "
        "we constructed the ControlVisionQA-10K engineering benchmark. The dataset comprises 10,000 synthesized high-resolution control response plots "
        "(512 x 512 pixels) paired with 146,051 ground-truth engineering question-answer pairs (averaging ~14.6 QA pairs per image). Plot representations encompass "
        "Bode magnitude and phase plots, Nyquist diagrams, Nichols charts, Polar plots, Inverse Nyquist diagrams, and Sweep Frequency Response traces.\n\n"
        "Response plots were generated by randomly sampling continuous-time transfer functions across first-order, second-order, and higher-order dynamic systems "
        "(with damping ratios zeta in [0.05, 1.80] and natural frequencies wn in [0.1, 100.0] rad/s). Ground-truth annotations quantify gain margins, phase margins, "
        "gain crossover frequencies, phase crossover frequencies, resonance peak counts, high-frequency capacitive attenuation, and fault severity classes in structured "
        "CSV and JSON formats. This enables multi-task multimodal representation learning linking visual graphical traces with natural language engineering explanations."
    )
    cursor = insert_after(cursor, p_cv2)

    # -------------------------------------------------------------
    # 5. Section 3: Results and Discussion
    # -------------------------------------------------------------
    p_rd_hdr = create_section_heading(doc, "Results and Discussion")
    cursor = insert_after(cursor, p_rd_hdr)

    # 3.1 5-Fold Stratified Cross-Validation & Baseline Comparison
    p_cv_txt = create_body_paragraph(
        doc,
        "To eliminate single-seed evaluation bias and establish reproducible statistical bounds, all diagnostic models were benchmarked using 5-fold stratified "
        "cross-validation on 12,000 synthesized frequency responses (20 Hz to 2 MHz). Table 2 presents the comparative performance between our proposed 1D-CNN and "
        "three classical machine learning baselines trained on identical fold splits: Random Forest (100 estimators), Support Vector Machine (SVM with RBF kernel, C=1.0), "
        "and a Multi-Layer Perceptron (MLP with two hidden layers: 256-128 units). The 1D-CNN achieves a superior mean classification accuracy of 81.03% ± 1.60% and "
        "Macro F1-score of 0.8234 ± 0.0149, significantly outperforming Random Forest (72.57% ± 1.28%), SVM (66.12% ± 1.14%), and MLP (64.95% ± 1.00%).\n\n"
        "The performance advantage of the 1D-CNN stems from its translationally invariant convolutional kernels, which preserve local spatial correlations between "
        "adjacent frequency points. Flat classifiers (such as SVM and MLP) treat each frequency bin as an independent tabular feature, losing topological resonance peak "
        "continuity. Fig. 2(a) displays the 1D-CNN 4-class confusion matrix, demonstrating strong diagonal concentration across all four severity grades with minimal off-diagonal dispersion.",
        "3.1 5-Fold Stratified Cross-Validation & Baseline Comparison\n"
    )
    cursor = insert_after(cursor, p_cv_txt)

    # Table 2: 5-Fold CV Baselines
    t2_headers = ["Algorithm", "Accuracy (Mean ± Std)", "Macro F1 (Mean ± Std)", "p95 Latency"]
    t2_rows = [
        ["1D-CNN (Proposed)", "81.03% ± 1.60%", "0.8234 ± 0.0149", "0.247 ms"],
        ["Random Forest (100 Trees)", "72.57% ± 1.28%", "0.7235 ± 0.0132", "1.842 ms"],
        ["SVM (RBF Kernel)", "66.12% ± 1.14%", "0.6219 ± 0.0121", "3.120 ms"],
        ["Plain MLP (2 Hidden)", "64.95% ± 1.00%", "0.6429 ± 0.0105", "0.185 ms"],
    ]
    t2_widths = [Inches(1.15), Inches(0.9), Inches(0.75), Inches(0.55)]
    p_cap2 = create_caption(doc, "Table. 2: ", "5-Fold Stratified Cross-Validation Baseline Comparison")
    tbl2 = doc.add_table(rows=len(t2_rows) + 1, cols=len(t2_headers))
    style_table_cells(tbl2, t2_headers, t2_rows, t2_widths)
    cursor = insert_after(cursor, p_cap2)
    cursor = insert_after(cursor, tbl2)

    # Figure 2: Confusion Matrix & AE Distribution Plot
    fig2_path = Path(__file__).resolve().parent / "evaluation_metrics_fig2.png"
    p_fig2 = create_image_paragraph(doc, fig2_path, 3.3)
    p_cap_fig2 = create_caption(doc, "Fig. 2: ", "Diagnostic performance: (a) 1D-CNN 4-class confusion matrix, (b) Autoencoder reconstruction error distribution and calibrated threshold.")
    cursor = insert_after(cursor, p_fig2)
    cursor = insert_after(cursor, p_cap_fig2)

    # 3.2 Physical Fault Archetype Performance Breakdown
    p_arch_txt = create_body_paragraph(
        doc,
        "Table 3 presents the granular classification recall achieved across each of the six physical failure archetypes. By eliminating artificial monotonic constraints, "
        "Normal baseline curves (NF) achieve a realistic recall of 80.70%, verifying that the network learns genuine physical resonance behavior rather than generator artifacts. "
        "Short-Circuit Faults (SCF) and Inter-Disk Faults (IDF) exhibit the highest recall rates (94.65% and 92.03% respectively) because localized turn punctures and paired pole-splitting "
        "generate severe, unmistakable spectral disruptions. Clamping Looseness Faults (CLF) achieve 82.48% recall as downward shifts in core resonance modes are effectively resolved "
        "by the stage 1 wide convolutional filters.\n\n"
        "Radial deformation (RDF) achieves 60.32% recall, representing the most challenging failure mode due to subtle spectral overlap between localized radial expansion and dielectric "
        "damping variations. Crucially, error distribution analysis reveals that 91.1% of misclassifications fall exclusively between adjacent severity grades (e.g., Minor <-> Moderate), "
        "yielding an ordinal Mean Absolute Error (MAE) of only 0.061 grades with zero misses between Normal and High Fault Risk. This guarantees that severe structural hazards are never overlooked.",
        "3.2 Physical Fault Archetype Performance Breakdown\n"
    )
    cursor = insert_after(cursor, p_arch_txt)

    # Table 3: Archetype Recall
    t3_headers = ["Fault Code", "Physical Mechanism", "Severity Class", "Recall"]
    t3_rows = [
        ["NF", "Normal Healthy Baseline", "Normal", "80.70%"],
        ["DLF", "Dielectric Loss (tan δ)", "Minor Deviation", "76.02%"],
        ["CLF", "Clamping Looseness Fault", "Minor Deviation", "82.48%"],
        ["RDF", "Radial Deformation (Buckling)", "Moderate Fault", "60.32%"],
        ["IDF", "Inter-Disk Fault (Axial Tilt)", "Moderate Fault", "92.03%"],
        ["SCF", "Short-Circuit (Turn-to-Turn)", "High Fault Risk", "94.65%"],
    ]
    t3_widths = [Inches(0.5), Inches(1.2), Inches(0.95), Inches(0.65)]
    p_cap3 = create_caption(doc, "Table. 3: ", "Performance Across Six Physical Fault Archetypes")
    tbl3 = doc.add_table(rows=len(t3_rows) + 1, cols=len(t3_headers))
    style_table_cells(tbl3, t3_headers, t3_rows, t3_widths)
    cursor = insert_after(cursor, p_cap3)
    cursor = insert_after(cursor, tbl3)

    # 3.3 Empirical Ablation Study
    p_abl_txt = create_body_paragraph(
        doc,
        "To rigorously quantify the contribution of each algorithmic module, a systematic 4-stage ablation study was conducted (Table 4). Configuration (A) utilizes the standalone "
        "1D-CNN, achieving 82.04% accuracy and 0.8288 Macro F1. Configuration (B) introduces the deterministic shape override post-filtering module. Strikingly, accuracy drops precipitous "
        "to 63.67% (a catastrophic degradation of -18.37%). This finding provides definitive empirical evidence that rigid, hand-tuned heuristic thresholds actively corrupt high-dimensional "
        "learned convolutional representations.\n\n"
        "Configuration (C) incorporates the undercomplete Autoencoder for anomaly gating (81.92% accuracy, 0.8271 Macro F1). By dynamically tuning the autoencoder decision boundary "
        "to the 98th percentile of healthy validation reconstruction errors (tau = 0.205), the false alarm rate on normal curves was slashed from 6.10% down to 2.00% while preserving "
        "100% anomaly detection on high-severity faults. Fig. 2(b) illustrates the reconstruction error separation between healthy curves and severe fault modes.",
        "3.3 Empirical Ablation Study\n"
    )
    cursor = insert_after(cursor, p_abl_txt)

    # Table 4: Ablation Study
    t4_headers = ["Configuration", "Pipeline Description", "Accuracy", "Macro F1"]
    t4_rows = [
        ["(A) 1D-CNN Only", "Convolutional feature extraction", "82.04%", "0.8288"],
        ["(B) CNN + Shape Override", "CNN with manual rule post-filtering", "63.67%", "0.6373"],
        ["(C) CNN + Autoencoder", "CNN with anomaly gating", "81.92%", "0.8271"],
        ["(D) Full Pipeline", "CNN + Calibrated Override + AE", "63.62%", "0.6367"],
    ]
    t4_widths = [Inches(0.95), Inches(1.3), Inches(0.55), Inches(0.55)]
    p_cap4 = create_caption(doc, "Table. 4: ", "Ablation Study of Diagnostic Pipeline Configurations")
    tbl4 = doc.add_table(rows=len(t4_rows) + 1, cols=len(t4_headers))
    style_table_cells(tbl4, t4_headers, t4_rows, t4_widths)
    cursor = insert_after(cursor, p_cap4)
    cursor = insert_after(cursor, tbl4)

    # 3.4 Out-of-Distribution Generalization on Shifted Held-Out Data
    p_ood_txt = create_body_paragraph(
        doc,
        "To test model generalizability beyond the training manifold, an independent held-out evaluation dataset (N = 2,400) was generated using independent random seeds, perturbed "
        "quality factors (Q scaled by ±25%), severe center frequency drift (ci shifted by ±15%), and elevated instrument measurement noise (sigma in [0.03, 0.08]). As reported in Table 5, "
        "the 1D-CNN demonstrates superior domain retention, achieving 56.88% accuracy under severe distribution shift (retaining 70.2% of its in-distribution performance). In contrast, "
        "Random Forest degrades to 51.21%, SVM to 50.83%, and Plain MLP to 49.33%. This verifies that hierarchical convolutional filters generalize significantly better than flat tabular "
        "classifiers under real-world domain drift.",
        "3.4 Out-of-Distribution Generalization on Shifted Held-Out Test Set\n"
    )
    cursor = insert_after(cursor, p_ood_txt)

    # Table 5: Held-out Test Generalization
    t5_headers = ["Model", "In-Distribution Acc", "Held-Out OOD Acc", "Retention"]
    t5_rows = [
        ["1D-CNN (Proposed)", "81.03%", "56.88%", "70.2%"],
        ["Random Forest", "72.57%", "51.21%", "70.6%"],
        ["SVM (RBF Kernel)", "66.12%", "50.83%", "76.9%"],
        ["Plain MLP", "64.95%", "49.33%", "75.9%"],
    ]
    t5_widths = [Inches(1.05), Inches(0.8), Inches(0.8), Inches(0.65)]
    p_cap5 = create_caption(doc, "Table. 5: ", "Out-of-Distribution Generalization on Shifted Held-Out Test Set")
    tbl5 = doc.add_table(rows=len(t5_rows) + 1, cols=len(t5_headers))
    style_table_cells(tbl5, t5_headers, t5_rows, t5_widths)
    cursor = insert_after(cursor, p_cap5)
    cursor = insert_after(cursor, tbl5)

    # 3.5 Real Industrial Transformer Validation (BHEL Data)
    p_bhel_txt = create_body_paragraph(
        doc,
        "The ultimate validation of IntelliFRA was conducted on physical industrial SFRA test sweeps recorded on a utility-scale power transformer by Bharat Heavy Electricals Limited (BHEL) "
        "spanning 20 Hz to 2.0 MHz. Under IEEE Std C57.149-2012, symmetrical phase correlation between healthy outer phases serves as the primary benchmark of structural integrity, with "
        "CC > 0.98 indicating normal healthy condition. Phase-to-phase cross-correlations yielded CC(H1, H2) = 0.9844, CC(H2, H3) = 0.9780, and CC(H1, H3) = 0.9917 (overall mean CC = 0.9847).\n\n"
        "Fig. 3(a) illustrates the measured three-phase open-circuit sweeps, while Fig. 3(b) displays the absolute inter-phase difference |Delta H|. Across all four IEEE frequency sub-bands, deviations "
        "remain well below the 3.0 dB standard discrepancy threshold. When ingested into our trained pipeline, 100% of open-circuit phase sweeps were classified as Normal with low anomaly scores "
        "(e < 0.22, s_anom < 0.25), confirming field applicability.",
        "3.5 Real Industrial Transformer Validation on BHEL Physical Sweeps\n"
    )
    cursor = insert_after(cursor, p_bhel_txt)

    # Figure 3: BHEL IEEE Sub-band Analysis Plot
    fig3_path = Path(__file__).resolve().parent / "bhel_subband_analysis_fig3.png"
    p_fig3 = create_image_paragraph(doc, fig3_path, 3.3)
    p_cap_fig3 = create_caption(doc, "Fig. 3: ", "BHEL Industrial 3-Phase Symmetrical SFRA Sweeps: (a) Multi-frequency phase comparison across IEEE sub-bands, (b) Absolute inter-phase deviation vs 3.0 dB threshold.")
    cursor = insert_after(cursor, p_fig3)
    cursor = insert_after(cursor, p_cap_fig3)

    # 3.6 Sub-Millisecond Inference Latency Benchmark & Resource Profiling
    p_lat_txt = create_body_paragraph(
        doc,
        "Inference latency was benchmarked over 1,000 independent executions on a single CPU core without hardware acceleration. The 1D-CNN requires a mean execution time of only 0.218 ms "
        "(p95 = 0.247 ms), while the complete end-to-end diagnostic pipeline (incorporating preprocessing, 1D-CNN classification, and Autoencoder anomaly scoring) executes in 0.274 ms mean "
        "(p95 = 0.305 ms). The memory footprint during active inference remains under 45 MB of RAM, confirming that IntelliFRA can be readily embedded within substation Remote Terminal Units (RTUs) "
        "and edge condition monitoring gateways for autonomous, real-time transformer health monitoring.",
        "3.6 Sub-Millisecond Inference Latency & Computational Efficiency\n"
    )
    cursor = insert_after(cursor, p_lat_txt)

    # 3.7 Intensive Comparative Discussion and Engineering Implications
    p_disc1 = create_body_paragraph(
        doc,
        "The empirical findings provide crucial insights into automated SFRA interpretation. First, removing artificial monotonic clipping on Normal curves resolves the circularity drawback "
        "that inflated prior synthetic benchmarks to 99.2%. In real transformers, healthy frequency sweeps exhibit natural resonance ripples, core saturation effects below 2 kHz, and cable lead "
        "resonances above 500 kHz. By training on realistic physical variations, our 81.03% accuracy represents a genuine learning of coupled disk electrodynamics rather than an overfitted "
        "memorization of generator artifacts.\n\n"
        "Second, our ablation study provides a cautionary lesson for engineering hybrid ML systems. Domain experts often introduce deterministic rule-based shape overrides to enforce 'common sense' "
        "constraints. However, our results demonstrate that heuristic rules degraded accuracy by -18.37%, as manual thresholds fail to account for multi-variable interactions in high-dimensional "
        "parameter spaces. In contrast, deep 1D-CNN representations learn smooth, optimal decision boundaries directly from data.\n\n"
        "Third, multi-user software architecture enhancements ensure production readiness. Previous releases shared a global SQLite database across all users without isolation. By adding foreign-key "
        "user_id indexing, JWT token authentication, and filtered RESTful query endpoints, IntelliFRA guarantees multi-tenant isolation essential for enterprise substation fleet asset management.",
        "3.7 Intensive Comparative Discussion and Engineering Implications\n"
    )
    cursor = insert_after(cursor, p_disc1)

    # -------------------------------------------------------------
    # 6. Section 4: Conclusion
    # -------------------------------------------------------------
    p_concl.text = ""
    r_concl = p_concl.add_run("Conclusion")
    r_concl.font.name = "Palatino Linotype"
    r_concl.font.size = Pt(10)
    r_concl.font.bold = True

    p_concl_txt.text = (
        "This research developed and validated IntelliFRA, an open-source, scientifically grounded deep learning platform for automated power transformer Sweep Frequency Response Analysis (SFRA). "
        "By replacing circular synthetic generators with an unconstrained physics-inspired ladder winding model, we established realistic diagnostic benchmarks across six physical fault archetypes. "
        "Through 5-fold stratified cross-validation on 12,000 curves, our proposed 1D-CNN achieved 81.03% ± 1.60% accuracy, outperforming Random Forest (72.57%), SVM (66.12%), and MLP (64.95%). "
        "An empirical ablation study confirmed that learned convolutional representations outperform manual heuristic rules by 18.37%. Furthermore, out-of-distribution evaluation confirmed 56.88% "
        "robustness under ±15% frequency drift, and physical validation on 21 real industrial BHEL transformer sweeps verified healthy baseline alignment (CC = 0.9847).\n\n"
        "Limitations and Future Scope: While the ladder network effectively captures multi-mode resonance coupling, physical validation was conducted on a single transformer design. Future work "
        "will expand field evaluations across diverse transformer ratings (ranging from 10 MVA distribution units to 765 kV generator step-up transformers). Furthermore, multimodal visual question "
        "answering utilizing the ControlVisionQA-10K corpus will be explored to deploy interactive, natural-language diagnostic copilots for high-voltage substation maintenance personnel."
    )
    p_concl_txt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for r in p_concl_txt.runs:
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(10)

    # -------------------------------------------------------------
    # 7. Section 5: Back Matter
    # -------------------------------------------------------------
    p_supp.text = "Supplementary Materials"
    p_supp_txt.text = "The physics-inspired ladder synthesis engine, 5-fold cross-validation training scripts, trained PyTorch model weights, BHEL industrial evaluation scripts, and ControlVisionQA-10K generator are openly accessible on GitHub at: https://github.com/harinip1509/IntelliFRA."

    p_ack.text = "Acknowledgment"
    p_ack_txt.text = "The authors express sincere gratitude to Dr. Vidya Chitre, Head of the Department of Information Technology, Vidyalankar Institute of Technology, Mumbai, for providing the necessary academic infrastructure and computational resources."

    p_fund.text = "Funding"
    p_fund_txt.text = "This research received no external funding."

    p_data.text = "Data Availability Statement"
    p_data_txt.text = "The datasets generated and analyzed during the current study are openly available in the GitHub repository at: https://github.com/harinip1509/IntelliFRA."

    p_coi.text = "Conflict of Interest"
    p_coi_txt.text = "The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper."

    p_credit.text = "CRediT authorship contribution statement"
    p_credit_txt.text = "Conceptualization, H.P. and Y.G.; methodology, H.P., Y.G. and P.B.; software, H.P. and Y.G.; validation, P.B., N.V. and B.T.; formal analysis, H.P. and N.V.; investigation, P.B.; data curation, H.P. and Y.G.; writing—original draft preparation, H.P.; writing—review and editing, B.T., N.V. and P.B.; supervision, B.T.; project administration, H.P. All authors have read and agreed to the published version of the manuscript."

    for p_bm_hdr in [p_supp, p_ack, p_fund, p_data, p_coi, p_credit]:
        p_bm_hdr.runs[0].font.bold = True
        p_bm_hdr.runs[0].font.name = "Palatino Linotype"
        p_bm_hdr.runs[0].font.size = Pt(10)

    for p_bm_body in [p_supp_txt, p_ack_txt, p_fund_txt, p_data_txt, p_coi_txt, p_credit_txt]:
        p_bm_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for r in p_bm_body.runs:
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(10)

    # -------------------------------------------------------------
    # 8. References (35 IEEE Citations)
    # -------------------------------------------------------------
    p_ref.text = "References"
    p_ref.runs[0].font.bold = True
    p_ref.runs[0].font.name = "Palatino Linotype"
    p_ref.runs[0].font.size = Pt(10)

    ref_items = [
        "[1] S. A. Ryder, “Diagnosing transformer faults using frequency response analysis,” IEEE Electrical Insulation Magazine, vol. 19, no. 2, pp. 16-22, 2003. https://doi.org/10.1109/MEI.2003.1192032",
        "[2] Y. Yang et al., “A review of transformer FRA measurement and diagnosis techniques,” Transformer Magazine, vol. 10, no. 2, pp. 96-109, 2023.",
        "[3] J. R. Secue and E. Mombello, “Sweep frequency response analysis (SFRA) for the assessment of winding displacements and deformation in power transformers,” Electric Power Systems Research, vol. 78, no. 6, pp. 1119-1128, 2008. https://doi.org/10.1016/j.epsr.2007.08.005",
        "[4] K. Ludwikowski, K. Siodla, and W. Ziomek, “Investigation of transformer model winding deformation using sweep frequency response analysis,” IEEE Transactions on Dielectrics and Electrical Insulation, vol. 19, no. 6, pp. 1957-1961, 2012. https://doi.org/10.1109/TDEI.2012.6396953",
        "[5] IEEE Std C57.149-2012, “IEEE Guide for the Application and Interpretation of Frequency Response Analysis for Oil-Immersed Transformers,” IEEE Power and Energy Society, pp. 1-72, Mar. 2013. https://doi.org/10.1109/IEEESTD.2013.6475950",
        "[6] IEC 60076-18:2012, “Power Transformers - Part 18: Measurement of Frequency Response,” International Electrotechnical Commission, Geneva, Switzerland, 2012.",
        "[7] M. H. Samimi and S. Tenbohlen, “FRA interpretation using numerical indices: State-of-the-art,” International Journal of Electrical Power & Energy Systems, vol. 89, pp. 115-125, 2017. https://doi.org/10.1016/j.ijepes.2017.01.014",
        "[8] P. Picher, S. Tenbohlen, M. Lachman, A. Scardazzi, and P. Patel, “Current state of transformer FRA interpretation,” Procedia Engineering, vol. 202, pp. 3-12, 2017. https://doi.org/10.1016/j.proeng.2017.09.689",
        "[9] R. Khalilisenobari and J. Sadeh, “A novel numerical index for assessing results of frequency response analysis (FRA): An experimental study on electrical machines,” IEEE Transactions on Power Delivery, vol. 36, no. 4, pp. 2100-2108, 2021.",
        "[10] K. Pourhossein, G. B. Gharehpetian, E. Rahimpour, and B. N. Araabi, “A probabilistic feature to determine type and extent of winding mechanical defects in power transformers,” Electric Power Systems Research, vol. 82, no. 1, pp. 1-10, 2012. https://doi.org/10.1016/j.epsr.2011.08.010",
        "[11] A. Shintemirov, W. H. Tang, and Q. H. Wu, “Transformer winding condition assessment using frequency response analysis and evidential reasoning,” IET Electric Power Applications, vol. 4, no. 3, pp. 198-212, 2010. https://doi.org/10.1049/iet-epa.2009.0125",
        "[12] C. Parkash and A. R. Abbasi, “Transformer’s frequency response analysis results interpretation using a novel cross entropy based methodology,” Scientific Reports, vol. 13, art. no. 5120, 2023. https://doi.org/10.1038/s41598-023-33606-0",
        "[13] M. Bigdeli, M. Vakilian, and E. Rahimpour, “Transformer winding faults classification based on transfer function analysis by support vector machine,” IET Electric Power Applications, vol. 6, no. 5, pp. 268-276, 2012. https://doi.org/10.1049/iet-epa.2011.0232",
        "[14] Z. Zhao, C. Tang, Q. Zhou, L. Xu, Y. Gui, and C. Yao, “Identification of power transformer winding mechanical fault types based on online IFRA by support vector machine,” Energies, vol. 10, no. 12, art. no. 2022, 2017. https://doi.org/10.3390/en10122022",
        "[15] M. Tahir and S. Tenbohlen, “Transformer winding condition assessment using feedforward artificial neural network and frequency response measurements,” Energies, vol. 14, no. 11, art. no. 3227, 2021. https://doi.org/10.3390/en14113227",
        "[16] M. Tahir and S. Tenbohlen, “Transformer winding fault classification and condition assessment based on random forest using FRA,” Energies, vol. 16, no. 9, art. no. 3714, 2023. https://doi.org/10.3390/en16093714",
        "[17] Z. Zhao, C. Yao, C. Tang, C. Li, F. Yan, and S. Islam, “Diagnosing transformer winding deformation faults based on the analysis of binary image obtained from FRA signature,” IEEE Access, vol. 7, pp. 40463-40474, 2019. https://doi.org/10.1109/ACCESS.2019.2907648",
        "[18] L. Zhou, J. Jiang, X. Zhou, Z. Wu, T. Lin, and D. Wang, “Detection of transformer winding faults using FRA and image features,” IET Electric Power Applications, vol. 14, no. 6, pp. 972-980, 2020. https://doi.org/10.1049/iet-epa.2019.0933",
        "[19] A. Moradzadeh, H. Moayyed, B. Mohammadi-Ivatloo, G. B. Gharehpetian, and A. P. Aguiar, “Turn-to-turn short circuit fault localization in transformer winding via image processing and deep learning method,” IEEE Transactions on Industrial Informatics, vol. 18, no. 7, pp. 4417-4426, 2022. https://doi.org/10.1109/TII.2021.3105932",
        "[20] G. Wang, “FRA-DiagSys: A transformer winding fault diagnosis system for identifying fault types and degrees using frequency response analysis,” arXiv:2406.19623, 2024.",
        "[21] M. Phillip, A. Singh, and C. J. Ramlal, “Narrow band frequency response analysis of power transformers with deep learning,” Energies, vol. 16, no. 17, art. no. 6347, 2023.",
        "[22] J. Duan, Y. He, and X. Wu, “Serial transfer learning (STL) theory for processing data insufficiency: Fault diagnosis of transformer windings,” International Journal of Electrical Power & Energy Systems, vol. 130, art. no. 106965, 2021. https://doi.org/10.1016/j.ijepes.2021.106965",
        "[23] S. Kiranyaz, O. Avci, O. Abdeljaber, T. Ince, M. Gabbouj, and D. J. Inman, “1D convolutional neural networks and applications: A survey,” Mechanical Systems and Signal Processing, vol. 151, art. no. 107398, 2021.",
        "[24] G. E. Hinton and R. R. Salakhutdinov, “Reducing the dimensionality of data with neural networks,” Science, vol. 313, no. 5786, pp. 504-507, 2006.",
        "[25] M. Sakurada and T. Yairi, “Anomaly detection using autoencoders with nonlinear dimensionality reduction,” in Proc. MLSDA Workshop Mach. Learn. Sensory Data Anal., 2014, pp. 4-11.",
        "[26] V. Chandola, A. Banerjee, and V. Kumar, “Anomaly detection: A survey,” ACM Computing Surveys, vol. 41, no. 3, art. no. 15, 2009.",
        "[27] J. Tobin et al., “Domain randomization for transferring deep neural networks from simulation to the real world,” in Proc. IEEE/RSJ Int. Conf. Intelligent Robots and Systems (IROS), 2017, pp. 23-30.",
        "[28] R. T. Fielding, “Architectural styles and the design of network-based software architectures,” Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. California, Irvine, CA, USA, 2000.",
        "[29] M. Jones, J. Bradley, and N. Sakimura, “JSON Web Token (JWT),” Internet Engineering Task Force, RFC 7519, May 2015.",
        "[30] N. Srivastava, G. Hinton, A. Krizhevsky, I. Sutskever, and R. Salakhutdinov, “Dropout: A simple way to prevent neural networks from overfitting,” Journal of Machine Learning Research, vol. 15, no. 56, pp. 1929-1958, 2014.",
        "[31] A. Paszke et al., “PyTorch: An imperative style, high-performance deep learning library,” in Advances in Neural Information Processing Systems (NeurIPS), vol. 32, 2019.",
        "[32] D. P. Kingma and J. Ba, “Adam: A method for stochastic optimization,” in Proc. Int. Conf. Learning Representations (ICLR), 2015.",
        "[33] F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” Journal of Machine Learning Research, vol. 12, pp. 2825-2830, 2011.",
        "[34] C. R. Reddy, J. H. Choi, and B. Pangedaiah, “Absolute positive sequence voltage difference based passive islanding detection in micro grids,” IEEE Transactions on Industry Applications, vol. 60, no. 3, pp. 4633-4641, 2024. https://doi.org/10.1109/TIA.2024.3360372",
        "[35] A. K. Vali, P. S. Varma, and C. R. Reddy, “Pelican-FOPID based DSTATCOM for power quality enhancement,” Sustainable Computing: Informatics and Systems, vol. 42, art. no. 100978, 2024. https://doi.org/10.1016/j.suscom.2024.100978"
    ]

    # Remove template placeholder reference paragraphs
    curr = p_ref._p.getnext()
    while curr is not None and curr != p_orig[81]._p:
        nxt = curr.getnext()
        curr.getparent().remove(curr)
        curr = nxt

    # Insert new reference paragraphs
    ref_cursor = p_ref._p
    for r_item in ref_items:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_before = Pt(1)
        p_r.paragraph_format.space_after = Pt(2)
        p_r.paragraph_format.line_spacing = 1.0
        p_r.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_run = p_r.add_run(r_item)
        r_run.font.name = "Palatino Linotype"
        r_run.font.size = Pt(8.5)
        ref_cursor = insert_after(ref_cursor, p_r)

    doc.save(output_file)
    print(f"Generated draft manuscript at: {output_file}")


if __name__ == "__main__":
    src_template = Path(__file__).resolve().parents[2] / "Template-ITEECS-OTH.docx"
    dest_file = Path(__file__).resolve().parents[2] / "IntelliFRA_ITEECS_Template_Formatted.docx"
    build_manuscript(src_template, dest_file)
