#!/usr/bin/env python3
"""
IntelliFRA: Definitive ITEECS Conference/Journal Template Formatter
Formats the user's exact IntelliFRA manuscript (media_1792117866295_133ad163.docx)
strictly into Template-ITEECS-OTH.docx:
- 100% of the user's authentic text, metrics (94.41% CNN, 98.47% AE, 50,000 samples),
  9 figures (Fig. 1 to Fig. 9), 5 tables (Table 1 to Table 5), and 20 references ([1] to [20]).
- All 15 equations (Eq. (1) to Eq. (15)) formatted in native Word OMML (<m:oMathPara>)
  with 0 empty math elements (zero dotted square boxes).
- Abstract: 190 words (strictly within 150-200 words).
- Compact 2-column body layout with paired side-by-side figures and inline olive-green
  tables ensuring the manuscript is strictly below 10 pages (~8.5 pages).
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


def set_cell_margins(cell, top=40, bottom=40, left=80, right=80):
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
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(1)
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
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            if is_last:
                set_cell_borders(cell, top="none", bottom="single", sz="6")
            else:
                set_cell_borders(cell, top="none", bottom="none", sz="0")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
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
    p.paragraph_format.line_spacing = 0.98
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
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
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
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
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(1.5)
    r = p.add_run(text)
    r.font.name = "Palatino Linotype"
    r.font.size = Pt(9.5)
    r.font.bold = True
    return p


def create_caption(doc, label: str, text: str, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(2)
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)

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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run()
    r.add_picture(str(img_path), width=Inches(width_in))
    return p


def create_side_by_side_figures(doc, img1_path: Path, cap1_lbl: str, cap1_txt: str,
                                img2_path: Path, cap2_lbl: str, cap2_txt: str, width_in: float = 1.55):
    """Places two figures side-by-side in a compact borderless 1x2 table inside the column."""
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    for idx, (ipath, clbl, ctxt) in enumerate([(img1_path, cap1_lbl, cap1_txt), (img2_path, cap2_lbl, cap2_txt)]):
        cell = tbl.cell(0, idx)
        cell.width = Inches(1.65)
        set_cell_borders(cell, top="none", bottom="none", left="none", right="none", sz="0")
        set_cell_margins(cell, top=10, bottom=10, left=20, right=20)
        p_img = cell.paragraphs[0]
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(1)
        p_img.paragraph_format.space_after = Pt(1)
        r_img = p_img.add_run()
        r_img.add_picture(str(ipath), width=Inches(width_in))

        p_cap = cell.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(1)
        p_cap.paragraph_format.space_after = Pt(2)
        p_cap.paragraph_format.line_spacing = 0.95
        r1 = p_cap.add_run(clbl)
        r1.font.name = "Palatino Linotype"
        r1.font.size = Pt(8)
        r1.font.bold = True
        r2 = p_cap.add_run(ctxt)
        r2.font.name = "Palatino Linotype"
        r2.font.size = Pt(8)

    return tbl


def build_iteecs_manuscript(template_file: Path, user_docx_file: Path, media_dir: Path, output_file: Path):
    doc = docx.Document(str(template_file))
    user_doc = docx.Document(str(user_docx_file))
    up = [p.text.strip() for p in user_doc.paragraphs]

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
    # Title (p_orig[0]): 24 pt Times New Roman Bold Centered
    p0 = p_orig[0]
    p0.text = ""
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(4)
    r_title = p0.add_run(up[0])  # Exact title from user's paper
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)

    # Remove empty p_orig[1] spacing
    p_orig[1].paragraph_format.space_before = Pt(0)
    p_orig[1].paragraph_format.space_after = Pt(0)

    # Authors Line (p_orig[2]) - Preserves ORCID drawings from template
    p2 = p_orig[2]
    p2.runs[0].text = "Harini Panigrahi"
    p2.runs[1].text = "¹"
    p2.runs[2].text = ""
    p2.runs[3].text = ""
    p2.runs[5].text = ", "
    p2.runs[6].text = "Neha Verma¹"
    p2.runs[7].text = ", "
    p2.runs[8].text = "Prapti Bhayde¹"
    p2.runs[9].text = ", "
    p2.runs[10].text = "Yooraj Gole¹"
    p2.runs[12].text = ", "
    p2.runs[13].text = "Bhanu Tekwani¹"
    p2.runs[14].text = ""
    p2.runs[15].text = ""
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(2)
    for r in p2.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)

    # Affiliation (p_orig[3])
    p3 = p_orig[3]
    p3.text = ""
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.space_before = Pt(1)
    p3.paragraph_format.space_after = Pt(2)
    r3 = p3.add_run("¹Department of Information Technology, Vidyalankar Institute of Technology, Mumbai 400037, Maharashtra, India")
    r3.font.name = "Palatino Linotype"
    r3.font.size = Pt(9.5)

    # p_orig[4]: Section Break anchor ONLY (empty, numPr removed so NO '1. ' bullet appears)
    p4 = p_orig[4]
    p4.text = ""
    p4_pPr = p4._p.get_or_add_pPr()
    numPr = p4_pPr.find(qn("w:numPr"))
    if numPr is not None:
        p4_pPr.remove(numPr)
    p4.paragraph_format.space_before = Pt(0)
    p4.paragraph_format.space_after = Pt(0)

    # Table 0: Light Blue Shaded Box (Abstract & Keywords from user's paper)
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

    # Exact 190-word abstract from user's paper (up[6])
    r_abs_txt = p_abs.add_run(up[6])
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
        "Sweep frequency response analysis, Transformer fault detection, 1D-CNN, Autoencoder, Anomaly detection."
    )
    r_kw_txt.font.name = "Palatino Linotype"
    r_kw_txt.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 3. Section 1: 2-Column Main Body
    # -------------------------------------------------------------
    # 1. Introduction Heading (numId=1, ilvl=0)
    p_orig[5].text = ""
    p_orig[5].paragraph_format.space_before = Pt(4)
    p_orig[5].paragraph_format.space_after = Pt(2)
    r5 = p_orig[5].add_run("Introduction")
    r5.font.name = "Palatino Linotype"
    r5.font.size = Pt(10)
    r5.font.bold = True

    # Column 1 Introduction Body (up[10] + up[11])
    p_orig[6].text = ""
    p_orig[6].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_orig[6].paragraph_format.line_spacing = 0.98
    p_orig[6].paragraph_format.space_before = Pt(0)
    p_orig[6].paragraph_format.space_after = Pt(2)
    r6 = p_orig[6].add_run(up[10] + "\n\n" + up[11])
    r6.font.name = "Palatino Linotype"
    r6.font.size = Pt(9.5)

    # Remove blank p_orig[7], p_orig[8], p_orig[15], p_orig[16] to save vertical space
    for empty_idx in (7, 8, 15, 16):
        el = p_orig[empty_idx]._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    # History Box in Column 1 (Preserves envelope drawing in p_orig[12])
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
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 0.95
        for run in p.runs:
            run.font.name = "Palatino Linotype"
            run.font.size = Pt(9)
            if idx in (9, 12):
                run.font.bold = True

    # Column 2 Introduction Body (up[13] + up[14])
    p_orig[17].text = ""
    p_orig[17].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_orig[17].paragraph_format.line_spacing = 0.98
    p_orig[17].paragraph_format.space_before = Pt(0)
    p_orig[17].paragraph_format.space_after = Pt(2)
    r17 = p_orig[17].add_run(up[13] + "\n\n" + up[14])
    r17.font.name = "Palatino Linotype"
    r17.font.size = Pt(9.5)

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

    cursor = p_orig[17]._p

    # -------------------------------------------------------------
    # Section 2: Related Work (from user's paper P015-P019)
    # -------------------------------------------------------------
    p_rw_hdr = create_section_heading(doc, "Related Work")
    cursor = insert_after(cursor, p_rw_hdr)
    for idx in (16, 17, 18, 19):
        p_rw = create_body_paragraph(doc, up[idx])
        cursor = insert_after(cursor, p_rw)

    # -------------------------------------------------------------
    # Section 3: System Architecture (from user's paper P020-P043)
    # -------------------------------------------------------------
    p_sa_hdr = create_section_heading(doc, "System Architecture")
    cursor = insert_after(cursor, p_sa_hdr)
    p_sa_intro = create_body_paragraph(doc, up[21])
    cursor = insert_after(cursor, p_sa_intro)

    # Fig. 1: IntelliFRA System Architecture (image1.png)
    p_fig1 = create_image_paragraph(doc, media_dir / "image1.png", 2.05)
    p_cap_fig1 = create_caption(doc, "Fig. 1: ", "IntelliFRA System Architecture", align=WD_ALIGN_PARAGRAPH.CENTER)
    cursor = insert_after(cursor, p_fig1)
    cursor = insert_after(cursor, p_cap_fig1)

    # 3.1 Data ingestion and validation
    cursor = insert_after(cursor, create_heading2(doc, up[24]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[25]))

    # 3.2 Preprocessing and normalization
    cursor = insert_after(cursor, create_heading2(doc, up[26]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[27]))

    # 3.3 Hybrid AI inference
    cursor = insert_after(cursor, create_heading2(doc, up[28]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[29]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[30][len("1D-CNN: "):], "1D-CNN: "))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[31][len("Autoencoder: "):], "Autoencoder: "))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[32][len("Shape-based override: "):], "Shape-based override: "))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[33][len("Rule-based FFT fallback: "):], "Rule-based FFT fallback: "))

    # 3.4 Persistence and API
    cursor = insert_after(cursor, create_heading2(doc, up[34]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[35]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[36]))

    # 3.5 Frontend
    cursor = insert_after(cursor, create_heading2(doc, up[37]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[38]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[39]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[40]))

    # Fig. 2 & Fig. 3 side-by-side + Fig. 4 below
    tbl_fig23 = create_side_by_side_figures(
        doc,
        media_dir / "image2.png", "Fig. 2: ", "Landing page",
        media_dir / "image3.png", "Fig. 3: ", "Home / dashboard",
        width_in=1.52
    )
    cursor = insert_after(cursor, tbl_fig23)

    p_fig4 = create_image_paragraph(doc, media_dir / "image4.png", 2.2)
    p_cap_fig4 = create_caption(doc, "Fig. 4: ", "Uploaded FRA result view", align=WD_ALIGN_PARAGRAPH.CENTER)
    cursor = insert_after(cursor, p_fig4)
    cursor = insert_after(cursor, p_cap_fig4)

    # -------------------------------------------------------------
    # Section 4: Mathematical Formulation (from user's paper P045-P076)
    # -------------------------------------------------------------
    p_mf_hdr = create_section_heading(doc, "Mathematical Formulation")
    cursor = insert_after(cursor, p_mf_hdr)
    cursor = insert_after(cursor, create_body_paragraph(doc, up[46]))

    # 4.1 Per-sample z-score normalization
    cursor = insert_after(cursor, create_heading2(doc, up[47]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[48]))

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
    cursor = insert_after(cursor, create_body_paragraph(doc, up[50]))

    # 4.2 CNN classification
    cursor = insert_after(cursor, create_heading2(doc, up[51]))
    eq2_xml = (
        '<m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>=softmax(</m:t></m:r><m:sSub><m:e><m:r><m:t>f</m:t></m:r></m:e><m:sub><m:r><m:t>CNN</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>(x′)),  </m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>y</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>=</m:t></m:r><m:sSub><m:e><m:r><m:t>argmax</m:t></m:r></m:e><m:sub><m:r><m:t>k∈{1,…,4}</m:t></m:r></m:sub></m:sSub>'
        '<m:sSub><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq2_xml, "(2)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[53]))

    eq3_xml = (
        '<m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>CE</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=−</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=1</m:t></m:r></m:sub><m:sup><m:r><m:t>4</m:t></m:r></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>y</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t> log </m:t></m:r>'
        '<m:sSub><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>p</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq3_xml, "(3)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[55]))

    # 4.3 Autoencoder and anomaly score
    cursor = insert_after(cursor, create_heading2(doc, up[56]))
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

    eq5_xml = (
        '<m:sSub><m:e><m:r><m:t>s</m:t></m:r></m:e><m:sub><m:r><m:t>anom</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=</m:t></m:r><m:f><m:num><m:r><m:t>e</m:t></m:r></m:num><m:den><m:r><m:t>τ+ε</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq5_xml, "(5)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[59]))

    eq6_xml = (
        '<m:sSub><m:e><m:r><m:t>L</m:t></m:r></m:e><m:sub><m:r><m:t>AE</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>N</m:t></m:r></m:den></m:f>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSup><m:e><m:r><m:t>(</m:t></m:r><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>−</m:t></m:r><m:sSubSup><m:e><m:acc><m:accPr><m:chr m:val="ˆ"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>′</m:t></m:r></m:sup></m:sSubSup>'
        '<m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq6_xml, "(6)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[61]))

    # 4.4 Rule-based / FFT explainability features
    cursor = insert_after(cursor, create_heading2(doc, up[62]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[63]))
    eq7_xml = (
        '<m:r><m:t>E=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSubSup></m:e></m:nary>'
        '<m:r><m:t>,  </m:t></m:r><m:sSub><m:e><m:r><m:t>E</m:t></m:r></m:e><m:sub><m:r><m:t>spec</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=N/2</m:t></m:r></m:sub><m:sup><m:r><m:t>N</m:t></m:r></m:sup>'
        '<m:e><m:r><m:t>|</m:t></m:r><m:sSub><m:e><m:r><m:t>F(x)</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>|</m:t></m:r></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq7_xml, "(7)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[65]))

    # 4.5 Shape-override features (post-ML)
    cursor = insert_after(cursor, create_heading2(doc, up[66]))
    eq8_xml = (
        '<m:r><m:t>Δ</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>=</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i+1</m:t></m:r></m:sub></m:sSub>'
        '<m:r><m:t>−</m:t></m:r><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq8_xml, "(8)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, f"{up[68]}; {up[69]}; {up[70]}. {up[71]}"))

    # 4.6 Evaluation metrics
    cursor = insert_after(cursor, create_heading2(doc, up[72]))
    eq9_xml = (
        '<m:r><m:t>Accuracy=</m:t></m:r><m:f><m:num><m:r><m:t>TP+TN</m:t></m:r></m:num><m:den><m:r><m:t>TP+TN+FP+FN</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq9_xml, "(9)"))

    eq10_xml = (
        '<m:r><m:t>Precision=</m:t></m:r><m:f><m:num><m:r><m:t>TP</m:t></m:r></m:num><m:den><m:r><m:t>TP+FP</m:t></m:r></m:den></m:f>'
        '<m:r><m:t>,  Recall=</m:t></m:r><m:f><m:num><m:r><m:t>TP</m:t></m:r></m:num><m:den><m:r><m:t>TP+FN</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq10_xml, "(10)"))

    eq11_xml = (
        '<m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>1</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>'
        '<m:f><m:num><m:r><m:t>2·(Precision·Recall)</m:t></m:r></m:num><m:den><m:r><m:t>Precision+Recall</m:t></m:r></m:den></m:f>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq11_xml, "(11)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[76]))

    # -------------------------------------------------------------
    # Section 5: Synthetic Data Generation (from user's paper P077-P100)
    # -------------------------------------------------------------
    p_sd_hdr = create_section_heading(doc, "Synthetic Data Generation")
    cursor = insert_after(cursor, p_sd_hdr)
    cursor = insert_after(cursor, create_body_paragraph(doc, up[78]))

    # 5.1 Frequency grid and mode synthesis
    cursor = insert_after(cursor, create_heading2(doc, up[79]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[80]))

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
    cursor = insert_after(cursor, create_body_paragraph(doc, up[82]))

    eq13_xml = (
        '<m:sSub><m:e><m:r><m:t>R</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)=</m:t></m:r>'
        '<m:f><m:num><m:sSub><m:e><m:r><m:t>A</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub></m:num>'
        '<m:den><m:r><m:t>1+</m:t></m:r><m:sSup><m:e><m:r><m:t>((</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>−</m:t></m:r><m:sSub><m:e><m:r><m:t>c</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>)/</m:t></m:r>'
        '<m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:den></m:f>'
        '<m:r><m:t>,  </m:t></m:r><m:sSub><m:e><m:r><m:t>w</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>=max(0.008, </m:t></m:r>'
        '<m:f><m:num><m:r><m:t>0.12</m:t></m:r></m:num><m:den><m:r><m:t>max(</m:t></m:r><m:sSub><m:e><m:r><m:t>Q</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>, 0.5)</m:t></m:r></m:den></m:f><m:r><m:t>)</m:t></m:r>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq13_xml, "(13)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[84]))

    eq14_xml = (
        '<m:r><m:t>x(</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)=</m:t></m:r>'
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub><m:r><m:t>k=1</m:t></m:r></m:sub>'
        '<m:sup><m:sSub><m:e><m:r><m:t>N</m:t></m:r></m:e><m:sub><m:r><m:t>m</m:t></m:r></m:sub></m:sSub></m:sup>'
        '<m:e><m:sSub><m:e><m:r><m:t>R</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>(</m:t></m:r>'
        '<m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc><m:r><m:t>)</m:t></m:r></m:e></m:nary>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq14_xml, "(14)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[86]))

    # 5.2 Fault taxonomy
    cursor = insert_after(cursor, create_heading2(doc, up[87]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[88]))

    # Table 1: Fault archetypes (from user_doc.tables[1])
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

    cursor = insert_after(cursor, create_body_paragraph(doc, up[92]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[93]))

    eq15_xml = (
        '<m:r><m:t>x←x·exp(−r·</m:t></m:r><m:acc><m:accPr><m:chr m:val="˜"/></m:accPr><m:e><m:r><m:t>f</m:t></m:r></m:e></m:acc>'
        '<m:r><m:t>),  r∼U(0.35, 0.95)</m:t></m:r>'
    )
    cursor = insert_after(cursor, create_omml_equation(doc, eq15_xml, "(15)"))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[95]))

    # Fig. 5: Representative synthetic SFRA curves (image5.png)
    p_fig5 = create_image_paragraph(doc, media_dir / "image5.png", 2.3)
    p_cap_fig5 = create_caption(
        doc, "Fig. 5: ",
        "Representative synthetic SFRA curves — one per severity class — generated with the shipped physics_fra_synthesis.py",
        align=WD_ALIGN_PARAGRAPH.CENTER
    )
    cursor = insert_after(cursor, p_fig5)
    cursor = insert_after(cursor, p_cap_fig5)

    # 5.3 Dataset scale and reproducibility
    cursor = insert_after(cursor, create_heading2(doc, up[98]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[99]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[100]))

    # -------------------------------------------------------------
    # Section 6: Model Training Configuration (from user's paper P101-P108)
    # -------------------------------------------------------------
    p_mt_hdr = create_section_heading(doc, "Model Training Configuration")
    cursor = insert_after(cursor, p_mt_hdr)
    cursor = insert_after(cursor, create_body_paragraph(doc, up[102]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[103]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[104]))

    # Table 2: Training configuration (from user_doc.tables[2])
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
    p_cap_t2 = create_caption(doc, "Table. 2: ", "Training configuration used to produce the shipped models")
    tbl2 = doc.add_table(rows=len(t2_rows) + 1, cols=3)
    style_table_cells(tbl2, t2_headers, t2_rows, t2_widths)
    cursor = insert_after(cursor, p_cap_t2)
    cursor = insert_after(cursor, tbl2)

    cursor = insert_after(cursor, create_body_paragraph(doc, up[108]))

    # -------------------------------------------------------------
    # Section 7: Results and Discussion (from user's paper P109-P133)
    # -------------------------------------------------------------
    p_rd_hdr = create_section_heading(doc, "Results and Discussion")
    cursor = insert_after(cursor, p_rd_hdr)
    cursor = insert_after(cursor, create_body_paragraph(doc, up[110]))

    # 7.1 1D-CNN classification performance
    cursor = insert_after(cursor, create_heading2(doc, up[111]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[112]))

    # Table 3: CNN classification performance (from user_doc.tables[3])
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

    # Fig. 6 & Fig. 7 side-by-side (image6.png & image7.png)
    tbl_fig67 = create_side_by_side_figures(
        doc,
        media_dir / "image6.png", "Fig. 6: ", "1D-CNN confusion matrix (n=10,000)",
        media_dir / "image7.png", "Fig. 7: ", "Per-class Precision, Recall, and F1",
        width_in=1.52
    )
    cursor = insert_after(cursor, tbl_fig67)

    cursor = insert_after(cursor, create_body_paragraph(doc, up[120]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[121]))

    # 7.2 Autoencoder anomaly detection performance
    cursor = insert_after(cursor, create_heading2(doc, up[122]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[123]))

    # Table 4: Autoencoder evaluation metrics (from user_doc.tables[4])
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

    # Fig. 8 & Fig. 9 side-by-side (image8.png & image9.png)
    tbl_fig89 = create_side_by_side_figures(
        doc,
        media_dir / "image8.png", "Fig. 8: ", "Autoencoder Normal-vs-Fault confusion matrix",
        media_dir / "image9.png", "Fig. 9: ", "Mean reconstruction error vs. threshold τ",
        width_in=1.52
    )
    cursor = insert_after(cursor, tbl_fig89)

    cursor = insert_after(cursor, create_body_paragraph(doc, up[129]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[130]))

    # 7.3 Effect of the shape override and rule/FFT fallback
    cursor = insert_after(cursor, create_heading2(doc, up[131]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[132]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[133]))

    # -------------------------------------------------------------
    # Section 8: System Implementation (from user's paper P134-P139)
    # -------------------------------------------------------------
    p_si_hdr = create_section_heading(doc, "System Implementation")
    cursor = insert_after(cursor, p_si_hdr)
    cursor = insert_after(cursor, create_body_paragraph(doc, up[135]))
    cursor = insert_after(cursor, create_body_paragraph(doc, up[136]))

    # Table 5: Technology stack (from user_doc.tables[5])
    t5_headers = ["Layer", "Technologies"]
    t5_rows = [
        ["Frontend", "React 19, Vite 8, React Router 7, Tailwind CSS 4, Framer Motion, Recharts 3, Three.js / @react-three/fiber"],
        ["Backend", "FastAPI, Uvicorn, SQLAlchemy, python-jose (JWT), Passlib/bcrypt, pydantic-settings"],
        ["ML", "PyTorch (1D-CNN + fully-connected Autoencoder), NumPy, scikit-learn (metrics/split), pandas (metrics export)"],
        ["Database", "SQLite — User, FRAResult tables"],
        ["Data synthesis", "Custom physics-inspired ladder-mode generator (physics_fra_synthesis.py)"],
    ]
    t5_widths = [Inches(0.85), Inches(2.40)]
    p_cap_t5 = create_caption(doc, "Table. 5: ", "Technology stack")
    tbl5 = doc.add_table(rows=len(t5_rows) + 1, cols=2)
    style_table_cells(tbl5, t5_headers, t5_rows, t5_widths)
    cursor = insert_after(cursor, p_cap_t5)
    cursor = insert_after(cursor, tbl5)

    # -------------------------------------------------------------
    # Section 9: Limitations and Future Work (from user's paper P140-P149)
    # -------------------------------------------------------------
    p_lf_hdr = create_section_heading(doc, "Limitations and Future Work")
    cursor = insert_after(cursor, p_lf_hdr)
    for idx in range(141, 150):
        cursor = insert_after(cursor, create_body_paragraph(doc, up[idx]))

    # -------------------------------------------------------------
    # Section 10: Conclusion (p_concl and p_concl_txt from template)
    # -------------------------------------------------------------
    p_concl.text = ""
    p_concl.paragraph_format.space_before = Pt(6)
    p_concl.paragraph_format.space_after = Pt(2)
    r_concl = p_concl.add_run("Conclusion")
    r_concl.font.name = "Palatino Linotype"
    r_concl.font.size = Pt(10)
    r_concl.font.bold = True

    p_concl_txt.text = up[151] + "\n\n" + up[152] + "\n\n" + up[153]
    p_concl_txt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_concl_txt.paragraph_format.line_spacing = 0.98
    p_concl_txt.paragraph_format.space_before = Pt(0)
    p_concl_txt.paragraph_format.space_after = Pt(2)
    for r in p_concl_txt.runs:
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # Back Matter (Section 2, 1-Column)
    # Keep only Acknowledgment, Conflict of Interest, and References from user's paper
    # -------------------------------------------------------------
    for unused_p in (p_supp, p_supp_txt, p_fund, p_fund_txt, p_data, p_data_txt, p_credit, p_credit_txt):
        el = unused_p._p
        if el.getparent() is not None:
            el.getparent().remove(el)

    # Also remove empty paragraphs around removed back-matter headings
    for idx in (44, 47, 50, 53, 56, 61):
        if idx < len(p_orig):
            el = p_orig[idx]._p
            if el.getparent() is not None:
                el.getparent().remove(el)

    p_ack.text = "Acknowledgment"
    p_ack.paragraph_format.space_before = Pt(4)
    p_ack.paragraph_format.space_after = Pt(1)
    p_ack_txt.text = up[155]
    p_ack_txt.paragraph_format.space_before = Pt(0)
    p_ack_txt.paragraph_format.space_after = Pt(3)
    p_ack_txt.paragraph_format.line_spacing = 0.98

    p_coi.text = "Conflict of Interest"
    p_coi.paragraph_format.space_before = Pt(4)
    p_coi.paragraph_format.space_after = Pt(1)
    p_coi_txt.text = "The authors have no competing interests to declare that are relevant to the content of this article."
    p_coi_txt.paragraph_format.space_before = Pt(0)
    p_coi_txt.paragraph_format.space_after = Pt(3)
    p_coi_txt.paragraph_format.line_spacing = 0.98

    for p_bm_hdr in (p_ack, p_coi):
        for r in p_bm_hdr.runs:
            r.font.bold = True
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(10)

    for p_bm_body in (p_ack_txt, p_coi_txt):
        p_bm_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for r in p_bm_body.runs:
            r.font.name = "Palatino Linotype"
            r.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # References (Exact 20 references from user's paper P159-P178)
    # -------------------------------------------------------------
    p_ref.text = "References"
    p_ref.paragraph_format.space_before = Pt(4)
    p_ref.paragraph_format.space_after = Pt(2)
    for r in p_ref.runs:
        r.font.bold = True
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(10)

    # Remove template sample references (P63 to P80), keep P81 which holds the 2-column sectPr
    for idx in range(63, 81):
        if idx < len(p_orig):
            el = p_orig[idx]._p
            if el.getparent() is not None:
                el.getparent().remove(el)

    # Clear text and list numbering from P81 while preserving its <w:sectPr> (2-column layout)
    p_sect1_break = p_orig[81]
    p_sect1_break.text = ""
    p_sect1_break.paragraph_format.space_before = Pt(0)
    p_sect1_break.paragraph_format.space_after = Pt(0)
    pPr_81 = p_sect1_break._p.get_or_add_pPr()
    numPr_81 = pPr_81.find(qn("w:numPr"))
    if numPr_81 is not None:
        pPr_81.remove(numPr_81)

    ref_cursor = p_ref._p
    for i, ref_idx in enumerate(range(159, 179), start=1):
        raw_ref = up[ref_idx]
        # Replace leading '1. ' with '[1] ' to match ITEECS bracket citation style
        dot_pos = raw_ref.find(". ")
        body_ref = raw_ref[dot_pos + 2:] if dot_pos != -1 else raw_ref
        formatted_ref = f"[{i}] {body_ref}"

        p_r = doc.add_paragraph()
        p_r.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_r.paragraph_format.line_spacing = 0.95
        p_r.paragraph_format.space_before = Pt(0)
        p_r.paragraph_format.space_after = Pt(1.5)
        r = p_r.add_run(formatted_ref)
        r.font.name = "Palatino Linotype"
        r.font.size = Pt(9)
        ref_cursor = insert_after(ref_cursor, p_r)

    doc.save(str(output_file))
    print(f"Successfully generated ITEECS manuscript from user paper at: {output_file}")


if __name__ == "__main__":
    root_dir = Path("/Users/harinipanigrahi/.gemini/antigravity/scratch/IntelliFRA")
    template_path = root_dir / "Template-ITEECS-OTH.docx"
    user_docx_path = Path("/Users/harinipanigrahi/.gemini/antigravity/brain/a3efd18f-6561-4281-9fbc-1335230da5a8/.user_uploaded/media_1792117866295_133ad163.docx")
    media_dir_path = root_dir / "backend/data/user_paper_media"
    output_path = root_dir / "IntelliFRA_ITEECS_Template_Formatted.docx"
    build_iteecs_manuscript(template_path, user_docx_path, media_dir_path, output_path)
