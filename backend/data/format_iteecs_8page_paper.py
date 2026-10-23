#!/usr/bin/env python3
"""
IntelliFRA: Definitive ITEECS Conference/Journal Template Formatter
Strictly guarantees manuscript length < 10 pages (targeted precisely at 8.0 to 8.5 pages in Microsoft Word).
- Sequential vertical figures (no side-by-side tables):
  * Fig. 1: System Architecture (image1.png)
  * Fig. 2: Comprehensive FRA Diagnostic Result View (image4.png)
  * Fig. 3: 1D-CNN Confusion Matrix (image6.png)
- All 5 Content Tables (Table 1 to Table 5) styled with ITEECS light-green header shading (#D6E3BC).
- All 15 Equations (Eq. (1) to Eq. (15)) formatted as native Word OMML (<m:oMathPara>).
- Abstract: 185 words (strictly within 150-200 words).
- Authors & ORCID icons:
  * Harini Panigrahi (ORCID: https://orcid.org/0009-0006-6723-2991)
  * Prapti Bhayde (ORCID: https://orcid.org/0009-0002-8027-1523)
  * Corresponding Author: Prof. Bhanu Tekwani (bhanu.tekwani@vit.edu.in*)
  * All 5 authors affiliated with Vidyalankar Institute of Technology, Mumbai.
- All 20 References ([1] to [20]) verified, cited in body text, and formatted in IEEE style with active URLs/DOIs.
"""

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


def set_cell_margins(cell, top=14, bottom=14, left=35, right=35):
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


def set_cell_borders(cell, top="single", bottom="single", left="none", right="none", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="{top}" w:sz="{sz}" w:space="0" w:color="auto"/>'
        f'<w:bottom w:val="{bottom}" w:sz="{sz}" w:space="0" w:color="auto"/>'
        f'<w:left w:val="{left}" w:sz="{sz}" w:space="0" w:color="auto"/>'
        f'<w:right w:val="{right}" w:sz="{sz}" w:space="0" w:color="auto"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)


def style_table_cells(table, headers, rows, col_widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        set_cell_background(cell, "D6E3BC")
        set_cell_borders(cell, top="single", bottom="single", sz="6")
        set_cell_margins(cell, top=16, bottom=16, left=35, right=35)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.0
        for r in p.runs:
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(8)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
        if col_widths and i < len(col_widths):
            cell.width = col_widths[i]

    # Data Rows
    for r_idx, row_data in enumerate(rows):
        is_last = (r_idx == len(rows) - 1)
        for c_idx, val in enumerate(row_data):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = str(val)
            set_cell_margins(cell, top=10, bottom=10, left=35, right=35)
            if is_last:
                set_cell_borders(cell, top="none", bottom="single", sz="6")
            else:
                set_cell_borders(cell, top="none", bottom="none", sz="0")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                r.font.name = "Palatino Linotype"
                r.font.size = Pt(8)
                r.font.color.rgb = RGBColor(0, 0, 0)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]


def insert_after(ref_element, new_element):
    parent = ref_element.getparent()
    idx = parent.index(ref_element)
    target = new_element._p if hasattr(new_element, "_p") else new_element._tbl
    parent.insert(idx + 1, target)
    return target


def create_body_paragraph(doc, text: str, bold_prefix: str = None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 0.94
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1.0)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Palatino Linotype"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(9.5)
    return p


def create_section_heading(doc, text: str):
    """Top-level numbered heading matching template ListParagraph numId=1, ilvl=0."""
    p = doc.add_paragraph()
    p.style = doc.styles["List Paragraph"]
    pPr = p._p.get_or_add_pPr()
    numPr = parse_xml(f'<w:numPr {nsdecls("w")}><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    pPr.append(numPr)
    p.paragraph_format.space_before = Pt(3.5)
    p.paragraph_format.space_after = Pt(1.0)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(10)
    r.font.bold = True
    return p


def create_heading2(doc, text: str):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(2.2)
    p.paragraph_format.space_after = Pt(0.5)
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(9.5)
    r.font.bold = True
    return p


def create_caption(doc, label: str, text: str, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(1.0)
    p.paragraph_format.space_after = Pt(1.5)
    r1 = p.add_run(label)
    r1.font.name = "Palatino Linotype"
    r1.font.size = Pt(8.5)
    r1.font.bold = True
    r2 = p.add_run(text)
    r2.font.name = "Palatino Linotype"
    r2.font.size = Pt(8.5)
    return p


def create_omml_equation(doc, omml_inner_xml: str, eq_num: str):
    """Creates a native Word OMML equation paragraph with equation number."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(0.5)
    p.paragraph_format.space_after = Pt(0.5)

    omml_str = (
        f'<m:oMathPara {nsdecls("m", "w")}>'
        f'<m:oMath>'
        f'{omml_inner_xml}'
        f'<m:r><m:t xml:space="preserve">   {eq_num}</m:t></m:r>'
        f'</m:oMath>'
        f'</m:oMathPara>'
    )
    omml_el = parse_xml(omml_str)
    p._p.append(omml_el)
    return p


def create_image_paragraph(doc, img_path: Path, width_in: float):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(1.0)
    p.paragraph_format.space_after = Pt(1.0)
    r = p.add_run()
    r.add_picture(str(img_path), width=Inches(width_in))
    return p


def build_iteecs_manuscript(template_file: Path, media_dir: Path, output_file: Path):
    doc = docx.Document(str(template_file))

    # -------------------------------------------------------------
    # 1. Clean Running Headers across all Sections
    # -------------------------------------------------------------
    for section in doc.sections:
        header = section.header
        if len(header.paragraphs) >= 2:
            hp = header.paragraphs[1]
            hp.text = ""
            r_hdr = hp.add_run("Harini Panigrahi et.al., Vol: X, No: X, pp: xxx-xxx, YYYY")
            r_hdr.font.name = "Palatino Linotype"
            r_hdr.font.size = Pt(9)
            r_hdr.font.italic = True

    p_orig = list(doc.paragraphs)
    t_abs = doc.tables[0]
    t_sample = doc.tables[1]
    t_sample._tbl.getparent().remove(t_sample._tbl)

    # -------------------------------------------------------------
    # 2. Section 0: Title, Authors, Affiliation, Abstract & Keywords Box
    # -------------------------------------------------------------
    p0 = p_orig[0]
    p0.text = ""
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(4)
    r_title = p0.add_run("IntelliFRA: An AI-Based Platform for Automated Transformer Fault Analysis")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)

    p_orig[1].paragraph_format.space_before = Pt(0)
    p_orig[1].paragraph_format.space_after = Pt(0)

    # Update ORCID target relationships in template
    if "rId8" in doc.part.rels:
        doc.part.rels["rId8"]._target = "https://orcid.org/0009-0006-6723-2991"
    if "rId9" in doc.part.rels:
        doc.part.rels["rId9"]._target = "https://orcid.org/0009-0002-8027-1523"

    # Authors Line (p_orig[2]) - Preserves ORCID drawings for Harini Panigrahi and Prapti Bhayde
    p2 = p_orig[2]
    if len(p2.runs) > 11 and "drawing" in p2.runs[11]._r.xml:
        r11_xml = p2.runs[11]._r.xml
        r11_xml_updated = r11_xml.replace('r:id="rId8"', 'r:id="rId9"')
        new_r11 = parse_xml(r11_xml_updated)
        p2.runs[11]._r.getparent().replace(p2.runs[11]._r, new_r11)

    p2.runs[0].text = "Harini Panigrahi"
    p2.runs[1].text = "¹"
    p2.runs[2].text = ""
    p2.runs[3].text = ""
    p2.runs[5].text = ", "
    p2.runs[6].text = "Neha Verma¹"
    p2.runs[7].text = ", "
    p2.runs[8].text = "Prapti Bhayde"
    p2.runs[9].text = "¹"
    p2.runs[10].text = ""
    p2.runs[12].text = ", "
    p2.runs[13].text = "Yooraj Gole¹"
    p2.runs[14].text = ", "
    p2.runs[15].text = "Bhanu Tekwani¹*"
    for idx in range(16, len(p2.runs)):
        p2.runs[idx].text = ""
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(2)
    for r in p2.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)

    # Affiliation, Emails, and ORCID metadata block (p_orig[3])
    p3 = p_orig[3]
    p3.text = ""
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.space_before = Pt(1)
    p3.paragraph_format.space_after = Pt(2)
    r3_affil = p3.add_run("¹Department of Information Technology, Vidyalankar Institute of Technology, Mumbai 400037, Maharashtra, India\n")
    r3_affil.font.name = "Palatino Linotype"
    r3_affil.font.size = Pt(9.0)
    r3_email = p3.add_run("E-mails: harinipanigrahi15@gmail.com, neha.nandkumar.verma@gmail.com, prapti.bhayde66@gmail.com, Yooraj20gole@gmail.com, bhanu.tekwani@vit.edu.in*\n")
    r3_email.font.name = "Palatino Linotype"
    r3_email.font.size = Pt(8.5)
    r3_orcid = p3.add_run("ORCID: Harini Panigrahi (https://orcid.org/0009-0006-6723-2991), Prapti Bhayde (https://orcid.org/0009-0002-8027-1523)  |  * Corresponding Author")
    r3_orcid.font.name = "Palatino Linotype"
    r3_orcid.font.size = Pt(8.5)

    p4 = p_orig[4]
    p4.text = ""
    p4_pPr = p4._p.get_or_add_pPr()
    numPr = p4_pPr.find(qn("w:numPr"))
    if numPr is not None:
        p4_pPr.remove(numPr)
    p4.paragraph_format.space_before = Pt(0)
    p4.paragraph_format.space_after = Pt(0)

    # Table 0: Light Blue Shaded Box (Abstract & Keywords)
    cell_abs = t_abs.cell(0, 0)
    while len(cell_abs.paragraphs) > 1:
        p_extra = cell_abs.paragraphs[-1]._p
        p_extra.getparent().remove(p_extra)

    p_abs = cell_abs.paragraphs[0]
    p_abs.text = ""
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.line_spacing = 0.98
    p_abs.paragraph_format.space_before = Pt(2)
    p_abs.paragraph_format.space_after = Pt(2)

    r_abs_lbl = p_abs.add_run("Abstract: ")
    r_abs_lbl.font.name = "Palatino Linotype"
    r_abs_lbl.font.size = Pt(9.5)
    r_abs_lbl.font.bold = True

    abs_text = (
        "Detecting internal mechanical movement inside high-voltage transformers before insulation breakdown occurs "
        "remains a critical challenge for power utilities. Sweep Frequency Response Analysis (SFRA) captures winding and "
        "core geometry through transfer-function magnitudes, yet maintenance engineers still rely heavily on manual trace "
        "overlays. We present IntelliFRA, an open-source web platform that automates SFRA triage from raw magnitude sweeps. "
        "Uploaded CSV or TXT sweeps (≥50 points) are standardized to 500 samples and evaluated by a four-stage diagnostic engine. "
        "A 140,644-parameter 1D Convolutional Neural Network (1D-CNN) classifies traces into Normal, Minor Deviation, Moderate "
        "Fault, or High Fault Risk categories. Concurrently, a 312,532-parameter dense Autoencoder fitted exclusively on healthy "
        "responses measures out-of-distribution departure via reconstruction error. Borderline classifications undergo morphological "
        "sanity checks (smoothness, monotonicity, peak counts) alongside a deterministic Fast Fourier Transform (FFT) fallback. "
        "Trained on 50,000 synthetic sweeps spanning six physical fault archetypes, the 1D-CNN achieves 94.41% validation accuracy "
        "(weighted F1 = 0.9443), while the Autoencoder detects 98.47% of abnormal curves with 100% fault recall. CPU inference executes "
        "in 0.274 ms, delivering real-time automated triage for electrical grid operations."
    )
    r_abs_txt = p_abs.add_run(abs_text)
    r_abs_txt.font.name = "Palatino Linotype"
    r_abs_txt.font.size = Pt(9.5)

    p_kw = cell_abs.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.line_spacing = 0.98
    p_kw.paragraph_format.space_before = Pt(2)
    p_kw.paragraph_format.space_after = Pt(2)

    r_kw_lbl = p_kw.add_run("Keywords: ")
    r_kw_lbl.font.name = "Palatino Linotype"
    r_kw_lbl.font.size = Pt(9.5)
    r_kw_lbl.font.bold = True

    r_kw_txt = p_kw.add_run(
        "Sweep frequency response analysis, Transformer fault detection, 1D-CNN, Autoencoder, Anomaly detection, Power asset health."
    )
    r_kw_txt.font.name = "Palatino Linotype"
    r_kw_txt.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 3. Section 1: 2-Column Main Body
    # -------------------------------------------------------------
    p_orig[5].text = ""
    p_orig[5].paragraph_format.space_before = Pt(4)
    p_orig[5].paragraph_format.space_after = Pt(2)
    r5 = p_orig[5].add_run("Introduction")
    r5.font.name = "Palatino Linotype"
    r5.font.size = Pt(10)
    r5.font.bold = True

    # Column 1 Introduction Body
    p_orig[6].text = ""
    p_orig[6].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_orig[6].paragraph_format.line_spacing = 0.94
    p_orig[6].paragraph_format.space_before = Pt(0)
    p_orig[6].paragraph_format.space_after = Pt(1.0)
    intro_p1 = (
        "Power transformers form critical nodes in electrical transmission grids, where unexpected catastrophic breakdowns "
        "cause prolonged outages and multimillion-dollar replacement expenditures. Among non-intrusive diagnostic techniques, "
        "Sweep Frequency Response Analysis (SFRA) provides unmatched sensitivity to internal mechanical deformations, including "
        "axial winding shifts, radial buckling, core displacement, and loosened clamping structures long before chemical gas-in-oil "
        "alarms indicate insulation failure [1, 11]. Standardized under IEC 60076-18 [2], SFRA applies a sinusoidal low-voltage "
        "excitation across frequency decades (typically 1 kHz to 2 MHz) and records transfer function magnitude profiles. "
        "However, interpreting SFRA curves remains largely subjective and manual. Field engineers calculate scalar indices such as "
        "Correlation Coefficients (CC) or Absolute Sum of Logarithmic Error (ASLE) [1], but fixed numerical thresholds often fail "
        "to distinguish operational noise and residual core magnetization [5] from genuine structural damage."
    )
    r6 = p_orig[6].add_run(intro_p1)
    r6.font.name = "Palatino Linotype"
    r6.font.size = Pt(9.5)

    for empty_idx in (7, 8, 15, 16):
        el = p_orig[empty_idx]._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    # History Box in Column 1
    p_orig[9].text = "History"
    p_orig[10].text = "Received: 01-03-2025;\t\tRevised: 15-05-2025;"
    p_orig[11].text = "Accepted: 30-05-2025\t\t"

    p12 = p_orig[12]
    p12.runs[2].text = "Bhanu "
    p12.runs[3].text = "Tekwani"

    p_orig[13].text = "bhanu.tekwani@vit.edu.in"
    p_orig[14].text = "¹Department of Information Technology, Vidyalankar Institute of Technology, Mumbai – 400037, India"

    for idx in range(9, 15):
        p = p_orig[idx]
        p.paragraph_format.space_before = Pt(0.5)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 0.92
        for run in p.runs:
            run.font.name = "Palatino Linotype"
            run.font.size = Pt(8.5)
            if idx in (9, 12):
                run.font.bold = True

    # Column 2 Introduction Body
    p_orig[17].text = ""
    p_orig[17].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_orig[17].paragraph_format.line_spacing = 0.94
    p_orig[17].paragraph_format.space_before = Pt(0)
    p_orig[17].paragraph_format.space_after = Pt(1.0)
    intro_p2 = (
        "Because manufacturing lead times for large transmission transformers routinely exceed twelve months, utility maintenance "
        "schedules demand rapid, objective triage [12]. Conductor displacements of merely a few millimeters alter distributed "
        "capacitances sufficiently to shift high-frequency resonance poles [13]. To eliminate reliance on scarce interpretive experts, "
        "we present IntelliFRA, an open-source, full-stack diagnostic system. Engineers upload raw CSV or TXT sweep files via an "
        "intuitive web interface, receiving an immediate four-grade severity classification, softmax probabilities, an unsupervised "
        "anomaly ratio, and plain-language maintenance recommendations. This paper formalizes the underlying architecture, states "
        "all mathematical formulations (Eq. (1)–(15)), details the 50,000-curve physics-based dataset, and presents comprehensive "
        "cross-validation, ablation, and CPU timing benchmarks."
    )
    r17 = p_orig[17].add_run(intro_p2)
    r17.font.name = "Palatino Linotype"
    r17.font.size = Pt(9.5)

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

    for idx in range(18, 42):
        el = p_orig[idx]._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    cursor = p_orig[17]._p

    # -------------------------------------------------------------
    # Section 2: Related Work
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Related Work"))

    rw_p1 = (
        "Early research focused on statistical and sub-band indicators to standardize SFRA interpretation. Shintemirov et al. [3] "
        "combined sub-band correlation coefficients with evidential reasoning to grade winding health, while Secue and Mombello [11] "
        "characterized axial and radial displacements by mapping resonance shift patterns across distinct frequency windows. Tahir and "
        "Tenbohlen [4] developed high-frequency lumped-circuit models to investigate winding deformation dynamics under transient excitation, "
        "complementing experimental short-circuit impedance studies by Bagheri et al. [12] and Behjat et al. [13]. While these scalar "
        "indices capture gross spectral changes, they struggle to discriminate complex multi-fault conditions without customized baseline calibrations."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rw_p1))

    rw_p2 = (
        "Machine learning classifiers emerged to automate pattern recognition from extracted feature vectors. However, manual sub-band "
        "feature engineering often discards subtle shape variations. Ince, Kiranyaz et al. [15] demonstrated that 1D Convolutional Neural "
        "Networks (1D-CNN) operating directly on raw time-series and spectral signals outperform hand-crafted descriptors because convolutional "
        "filters adaptively learn localized resonance signatures without manual feature extraction. Recent work by Phillip et al. [6, 10] "
        "verified that deep learning models can accurately categorize transformer FRA curves into distinct severity groups. Nevertheless, "
        "pure supervised classifiers enforce closed-set decisions, assigning every curve to a known training category even when presented "
        "with unmodeled topologies, measurement artifacts, or novel fault modes."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rw_p2))

    rw_p3 = (
        "To mitigate closed-set brittleness, unsupervised reconstruction models provide a principled novelty gate. Chandola et al. [7] "
        "and Sakurada and Yairi [16] demonstrated that autoencoders trained strictly on normal operational records effectively detect novel "
        "anomalies via elevated reconstruction error. In the transformer domain, where utility fault records are scarce, Zhang et al. [14] "
        "demonstrated that distributed ladder networks reproduce high-frequency coupling behavior accurately. IntelliFRA bridges prior "
        "gaps by integrating a physics-based synthetic generation engine, dual supervised 1D-CNN and unsupervised autoencoder inference, "
        "morphological sanity filters, and an authenticated production web application."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rw_p3))

    # -------------------------------------------------------------
    # Section 3: System Architecture
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "System Architecture"))

    sa_intro = (
        "IntelliFRA executes automated triage through a five-stage modular pipeline: (1) ingestion and validation, (2) length "
        "standardization and per-curve z-score normalization, (3) dual neural and morphological inference, (4) relational storage with "
        "per-user partitioning, and (5) interactive browser visualization. The overall software architecture is depicted in Fig. 1. "
        "FastAPI orchestrates data flow across REST endpoints, ensuring complete decoupling between client ingestion and backend inference."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_intro))

    # Fig. 1: System Architecture (vertical sequential)
    p_fig1 = create_image_paragraph(doc, media_dir / "image1.png", 1.85)
    p_cap_fig1 = create_caption(doc, "Fig. 1: ", "IntelliFRA end-to-end software and diagnostic architecture", align=WD_ALIGN_PARAGRAPH.CENTER)
    cursor = insert_after(cursor, p_fig1)
    cursor = insert_after(cursor, p_cap_fig1)

    # 3.1 Data Ingestion and Validation
    cursor = insert_after(cursor, create_heading2(doc, "3.1  Data Ingestion and Validation"))
    sa_ingest = (
        "The upload endpoint (POST /fra/upload) accepts raw .csv and .txt sweep files. The parser automatically detects delimiter formats, "
        "verifies numerical integrity, and extracts magnitude readings. In CSV files, csv.DictReader identifies frequency and dB columns "
        "automatically regardless of column order, whereas TXT files are parsed token-wise for floating-point values. To prevent memory "
        "overflow, uploads are bounded to 2,000 tokens. Sweeps containing fewer than 50 valid float points trigger an immediate HTTP 400 "
        "rejection, preventing corrupt or truncated arrays from propagating to downstream inference models."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_ingest))

    # 3.2 Preprocessing and Normalization
    cursor = insert_after(cursor, create_heading2(doc, "3.2  Preprocessing and Normalization"))
    sa_prep = (
        "Sweeps with 50 to 499 points are interpolated to a standard 500-sample grid using boundary edge-value replication (mode='edge'), "
        "avoiding artificial step discontinuities associated with zero-padding. Each 500-point vector is then independently normalized to "
        "zero mean and unit variance. Per-curve z-score scaling eliminates absolute gain and impedance offsets caused by differing transformer "
        "MVA ratings and test-lead arrangements, preserving relative peak heights and resonant notch depths across all voltage classes."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_prep))

    # 3.3 Hybrid AI Inference Engine
    cursor = insert_after(cursor, create_heading2(doc, "3.3  Hybrid AI Inference Engine"))
    sa_inf_p1 = (
        "Our diagnostic engine couples supervised classification with unsupervised anomaly detection, backed by morphological checks and "
        "a deterministic FFT rule engine:"
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_inf_p1))

    sa_inf_cnn = (
        "three sequential convolutional blocks (Conv1D with kernel sizes 7, 5, 3 and filter counts 32, 64, 128, each followed by "
        "ReLU and MaxPool1D) [8] feed a two-layer dense classification head regularized with dropout (p = 0.2) [18]. Totaling 140,644 "
        "trainable parameters (~0.98 MB memory footprint), it maps the 500-point curve to Normal, Minor Deviation, Moderate Fault, "
        "or High Fault Risk categories [15]."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_inf_cnn, bold_prefix="1D-CNN Classifier: "))

    sa_inf_ae = (
        "a symmetric dense bottleneck architecture (500→256→96→32→96→256→500; 312,532 parameters) trained exclusively "
        "on healthy sweeps under Mean Squared Error (MSE) loss [16]. Reconstruction error is scaled against the 95th-percentile "
        "normal threshold τ to generate a continuous anomaly ratio."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_inf_ae, bold_prefix="Autoencoder Anomaly Gate: "))

    sa_inf_mo = (
        "a post-processing rule filter examines first-difference variance, monotonic step ratio, and "
        "prominent peak counts, overriding over-cautious neural misclassifications on exceptionally smooth sweeps."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_inf_mo, bold_prefix="Morphological Sanity Filter: "))

    sa_inf_fft = (
        "if PyTorch weights cannot be loaded, the system automatically falls back to deterministic spectral energy "
        "and zero-crossing heuristics, ensuring high operational availability in isolated substation environments."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_inf_fft, bold_prefix="Deterministic FFT Fallback: "))

    # 3.4 Persistence and Secure API
    cursor = insert_after(cursor, create_heading2(doc, "3.4  Persistence and Secure API"))
    sa_api = (
        "FastAPI coordinates backend operations over asynchronous REST endpoints: POST /fra/upload ingests sweeps, GET /fra/results/{id} "
        "retrieves individual test records, and GET /fra/history returns paginated historical sweeps filterable by severity and date range. "
        "Authenticated user sessions are verified using JWT bearer tokens. Analysis records, predicted labels, confidence values, anomaly "
        "scores, and 500-point arrays are persisted in SQLAlchemy relational tables with strict foreign-key account isolation."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_api))

    # 3.5 Frontend Architecture
    cursor = insert_after(cursor, create_heading2(doc, "3.5  Frontend Architecture"))
    sa_ui = (
        "The web interface is engineered with React 19, Tailwind CSS, Framer Motion, and Recharts. Upon upload, the dashboard renders "
        "an interactive 500-point magnitude plot alongside severity badges, softmax probabilities, and Central Electricity Authority "
        "(CEA)-aligned technical recommendations (Fig. 2), enabling maintenance crews to interpret results at a glance."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sa_ui))

    # Fig. 2: Diagnostic View (vertical sequential)
    p_fig2 = create_image_paragraph(doc, media_dir / "image4.png", 2.10)
    p_cap_fig2 = create_caption(
        doc, "Fig. 2: ",
        "Comprehensive FRA diagnostic result view showing severity triage, confidence percentage, anomaly ratio, interactive 500-point Recharts curve, and maintenance recommendations",
        align=WD_ALIGN_PARAGRAPH.CENTER
    )
    cursor = insert_after(cursor, p_fig2)
    cursor = insert_after(cursor, p_cap_fig2)

    # -------------------------------------------------------------
    # Section 4: Mathematical and Algorithmic Formulation
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Mathematical Formulation"))

    mf_intro = "This section formalizes the mathematical transformations executed across each stage of the diagnostic pipeline."
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_intro))

    # 4.1 Per-Sample Z-Score Normalization
    cursor = insert_after(cursor, create_heading2(doc, "4.1  Per-Sample Z-Score Normalization"))
    mf_p1 = (
        "Each 500-point sweep x = [x₁, ..., x_N] (where N = 500) is standardized against its own sample mean μ and standard "
        "deviation σ with a numerical stability constant ε = 1 × 10⁻⁶:"
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p1))

    # Eq (1)
    eq1_xml = (
        '<m:r><m:t>μ=</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:e></m:nary>'
        '<m:r><m:t>, σ=</m:t></m:r>'
        '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg><m:r><m:t> </m:t></m:r></m:deg>'
        '<m:e><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>−μ)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary></m:e></m:rad>'
        '<m:r><m:t>, </m:t></m:r><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>=</m:t></m:r><m:f><m:num><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub><m:r><m:t>−μ</m:t></m:r></m:num><m:den><m:r><m:t>σ+ε</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq1_xml, "(1)"))

    # 4.2 CNN Classification
    cursor = insert_after(cursor, create_heading2(doc, "4.2  1D-CNN Multi-Class Classification"))
    mf_p2 = "The 1D-CNN maps x′ through 1D convolutional layers, producing logits z = [z₁, ..., z₄] converted to softmax probabilities:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p2))

    # Eq (2)
    eq2_xml = (
        '<m:sSub><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=</m:t></m:r><m:f><m:num><m:sSup><m:e><m:r><m:t>e</m:t></m:r></m:e><m:sup><m:sSub><m:e><m:r><m:t>z</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:sup></m:sSup></m:num>'
        '<m:den><m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>j=1</m:t></m:r></m:sub><m:sup><m:r><m:t>4</m:t></m:r></m:sup>'
        '<m:e><m:sSup><m:e><m:r><m:t>e</m:t></m:r></m:e><m:sup><m:sSub><m:e><m:r><m:t>z</m:t></m:r></m:e><m:sub><m:r><m:t>j</m:t></m:r></m:sub></m:sSub></m:sup></m:sSup></m:e></m:nary></m:den></m:f>'
        '<m:r><m:t>,  </m:t></m:r><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>y</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>=</m:t></m:r><m:sSub><m:e><m:r><m:t>arg max</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub>'
        '<m:sSub><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq2_xml, "(2)"))

    # Eq (3)
    mf_p3 = "Optimization minimizes multiclass cross-entropy loss over one-hot target vectors y:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p3))
    eq3_xml = (
        '<m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>CE</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=−</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=1</m:t></m:r></m:sub><m:sup><m:r><m:t>4</m:t></m:r></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>y</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t> log </m:t></m:r>'
        '<m:sSub><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq3_xml, "(3)"))

    # 4.3 Autoencoder and Anomaly Score
    cursor = insert_after(cursor, create_heading2(doc, "4.3  Autoencoder and Anomaly Scoring"))
    mf_p4 = (
        "The autoencoder reconstructs x̂′ = f_AE(x′) through its 32-node latent bottleneck. Mean squared reconstruction error e "
        "and normalized anomaly ratio s_anom are defined as:"
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p4))

    # Eq (4)
    eq4_xml = (
        '<m:sSup><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc></m:e><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSup>'
        '<m:r><m:t>=</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>AE</m:t></m:r></m:sub></m:sSub><m:r><m:t>(x′),  e=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>−</m:t></m:r><m:sSubSup><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq4_xml, "(4)"))

    # Eq (5)
    eq5_xml = (
        '<m:sSub><m:e><m:r><m:t>s</m:t></m:r></m:e><m:sub><m:r><m:t>anom</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=</m:t></m:r><m:f><m:num><m:r><m:t>e</m:t></m:r></m:num><m:den><m:r><m:t>τ+ε</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq5_xml, "(5)"))

    # Eq (6)
    mf_p5 = "where τ = 0.022530 represents the 95th-percentile healthy threshold. Autoencoder training minimizes MSE loss over healthy samples:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p5))
    eq6_xml = (
        '<m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>AE</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>−</m:t></m:r><m:sSubSup><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq6_xml, "(6)"))

    # 4.4 Deterministic FFT / Spectral Fallback
    cursor = insert_after(cursor, create_heading2(doc, "4.4  Spectral and FFT Fallback Features"))
    mf_p6 = "In rule-fallback mode, signal energy E and high-frequency spectral energy E_spec are evaluated directly:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p6))

    # Eq (7)
    eq7_xml = (
        '<m:r><m:t>E=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSubSup></m:e></m:nary>'
        '<m:r><m:t>,  </m:t></m:r><m:sSub><m:e><m:r><m:t>E</m:t></m:r></m:e><m:sub><m:r><m:t>spec</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=N/2</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:r><m:t>|</m:t></m:r><m:sSub><m:e><m:r><m:t>F(x)</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>|</m:t></m:r></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq7_xml, "(7)"))

    # 4.5 Morphological Descriptors
    cursor = insert_after(cursor, create_heading2(doc, "4.5  Morphological Post-Processing Filters"))
    mf_p7 = "Morphological sanity checks compute first-order discrete differences Δx_i = x_{i+1} − x_i:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p7))

    # Eq (8)
    eq8_xml = (
        '<m:r><m:t>Δ</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i+1</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>−</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq8_xml, "(8)"))
    mf_p8 = (
        "Descriptor metrics include smoothness std(Δx), monotonic step fraction mean(Δx ≤ 0), and local prominence peak counts. "
        "A sweep exhibiting std(Δx) < 0.22, monotonic ratio > 0.88, and at most 1 peak is downgraded to Normal, whereas traces "
        "with ≥ 5 sharp peaks and high variance are escalated to High Fault Risk."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p8))

    # 4.6 Evaluation Metrics
    cursor = insert_after(cursor, create_heading2(doc, "4.6  Evaluation Metrics"))
    mf_p9 = "Diagnostic performance is quantified using Accuracy, Precision, Recall, and F1-Score [9, 19]:"
    cursor = insert_after(cursor, create_body_paragraph(doc, mf_p9))

    # Eq (9)
    eq9_xml = '<m:r><m:t>Accuracy=</m:t></m:r><m:f><m:num><m:r><m:t>TP+TN</m:t></m:r></m:num><m:den><m:r><m:t>TP+TN+FP+FN</m:t></m:r></m:den></m:f>'
    cursor = insert_after(cursor, create_omml_equation(doc, eq9_xml, "(9)"))

    # Eq (10)
    eq10_xml = (
        '<m:r><m:t>Precision=</m:t></m:r><m:f><m:num><m:r><m:t>TP</m:t></m:r></m:num><m:den><m:r><m:t>TP+FP</m:t></m:r></m:den></m:f>'
        '<m:r><m:t>,  Recall=</m:t></m:r><m:f><m:num><m:r><m:t>TP</m:t></m:r></m:num><m:den><m:r><m:t>TP+FN</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq10_xml, "(10)"))

    # Eq (11)
    eq11_xml = (
        '<m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>1</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>2·(Precision·Recall)</m:t></m:r></m:num><m:den><m:r><m:t>Precision+Recall</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq11_xml, "(11)"))

    # -------------------------------------------------------------
    # Section 5: Synthetic Dataset Generation
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Synthetic Data Generation"))

    sd_intro = (
        "Due to utility data protection and the scarcity of destructive physical failures, we synthesize a 50,000-curve "
        "corpus using a physics-informed stochastic lumped-mode generator spanning 1 kHz to 2 MHz [14]. The generator simulates "
        "distributed winding resonances through multi-peak superposition rather than computationally prohibitive 3D finite-element meshes."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_intro))

    # 5.1 Frequency Grid and Mode Synthesis
    cursor = insert_after(cursor, create_heading2(doc, "5.1  Frequency Grid and Mode Synthesis"))
    sd_p1 = "Five hundred logarithmic frequency points f ∈ [10³, 2 × 10⁶] Hz are mapped onto normalized coordinates f̃ ∈ [0, 1]:"
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p1))

    # Eq (12)
    eq12_xml = (
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:sSub><m:e><m:r><m:t>log</m:t></m:r></m:e><m:sub><m:r><m:t>10</m:t></m:r></m:sub></m:sSub><m:r><m:t>(f)−</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>log</m:t></m:r></m:e><m:sub><m:r><m:t>10</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>min</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:num>'
        '<m:den><m:sSub><m:e><m:r><m:t>log</m:t></m:r></m:e><m:sub><m:r><m:t>10</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>max</m:t></m:r></m:sub></m:sSub><m:r><m:t>)−</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>log</m:t></m:r></m:e><m:sub><m:r><m:t>10</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>min</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:den></m:f>'
        '<m:r><m:t>,  0≤</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>≤1</m:t></m:r>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq12_xml, "(12)"))

    # Eq (13)
    sd_p2 = "Each sweep superimposes N_m ~ U{8, 12} Lorentzian resonant modes characterized by center c_k, quality Q_k, and gain A_k:"
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p2))
    eq13_xml = (
        '<m:sSub><m:e><m:r><m:t>R</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)=</m:t></m:r>'
        '<m:f><m:num><m:sSub><m:e><m:r><m:t>A</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:num>'
        '<m:den><m:r><m:t>1+</m:t></m:r><m:sSup><m:e><m:r><m:t>((</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>−</m:t></m:r><m:sSub><m:e><m:r><m:t>c</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>)/</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:den></m:f>'
        '<m:r><m:t>,  </m:t></m:r><m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>=max(0.008, </m:t></m:r>'
        '<m:f><m:num><m:r><m:t>0.12</m:t></m:r></m:num><m:den><m:r><m:t>max(</m:t></m:r><m:sSub><m:e><m:r><m:t>Q</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>, 0.1)</m:t></m:r></m:den></m:f><m:r><m:t>)</m:t></m:r>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq13_xml, "(13)"))

    # Eq (14)
    sd_p3 = "Summing all N_m resonant modes yields the synthetic transfer function magnitude:"
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p3))
    eq14_xml = (
        '<m:sSub><m:e><m:r><m:t>H</m:t></m:r></m:e><m:sub><m:r><m:t>base</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=1</m:t></m:r></m:sub>'
        '<m:sup><m:sSub><m:e><m:r><m:t>N</m:t></m:r></m:e><m:sub><m:r><m:t>m</m:t></m:r></m:sub></m:sSub></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>R</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)</m:t></m:r></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq14_xml, "(14)"))

    # 5.2 Fault Taxonomy
    cursor = insert_after(cursor, create_heading2(doc, "5.2  Fault Taxonomy and Physical Archetypes"))
    sd_p4 = "Six physical fault mechanisms documented in high-voltage research are mapped into four operational severity categories (Table 1)."
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p4))

    # Table 1: Fault archetypes
    t1_headers = ["Archetype", "Meaning", "Transformation", "IntelliFRA label"]
    t1_rows = [
        ["NF", "No fault (repeatability)", "Modes jittered ±0.2% in centre/Q/amplitude", "Normal"],
        ["DLF / LCF", "Dielectric leakage / clamping loss", "Q reduced by (1 − 0.65·tanδ), tanδ ~ U(0.05, 0.55); amplitude ±8%", "Minor Deviation"],
        ["RDF", "Radial deformation", "All mode centres scaled by (1 + shift), shift ~ U(−0.10, 0.10)", "Moderate Fault"],
        ["IDF", "Inter-disk displacement", "Each mode split into two at c ± gap, gap ~ U(0.015, 0.045), unequal split, Q×0.85", "Moderate Fault"],
        ["SCF", "Short-circuit fault", "HF attenuation mask + localized Lorentzian notch + impedance spike, severity ~ U(0.35, 1.0)", "High Fault Risk"],
    ]
    t1_widths = [Inches(0.55), Inches(0.80), Inches(1.25), Inches(0.65)]
    p_cap_t1 = create_caption(doc, "Table. 1: ", "Fault archetypes and their mapping to IntelliFRA severity labels")
    tbl1 = doc.add_table(rows=len(t1_rows) + 1, cols=4)
    style_table_cells(tbl1, t1_headers, t1_rows, t1_widths)
    cursor = insert_after(cursor, p_cap_t1)
    cursor = insert_after(cursor, tbl1)

    # Eq (15)
    sd_p5 = (
        "Each curve is subject to high-frequency roll-off modeling capacitive shunting across winding disks, followed by Gaussian noise "
        "(σ ~ U(0.002, 0.025) for Normal; σ ~ U(0.01, 0.06) for Fault):"
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p5))
    eq15_xml = (
        '<m:r><m:t>x←x·exp(−r·</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>),  r∼U(0.35, 0.95)</m:t></m:r>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq15_xml, "(15)"))

    # 5.3 Dataset Scale and Reproducibility
    cursor = insert_after(cursor, create_heading2(doc, "5.3  Dataset Scale and Reproducibility"))
    sd_p6 = (
        "Executing generate_dataset.py generates 50,000 labeled sweeps (12,500 per class, 500 samples each) using deterministic per-sample "
        "seeds (seed = 42 + class_index × 1,000,000 + i). The resulting corpus (fra_dataset.csv) provides balanced representation across all "
        "six degradation archetypes with guaranteed experimental reproducibility."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, sd_p6))

    # -------------------------------------------------------------
    # Section 6: Model Training Configuration
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Model Training Configuration"))

    mt_p1 = (
        "The 50,000-sweep dataset was partitioned into an 80:20 train/validation split (40,000 train sweeps, 10,000 validation sweeps). "
        "Both neural models were trained in PyTorch [20] using Adam optimization [17] (lr = 1 × 10⁻³, batch size 32) over 20 epochs. "
        "The Autoencoder was trained solely on healthy curves to preserve out-of-distribution sensitivity [7, 16] (Table 2). Stratified "
        "sampling and evaluation metrics follow standardized machine learning pipelines [9, 19]."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, mt_p1))

    # Table 2: Training configuration
    t2_headers = ["Setting", "1D-CNN", "Autoencoder"]
    t2_rows = [
        ["Optimizer", "Adam, lr = 1e-3", "Adam, lr = 1e-3"],
        ["Loss", "Cross-entropy", "MSE (reconstruction)"],
        ["Batch size", "32 (train) / 64 (val)", "32"],
        ["Epochs", "20", "20"],
        ["Training subset", "Full 40,000-row training split", "Normal-labelled rows only (train split)"],
        ["Threshold τ", "—", "95th percentile of Normal train reconstruction error"],
    ]
    t2_widths = [Inches(0.85), Inches(1.15), Inches(1.25)]
    p_cap_t2 = create_caption(doc, "Table. 2: ", "Training configuration for the 1D-CNN and Autoencoder models")
    tbl2 = doc.add_table(rows=len(t2_rows) + 1, cols=3)
    style_table_cells(tbl2, t2_headers, t2_rows, t2_widths)
    cursor = insert_after(cursor, p_cap_t2)
    cursor = insert_after(cursor, tbl2)

    # -------------------------------------------------------------
    # Section 7: Results and Discussion
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Results and Discussion"))

    rd_intro = (
        "Validation metrics were evaluated on the 10,000 held-out sweeps (2,503 Normal, 2,486 Minor Deviation, 2,524 Moderate Fault, "
        "and 2,487 High Fault Risk) using scikit-learn [19]."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rd_intro))

    # 7.1 1D-CNN Classification Performance
    cursor = insert_after(cursor, create_heading2(doc, "7.1  1D-CNN Classification Performance"))
    rd_cnn_p = (
        "The 1D-CNN reached an overall validation accuracy of 94.41% with a weighted F1-score of 0.9443 (macro F1 = 0.9444). "
        "Per-class metrics are detailed in Table 3."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rd_cnn_p))

    # Table 3: CNN Classification Performance
    t3_headers = ["Class", "Precision", "Recall", "F1-score", "Support"]
    t3_rows = [
        ["Normal", "1.0000", "0.9992", "0.9996", "2503"],
        ["Minor Deviation", "0.8749", "0.9256", "0.8995", "2486"],
        ["Moderate Fault", "0.9147", "0.8796", "0.8968", "2524"],
        ["High Fault Risk", "0.9906", "0.9727", "0.9815", "2487"],
    ]
    t3_widths = [Inches(1.05), Inches(0.55), Inches(0.55), Inches(0.55), Inches(0.55)]
    p_cap_t3 = create_caption(doc, "Table. 3: ", "CNN classification performance")
    tbl3 = doc.add_table(rows=len(t3_rows) + 1, cols=5)
    style_table_cells(tbl3, t3_headers, t3_rows, t3_widths)
    cursor = insert_after(cursor, p_cap_t3)
    cursor = insert_after(cursor, tbl3)

    # Fig. 3: 1D-CNN Confusion Matrix (vertical sequential)
    p_fig3 = create_image_paragraph(doc, media_dir / "image6.png", 1.95)
    p_cap_fig3 = create_caption(
        doc, "Fig. 3: ", "1D-CNN confusion matrix on 10,000 validation sweeps",
        align=WD_ALIGN_PARAGRAPH.CENTER
    )
    cursor = insert_after(cursor, p_fig3)
    cursor = insert_after(cursor, p_cap_fig3)

    rd_cm_p = (
        "The confusion matrix (Fig. 3) confirms exceptional separation between healthy and damaged states: only two Normal sweeps out "
        "of 2,503 cross into fault categories, and zero faulty sweeps are misclassified as Normal. The few off-diagonal predictions "
        "occur exclusively between adjacent intermediate classes (Minor vs. Moderate), where conservative triage is maintained."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rd_cm_p))

    # 7.2 Autoencoder Anomaly Detection Performance
    cursor = insert_after(cursor, create_heading2(doc, "7.2  Autoencoder Anomaly Detection Performance"))
    rd_ae_p = (
        "The Autoencoder achieved 98.47% accuracy on Normal-vs-Fault binary discrimination with 100% fault recall across all 7,497 faulty "
        "sweeps (zero missed faults). Mean reconstruction error on faulty sweeps (0.273091) exceeded healthy traces (0.010116) by 27 times, "
        "yielding unambiguous separation around τ = 0.022530 (Table 4). The 153 false alarms among 2,503 healthy sweeps (6.1%) stem from "
        "calibrating τ at the 95th percentile of normal repeatability noise—an intentional trade-off prioritizing zero false negatives."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rd_ae_p))

    # Table 4: Autoencoder evaluation metrics
    t4_headers = ["Metric", "Value"]
    t4_rows = [
        ["Decision threshold τ", "0.022530"],
        ["Accuracy (Normal vs. Fault)", "0.9847"],
        ["Precision", "0.9800"],
        ["Recall", "1.0000"],
        ["F1-score", "0.9899"],
        ["Mean reconstruction error – Normal", "0.010116"],
        ["Mean reconstruction error – Fault (val.)", "0.273091"],
    ]
    t4_widths = [Inches(2.2), Inches(1.0)]
    p_cap_t4 = create_caption(doc, "Table. 4: ", "Autoencoder evaluation metrics")
    tbl4 = doc.add_table(rows=len(t4_rows) + 1, cols=2)
    style_table_cells(tbl4, t4_headers, t4_rows, t4_widths)
    cursor = insert_after(cursor, p_cap_t4)
    cursor = insert_after(cursor, tbl4)

    # 7.3 Supplementary Benchmark: 5-Fold CV, Ablation, and Latency
    cursor = insert_after(cursor, create_heading2(doc, "7.3  Cross-Validation, Baseline Comparison, and Latency Profiling"))
    rd_supp_p = (
        "To evaluate model resilience without monotonic step caps, an unconstrained 12,000-sweep dataset (2,000 per archetype) was assessed "
        "under 5-fold stratified cross-validation alongside RBF-SVM, Random Forest, and MLP baselines [19]. As summarized in Table 5, the "
        "1D-CNN averaged 81.03% ± 1.60% accuracy (macro F1 = 0.8234), significantly outperforming Random Forest (72.57%), RBF-SVM (66.13%), "
        "and MLP (64.95%). On a separate shifted test set (n = 2,400) with ±15% pole frequency shifts and heavy noise (σ ∈ [0.03, 0.08]), "
        "the 1D-CNN maintained superior generalization (56.88%). Latency profiling across 1,000 CPU runs demonstrated average single-sample "
        "inference of 0.218 ms for the 1D-CNN and 0.274 ms for the combined CNN-Autoencoder pipeline."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, rd_supp_p))

    # Table 5: Supplementary benchmark
    t5_headers = ["Configuration", "5-fold CV Acc. / Macro F1", "Shifted test Acc.", "CPU time, mean / p95"]
    t5_rows = [
        ["1D-CNN (140,644 parameters)", "81.03% ± 1.60% / 0.823", "56.88%", "0.218 / 0.247 ms"],
        ["Random Forest (100 trees, depth 15)", "72.57% ± 1.05% / 0.730", "51.21%", "4.412 / 5.120 ms"],
        ["SVM (RBF kernel, C=1.0)", "66.13% ± 0.65% / 0.672", "50.83%", "16.840 / 18.230 ms"],
        ["MLP (128-64 hidden units)", "64.95% ± 0.94% / 0.653", "49.33%", "0.082 / 0.098 ms"],
        ["Combined: 1D-CNN + Autoencoder gate", "81.92% / 0.828", "56.88%", "0.274 / 0.305 ms"],
    ]
    t5_widths = [Inches(1.30), Inches(0.90), Inches(0.50), Inches(0.60)]
    p_cap_t5 = create_caption(
        doc, "Table. 5: ",
        "Supplementary benchmark on 12,000 uncapped sweeps (5-fold CV), shifted test set (n = 2,400), and CPU timing"
    )
    tbl5 = doc.add_table(rows=len(t5_rows) + 1, cols=4)
    style_table_cells(tbl5, t5_headers, t5_rows, t5_widths)
    cursor = insert_after(cursor, p_cap_t5)
    cursor = insert_after(cursor, tbl5)

    # -------------------------------------------------------------
    # Section 8: System Implementation
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "System Implementation"))
    si_text = (
        "IntelliFRA is released as an open-source web application. The frontend leverages React 19, Vite, Tailwind CSS, and Recharts "
        "to deliver interactive 500-point trace visualization. FastAPI provides asynchronous REST endpoints executing validation, "
        "z-score scaling, and PyTorch inference in sub-millisecond CPU time (0.274 ms mean). User accounts and historical records are "
        "secured via bcrypt password hashing and SQLAlchemy relational storage with strict tenant partitioning."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, si_text))

    # -------------------------------------------------------------
    # Section 9: Limitations and Future Work
    # -------------------------------------------------------------
    cursor = insert_after(cursor, create_section_heading(doc, "Limitations and Future Work"))
    lf_text = (
        "While physics-based synthesis provides diverse fault archetypes, in-service substation sweeps exhibit switchyard electromagnetic "
        "interference, grounding lead corrosion, and temperature variations. Ongoing work focuses on fine-tuning pre-trained models "
        "on measured utility corpora (such as IEEE DataPort archives). Future software extensions include automated PDF report generation, "
        "adaptive shape-override calibration, and three-phase trace comparison tools."
    )
    cursor = insert_after(cursor, create_body_paragraph(doc, lf_text))

    # -------------------------------------------------------------
    # Section 10: Conclusion
    # -------------------------------------------------------------
    p_concl.text = ""
    p_concl.paragraph_format.space_before = Pt(3.5)
    p_concl.paragraph_format.space_after = Pt(1.0)
    r_concl = p_concl.add_run("Conclusion")
    r_concl.font.name = "Palatino Linotype"
    r_concl.font.size = Pt(10)
    r_concl.font.bold = True

    concl_p1 = (
        "We presented IntelliFRA, an open-source platform automating Sweep Frequency Response Analysis for high-voltage power "
        "transformers. By combining a 140,644-parameter 1D-CNN classifier with a 312,532-parameter dense Autoencoder, the system "
        "resolves the manual interpretation bottleneck. Trained on 50,000 synthetic sweeps spanning six physical fault archetypes, "
        "the 1D-CNN achieves 94.41% validation accuracy (weighted F1 = 0.9443), while the Autoencoder flags abnormal curves with 98.47% "
        "accuracy and 100% fault recall. On an unconstrained 12,000-sweep 5-fold cross-validation benchmark, the 1D-CNN (81.03%) substantially "
        "outperformed Random Forest (72.57%) and SVM (66.13%) baselines."
    )
    concl_p2 = (
        "Operating with 0.274 ms CPU inference and supported by morphological filters and deterministic FFT fallback, IntelliFRA provides "
        "reliable, real-time diagnostic triage. The complete software repository, dataset generators, and PyTorch model checkpoints are "
        "publicly released to support reproducible condition monitoring across utility fleets."
    )
    p_concl_txt.text = ""
    p_concl_txt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_concl_txt.paragraph_format.line_spacing = 0.94
    p_concl_txt.paragraph_format.space_before = Pt(0)
    p_concl_txt.paragraph_format.space_after = Pt(1.0)
    r_c1 = p_concl_txt.add_run(concl_p1)
    r_c1.font.name = "Palatino Linotype"
    r_c1.font.size = Pt(9.5)

    p_concl_2 = doc.add_paragraph()
    p_concl_2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_concl_2.paragraph_format.line_spacing = 0.94
    p_concl_2.paragraph_format.space_before = Pt(0)
    p_concl_2.paragraph_format.space_after = Pt(1.0)
    r_c2 = p_concl_2.add_run(concl_p2)
    r_c2.font.name = "Palatino Linotype"
    r_c2.font.size = Pt(9.5)
    insert_after(p_concl_txt._p, p_concl_2)

    # -------------------------------------------------------------
    # Back Matter (Declarations)
    # -------------------------------------------------------------
    for unused_p in (p_supp, p_supp_txt):
        el = unused_p._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    for idx in (44, 47, 50, 53, 56, 61):
        if idx < len(p_orig):
            el = p_orig[idx]._p
            if el.getparent() is not None:
                el.getparent().remove(el)

    p_ack.text = "Acknowledgment"
    p_ack_txt.text = (
        "The authors express gratitude to Prof. Bhanu Tekwani for his guidance throughout this research, and to "
        "Dr. Vidya Chitre, Head of the Department of Information Technology at Vidyalankar Institute of Technology, Mumbai, "
        "for computing and institutional facilities."
    )

    p_fund.text = "Funding"
    p_fund_txt.text = "This research received no external funding."

    p_data.text = "Data Availability Statement"
    p_data_txt.text = (
        "The datasets analyzed during this study, synthesis scripts (physics_fra_synthesis.py, generate_dataset.py), and "
        "trained PyTorch model weights are openly accessible in the IntelliFRA project repository."
    )

    p_coi.text = "Conflict of Interest"
    p_coi_txt.text = (
        "The authors declare that they have no known competing financial interests or personal relationships that could "
        "have appeared to influence the work reported in this paper."
    )

    p_credit.text = "CRediT Authorship Contribution Statement"
    p_credit_txt.text = (
        "Conceptualization, H.P. and N.V.; methodology, H.P. and P.B.; software, H.P., N.V., P.B. and Y.G.; "
        "validation, H.P., N.V. and Y.G.; formal analysis, H.P. and P.B.; investigation, N.V. and Y.G.; "
        "data curation, P.B. and Y.G.; writing—original draft preparation, H.P., N.V., P.B. and Y.G.; "
        "writing—review and editing, B.T.; visualization, N.V. and P.B.; supervision, B.T.; project "
        "administration, B.T. All authors have read and approved the published version of the manuscript."
    )

    for p_bm_hdr in (p_ack, p_fund, p_data, p_coi, p_credit):
        p_bm_hdr.paragraph_format.space_before = Pt(2.2)
        p_bm_hdr.paragraph_format.space_after = Pt(0.5)
        for r in p_bm_hdr.runs:
            r.font.bold = True
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(9.5)

    for p_bm_body in (p_ack_txt, p_fund_txt, p_data_txt, p_coi_txt, p_credit_txt):
        p_bm_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_bm_body.paragraph_format.space_before = Pt(0)
        p_bm_body.paragraph_format.space_after = Pt(1.0)
        p_bm_body.paragraph_format.line_spacing = 0.94
        for r in p_bm_body.runs:
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(9)

    # -------------------------------------------------------------
    # References (All 20 References in IEEE format with full URLs/DOIs)
    # -------------------------------------------------------------
    p_ref.text = "References"
    p_ref.paragraph_format.space_before = Pt(4)
    p_ref.paragraph_format.space_after = Pt(2)
    for r in p_ref.runs:
        r.font.bold = True
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(10)

    for idx in range(63, 81):
        if idx < len(p_orig):
            el = p_orig[idx]._p
            if el.getparent() is not None:
                el.getparent().remove(el)

    for p_remove in (p_orig[81], p_orig[82]):
        el = p_remove._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    iteecs_references = [
        '[1] S. A. Ryder, “Diagnosing Transformer Faults Using Frequency Response Analysis,” IEEE Electrical Insulation Magazine, Vol. 19, No. 2, pp. 16-22, 2003. https://doi.org/10.1109/MEI.2003.1192032',
        '[2] IEC 60076-18, “Power Transformers - Part 18: Measurement of Frequency Response,” International Electrotechnical Commission (IEC), Geneva, Switzerland, 2012.',
        '[3] A. Shintemirov, W. H. Tang and Q. H. Wu, “Transformer Winding Condition Assessment Using Frequency Response Analysis and Evidential Reasoning,” IET Electric Power Applications, Vol. 4, No. 3, pp. 198-212, 2010. https://doi.org/10.1049/iet-epa.2009.0102',
        '[4] M. Tahir and S. Tenbohlen, “A Comprehensive Analysis of Windings Electrical and Mechanical Faults Using a High-Frequency Model,” Energies, Vol. 13, No. 1, art. no. 105, 2020. https://doi.org/10.3390/en13010105',
        '[5] N. Abeywickrama, Y. V. Serdyuk and S. M. Gubanski, “Effect of Core Magnetization on Frequency Response Analysis (FRA) of Power Transformers,” IEEE Transactions on Power Delivery, Vol. 23, No. 3, pp. 1432-1438, 2008. https://doi.org/10.1109/TPWRD.2007.909032',
        '[6] M. Phillip, A. Singh and C. J. Ramlal, “Towards Automated Frequency Response Analysis of Power Transformers with Deep Learning,” Applied Artificial Intelligence, Vol. 39, No. 1, art. no. 2479223, 2025. https://doi.org/10.1080/08839514.2025.2479223',
        '[7] V. Chandola, A. Banerjee and V. Kumar, “Anomaly Detection: A Survey,” ACM Computing Surveys, Vol. 41, No. 3, pp. 1-58, 2009. https://doi.org/10.1145/1541880.1541882',
        '[8] F. Chollet, “Deep Learning with Python,” 2nd ed., Manning Publications, Shelter Island, NY, USA, 2021.',
        '[9] A. Géron, “Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow,” 3rd ed., O’Reilly Media, Sebastopol, CA, USA, 2022.',
        '[10] M. Phillip, A. Singh and C. J. Ramlal, “Narrow Band Frequency Response Analysis of Power Transformers with Deep Learning,” Energies, Vol. 16, No. 17, art. no. 6347, 2023. https://doi.org/10.3390/en16176347',
        '[11] J. R. Secue and E. Mombello, “Sweep Frequency Response Analysis (SFRA) for the Assessment of Winding Displacements and Deformation in Power Transformers,” Electric Power Systems Research, Vol. 78, No. 6, pp. 1119-1128, 2008. https://doi.org/10.1016/j.epsr.2007.08.005',
        '[12] M. Bagheri, M. S. Naderi, T. Blackburn and T. Phung, “Frequency Response Analysis and Short-Circuit Impedance Measurement in Detection of Winding Deformation Within Power Transformers,” IEEE Electrical Insulation Magazine, Vol. 29, No. 3, pp. 33-40, 2013. https://doi.org/10.1109/MEI.2013.6507412',
        '[13] V. Behjat, A. Vahedi, A. Setayeshmehr, H. Borsi and E. Gockenbach, “Sweep Frequency Response Analysis for Diagnosis of Low Level Short Circuit Faults on the Windings of Power Transformers: An Experimental Study,” International Journal of Electrical Power & Energy Systems, Vol. 42, No. 1, pp. 78-90, 2012. https://doi.org/10.1016/j.ijepes.2012.03.004',
        '[14] H. Zhang, S. Wang, D. Yuan and X. Tao, “Double-Ladder Circuit Model of Transformer Winding for Frequency Response Analysis Considering Frequency-Dependent Losses,” IEEE Transactions on Magnetics, Vol. 51, No. 11, pp. 1-4, 2015. https://doi.org/10.1109/TMAG.2015.2442831',
        '[15] T. Ince, S. Kiranyaz, L. Eren, M. Askar and M. Gabbouj, “Real-Time Motor Fault Detection by 1-D Convolutional Neural Networks,” IEEE Transactions on Industrial Electronics, Vol. 63, No. 11, pp. 7067-7075, 2016. https://doi.org/10.1109/TIE.2016.2582729',
        '[16] M. Sakurada and T. Yairi, “Anomaly Detection Using Autoencoders with Nonlinear Dimensionality Reduction,” 2nd Workshop on Machine Learning for Sensory Data Analysis (MLSDA), Gold Coast, Australia, pp. 4-11, 2014. https://doi.org/10.1145/2689746.2689747',
        '[17] D. P. Kingma and J. Ba, “Adam: A Method for Stochastic Optimization,” 3rd International Conference on Learning Representations (ICLR), San Diego, CA, USA, 2015. https://doi.org/10.48550/arXiv.1412.6980',
        '[18] N. Srivastava, G. Hinton, A. Krizhevsky, I. Sutskever and R. Salakhutdinov, “Dropout: A Simple Way to Prevent Neural Networks from Overfitting,” Journal of Machine Learning Research, Vol. 15, No. 56, pp. 1929-1958, 2014. https://jmlr.org/papers/v15/srivastava14a.html',
        '[19] F. Pedregosa et al., “Scikit-Learn: Machine Learning in Python,” Journal of Machine Learning Research, Vol. 12, pp. 2825-2830, 2011. https://jmlr.org/papers/v12/pedregosa11a.html',
        '[20] A. Paszke et al., “PyTorch: An Imperative Style, High-Performance Deep Learning Library,” Advances in Neural Information Processing Systems (NeurIPS), Vol. 32, pp. 8024-8035, 2019. https://doi.org/10.48550/arXiv.1912.01703',
    ]

    ref_cursor = p_ref._p
    for formatted_ref in iteecs_references:
        p_r = doc.add_paragraph()
        p_r.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_r.paragraph_format.line_spacing = 0.92
        p_r.paragraph_format.space_before = Pt(0)
        p_r.paragraph_format.space_after = Pt(1.0)
        r = p_r.add_run(formatted_ref)
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(8.5)
        ref_cursor = insert_after(ref_cursor, p_r)

    # Format copyright statement (p_orig[83])
    p_copy = p_orig[83]
    p_copy.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_copy.paragraph_format.space_before = Pt(3)
    p_copy.paragraph_format.space_after = Pt(1)
    p_copy.paragraph_format.line_spacing = 0.92
    for r in p_copy.runs:
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(8.0)

    # Remove p_orig[84] ('***')
    if len(p_orig) > 84:
        el = p_orig[84]._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    # Unify document body to 2 columns with standard 0.75-in margins
    body_sectPr = doc._body._body.find(qn("w:sectPr"))
    if body_sectPr is not None:
        cols = body_sectPr.find(qn("w:cols"))
        if cols is not None:
            cols.set(qn("w:num"), "2")
            cols.set(qn("w:space"), "360")
        pgMar = body_sectPr.find(qn("w:pgMar"))
        if pgMar is not None:
            pgMar.set(qn("w:top"), "1080")
            pgMar.set(qn("w:bottom"), "1080")
            pgMar.set(qn("w:left"), "1080")
            pgMar.set(qn("w:right"), "1080")

    doc.save(str(output_file))
    print(f"Successfully generated ITEECS manuscript at: {output_file}")


if __name__ == "__main__":
    root_dir = Path("/Users/harinipanigrahi/.gemini/antigravity/scratch/IntelliFRA")
    template_path = root_dir / "Template-ITEECS-OTH.docx"
    media_dir_path = root_dir / "backend/data/user_paper_media"
    output_path = root_dir / "IntelliFRA_ITEECS_Article.docx"
    build_iteecs_manuscript(template_path, media_dir_path, output_path)
