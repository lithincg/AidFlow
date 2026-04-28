import copy
import shutil
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def qn(prefix, tag):
    return f"{{{NS[prefix]}}}{tag}"


def slide_path(root, number):
    return root / "ppt" / "slides" / f"slide{number}.xml"


def rels_path(root, number):
    return root / "ppt" / "slides" / "_rels" / f"slide{number}.xml.rels"


def load_slide(root, number):
    return ET.parse(slide_path(root, number))


def sp_tree(slide_root):
    return slide_root.find("p:cSld/p:spTree", NS)


def shape_text(shape):
    return " ".join((node.text or "").strip() for node in shape.findall(".//a:t", NS)).strip()


def find_shape(slide_root, contains_text):
    for shape in sp_tree(slide_root).findall("p:sp", NS):
      if contains_text in shape_text(shape):
        return shape
    raise ValueError(f"Could not find shape containing: {contains_text}")


def next_shape_id(slide_root):
    ids = []
    for node in slide_root.findall(".//p:cNvPr", NS):
        try:
            ids.append(int(node.attrib["id"]))
        except Exception:
            pass
    return max(ids, default=100) + 1


def set_shape_meta(shape, shape_id, name):
    cNvPr = shape.find("p:nvSpPr/p:cNvPr", NS)
    if cNvPr is None:
        cNvPr = shape.find("p:nvPicPr/p:cNvPr", NS)
    cNvPr.attrib["id"] = str(shape_id)
    cNvPr.attrib["name"] = name


def set_xfrm(shape, x, y, cx, cy):
    xfrm = shape.find("p:spPr/a:xfrm", NS)
    if xfrm is None:
        xfrm = shape.find("p:pic/p:spPr/a:xfrm", NS)
    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    off.attrib["x"] = str(x)
    off.attrib["y"] = str(y)
    ext.attrib["cx"] = str(cx)
    ext.attrib["cy"] = str(cy)


def paragraph_template(shape, index=0):
    paragraphs = shape.find("p:txBody", NS).findall("a:p", NS)
    return copy.deepcopy(paragraphs[min(index, len(paragraphs) - 1)])


def set_run_color(run_props, rgb):
    for child in list(run_props):
        if child.tag.endswith("solidFill"):
            run_props.remove(child)
    solid = ET.SubElement(run_props, qn("a", "solidFill"))
    ET.SubElement(solid, qn("a", "srgbClr"), {"val": rgb})


def make_paragraph(template_paragraph, text, color=None):
    paragraph = copy.deepcopy(template_paragraph)
    for child in list(paragraph):
        if child.tag != qn("a", "pPr"):
            paragraph.remove(child)

    run_props_source = template_paragraph.find("a:r/a:rPr", NS)
    if run_props_source is None:
        run_props_source = template_paragraph.find("a:endParaRPr", NS)
    run = ET.SubElement(paragraph, qn("a", "r"))
    run_props = copy.deepcopy(run_props_source)
    if color:
        set_run_color(run_props, color)
    run.append(run_props)
    text_node = ET.SubElement(run, qn("a", "t"))
    text_node.text = text

    end_props = template_paragraph.find("a:endParaRPr", NS)
    if end_props is not None:
        end_copy = copy.deepcopy(end_props)
        if color:
            set_run_color(end_copy, color)
        paragraph.append(end_copy)
    return paragraph


def replace_paragraphs(shape, paragraphs):
    tx_body = shape.find("p:txBody", NS)
    existing = tx_body.findall("a:p", NS)
    for paragraph in existing:
        tx_body.remove(paragraph)
    for paragraph in paragraphs:
        tx_body.append(paragraph)


def clone_textbox(donor_shape, shape_id, name, x, y, cx, cy, paragraphs):
    new_shape = copy.deepcopy(donor_shape)
    set_shape_meta(new_shape, shape_id, name)
    set_xfrm(new_shape, x, y, cx, cy)
    replace_paragraphs(new_shape, paragraphs)
    return new_shape


def add_textbox(slide_root, donor_shape, name, x, y, cx, cy, paragraphs):
    new_shape = clone_textbox(donor_shape, next_shape_id(slide_root), name, x, y, cx, cy, paragraphs)
    sp_tree(slide_root).append(new_shape)


def set_existing_shape_text(shape, paragraph_texts, template_indexes=None, color=None):
    if template_indexes is None:
        template_indexes = [0] * len(paragraph_texts)
    paragraphs = []
    for idx, text in zip(template_indexes, paragraph_texts):
        paragraphs.append(make_paragraph(paragraph_template(shape, idx), text, color=color))
    replace_paragraphs(shape, paragraphs)


def ensure_image_on_slide(extract_root, slide_number, image_path, rel_id, name, x, y, cx, cy):
    media_dir = extract_root / "ppt" / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    target_name = f"aidflow-preview{image_path.suffix.lower()}"
    shutil.copyfile(image_path, media_dir / target_name)

    rels_file = rels_path(extract_root, slide_number)
    rels_tree = ET.parse(rels_file)
    rels_root = rels_tree.getroot()
    relationship_tag = "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"
    rel = ET.Element(
        relationship_tag,
        {
            "Id": rel_id,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            "Target": f"../media/{target_name}",
        },
    )
    rels_root.append(rel)
    rels_tree.write(rels_file, encoding="UTF-8", xml_declaration=True)

    slide_tree = load_slide(extract_root, slide_number)
    slide_root = slide_tree.getroot()
    donor_pic = sp_tree(slide_root).find("p:pic", NS)
    new_pic = copy.deepcopy(donor_pic)
    set_shape_meta(new_pic, next_shape_id(slide_root), name)
    blip = new_pic.find("p:blipFill/a:blip", NS)
    blip.attrib[f"{{{NS['r']}}}embed"] = rel_id
    set_xfrm(new_pic, x, y, cx, cy)
    src_rect = new_pic.find("p:blipFill/a:srcRect", NS)
    if src_rect is not None:
        new_pic.find("p:blipFill", NS).remove(src_rect)
    slide_root.find("p:cSld/p:spTree", NS).append(new_pic)
    slide_tree.write(slide_path(extract_root, slide_number), encoding="UTF-8", xml_declaration=True)


def zip_dir(source_dir, output_file):
    with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(source_dir.rglob("*")):
            archive.write(path, path.relative_to(source_dir))


def main():
    template_ppt = Path(r"C:\Users\lithi\GitHub\demo\[EXT] Solution Challenge 2026 - Prototype PPT Template(1).pptx")
    preview_image = Path(r"C:\Users\lithi\GitHub\demo\product-demo-preview.png")
    output_ppt = Path(r"C:\Users\lithi\GitHub\demo\AidFlow_Solution_Challenge_2026_Updated.pptx")
    work_dir = Path(r"C:\tmp\aidflow_ppt_edit")

    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True)
    with zipfile.ZipFile(template_ppt, "r") as archive:
        archive.extractall(work_dir)

    slide1 = load_slide(work_dir, 1)
    slide2 = load_slide(work_dir, 2)
    slide3 = load_slide(work_dir, 3)
    slide4 = load_slide(work_dir, 4)
    slide5 = load_slide(work_dir, 5)
    slide6 = load_slide(work_dir, 6)
    slide7 = load_slide(work_dir, 7)
    slide8 = load_slide(work_dir, 8)
    slide9 = load_slide(work_dir, 9)
    slide10 = load_slide(work_dir, 10)
    slide11 = load_slide(work_dir, 11)
    slide12 = load_slide(work_dir, 12)
    slide13 = load_slide(work_dir, 13)
    slide14 = load_slide(work_dir, 14)
    slide15 = load_slide(work_dir, 15)

    # Donor shapes and paragraph styles.
    slide1_title = find_shape(slide1.getroot(), "Guidelines")
    slide1_body = find_shape(slide1.getroot(), "Kindly use the given template")
    slide1_note = find_shape(slide1.getroot(), "Note:")
    slide2_body = find_shape(slide2.getroot(), "Team Details")
    slide4_body = find_shape(slide4.getroot(), "Opportunities")
    slide13_body = find_shape(slide13.getroot(), "Provide links to your:")
    slide3_title = find_shape(slide3.getroot(), "Brief about your solution")

    regular_para = paragraph_template(slide13_body, 0)
    regular_small = paragraph_template(slide1_note, 0)
    big_title_para = paragraph_template(slide1_title, 0)

    # Slide 1 cover
    set_existing_shape_text(slide1_title, ["AidFlow"])
    cover_paragraphs = [
        make_paragraph(regular_para, "AI-powered crisis coordination for NGOs"),
        make_paragraph(regular_para, "Team: OneBrainCell"),
        make_paragraph(regular_para, "Team Leader: Lithign CG"),
        make_paragraph(regular_para, "Google Solutions Challenge 2026 prototype"),
    ]
    replace_paragraphs(slide1_body, cover_paragraphs)
    note_paragraphs = [make_paragraph(regular_small, "Live deployment: https://smart-resource-allocatio-3e4d2.web.app/#board")]
    replace_paragraphs(slide1_note, note_paragraphs)

    # Slide 2 team details
    set_existing_shape_text(
        slide2_body,
        [
            "Team Details",
            "",
            "Team name: OneBrainCell",
            "Team leader name: Lithign CG",
            "Problem Statement: NGO coordinators still triage messy field reports manually, causing slow urgency decisions, duplicate dispatches, and poor volunteer matching during crises.",
            "",
        ],
        template_indexes=[0, 1, 2, 3, 4, 5],
    )

    # Generic helper for title-only slides.
    def body_paragraphs(lines):
        return [make_paragraph(regular_para, line) for line in lines]

    # Slide 3
    add_textbox(
        slide3.getroot(),
        slide2_body,
        "AidFlow solution summary",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "AidFlow is a real-time NGO coordination platform built for crisis response.",
                "Gemini converts text, voice, and OCR field reports into structured operational needs.",
                "Firestore keeps a live priority board synced for coordinators.",
                "AI helps deduplicate incidents and recommend the best volunteers for each case.",
            ]
        ),
    )

    # Slide 4
    set_existing_shape_text(
        slide4_body,
        [
            "Opportunities",
            "Unlike generic reporting tools, AidFlow combines multimodal intake, duplicate detection, and volunteer matching in one crisis workflow.",
            "It reduces decision latency by converting messy field reports into structured, prioritized needs that coordinators can act on immediately.",
            "The USP is an AI-native NGO operations loop: intake, reasoning, dispatch, and coordinator feedback all stay in the same live system.",
            "",
        ],
        template_indexes=[0, 1, 2, 3, 4],
    )

    # Slide 5
    add_textbox(
        slide5.getroot(),
        slide2_body,
        "AidFlow features",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "• Multimodal need intake through text, voice, and OCR field forms",
                "• Gemini-based urgency and need-type classification",
                "• AI duplicate detection before a new incident is saved",
                "• Live Firestore priority board for coordinators",
                "• Adaptive volunteer assignment with AI reasoning and feedback learning",
            ]
        ),
    )

    # Slide 6
    add_textbox(
        slide6.getroot(),
        slide2_body,
        "AidFlow process flow",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "Field worker submits a report by text, voice, or photo.",
                "Gemini extracts fields, classifies urgency, and structures the need.",
                "AidFlow checks for duplicates before adding the case to the live board.",
                "A coordinator reviews the case and opens volunteer assignment.",
                "Gemini ranks volunteers and recommends the best match.",
                "Coordinator feedback is logged to improve future prompt context.",
            ]
        ),
    )

    # Slide 7
    add_textbox(
        slide7.getroot(),
        slide2_body,
        "AidFlow screens",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "• Priority Board with live crisis needs and AI reasoning",
                "• Submit Need flow for multimodal intake",
                "• Duplicate warning modal before coordinator confirmation",
                "• Volunteer assignment modal with AI Auto-Assign",
                "• Volunteer roster and edit-fields learning loop",
            ]
        ),
    )

    # Slide 8
    add_textbox(
        slide8.getroot(),
        slide2_body,
        "AidFlow architecture",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "Frontend: React + Vite web app for coordinators and NGO workflows.",
                "Platform: Firebase Hosting and Firebase Authentication for deployment and access control.",
                "Data layer: Cloud Firestore keeps needs, volunteers, and assignments synced in real time.",
                "AI layer: Gemini Flash powers classification, OCR extraction, deduplication, and volunteer matching.",
                "Security layer: Firebase Cloud Functions act as the secure proxy for AI requests.",
            ]
        ),
    )

    # Slide 9
    add_textbox(
        slide9.getroot(),
        slide2_body,
        "AidFlow technology stack",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "• React + Vite for the frontend experience",
                "• Tailwind CSS for UI styling",
                "• Firebase Hosting for deployment",
                "• Firebase Authentication and Cloud Firestore for access and realtime sync",
                "• Gemini Flash via Cloud Functions for AI inference",
            ]
        ),
    )

    # Slide 10
    add_textbox(
        slide10.getroot(),
        slide2_body,
        "AidFlow implementation cost",
        220000,
        1450000,
        8700000,
        2300000,
        body_paragraphs(
            [
                "MVP deployment is already running on Firebase, which keeps hosting and auth costs low for early pilots.",
                "Firestore and Cloud Functions scale pay-as-you-grow with usage volume.",
                "Gemini API cost is tied to report volume, OCR usage, and matching requests rather than fixed infrastructure.",
                "This makes the solution practical for NGO pilots before larger operational rollouts.",
            ]
        ),
    )

    # Slide 11 snapshot image
    ensure_image_on_slide(
        work_dir,
        11,
        preview_image,
        "rId4",
        "AidFlow MVP snapshot",
        1372000,
        1320000,
        6400000,
        3600000,
    )
    slide11 = load_slide(work_dir, 11)
    add_textbox(
        slide11.getroot(),
        slide2_body,
        "AidFlow snapshot caption",
        900000,
        4700000,
        7300000,
        350000,
        [make_paragraph(regular_small, "Live deployed MVP showing the priority board and real NGO coordination workflow.")],
    )

    # Slide 12
    add_textbox(
        slide12.getroot(),
        slide2_body,
        "AidFlow roadmap",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "• Multi-language UI support for field teams beyond the current report-processing pipeline",
                "• Offline-first and low-connectivity workflows for disaster zones",
                "• WhatsApp or messaging-based intake channels for distributed reporting",
                "• Richer analytics for NGO leadership on need trends, response speed, and volunteer utilization",
            ]
        ),
    )

    # Slide 13 links
    set_existing_shape_text(
        slide13_body,
        [
            "Provide links to your:",
            "",
            "GitHub Public Repository: https://github.com/lithincg/AidFlow",
            "Demo Video Link (3 Minutes): Included in the submission bundle / demo folder",
            "MVP Link: https://smart-resource-allocatio-3e4d2.web.app/#board",
            "Working Prototype Link: https://smart-resource-allocatio-3e4d2.web.app/#board",
        ],
        template_indexes=[0, 1, 2, 3, 4, 5],
    )

    # Slide 14 impact
    title_clone = copy.deepcopy(slide3_title)
    set_shape_meta(title_clone, next_shape_id(slide14.getroot()), "AidFlow impact title")
    set_xfrm(title_clone, 160000, 830000, 8800000, 600000)
    replace_paragraphs(title_clone, [make_paragraph(big_title_para, "Impact Metrics")])
    sp_tree(slide14.getroot()).append(title_clone)
    add_textbox(
        slide14.getroot(),
        slide2_body,
        "AidFlow impact body",
        220000,
        1450000,
        8700000,
        2500000,
        body_paragraphs(
            [
                "• Need classification moves from manual minutes to AI-assisted seconds",
                "• Duplicate detection reduces wasted dispatches and conflicting assignments",
                "• OCR and voice intake reduce manual typing during stressful field response work",
                "• Smarter volunteer matching improves response quality and coordinator confidence",
            ]
        ),
    )

    # Slide 15 closing
    title_clone_15 = copy.deepcopy(slide1_title)
    set_shape_meta(title_clone_15, next_shape_id(slide15.getroot()), "AidFlow thank you title")
    set_xfrm(title_clone_15, 450000, 1050000, 8240000, 700000)
    replace_paragraphs(title_clone_15, [make_paragraph(big_title_para, "Thank You", color="FFFFFF")])
    sp_tree(slide15.getroot()).append(title_clone_15)
    add_textbox(
        slide15.getroot(),
        slide2_body,
        "AidFlow thank you body",
        700000,
        2100000,
        7800000,
        1200000,
        [
            make_paragraph(regular_para, "AidFlow | OneBrainCell", color="FFFFFF"),
            make_paragraph(regular_para, "Live demo: smart-resource-allocatio-3e4d2.web.app/#board", color="FFFFFF"),
        ],
    )

    # Persist trees
    for num, tree in [
        (1, slide1),
        (2, slide2),
        (3, slide3),
        (4, slide4),
        (5, slide5),
        (6, slide6),
        (7, slide7),
        (8, slide8),
        (9, slide9),
        (10, slide10),
        (11, slide11),
        (12, slide12),
        (13, slide13),
        (14, slide14),
        (15, slide15),
    ]:
        tree.write(slide_path(work_dir, num), encoding="UTF-8", xml_declaration=True)

    if output_ppt.exists():
        output_ppt.unlink()
    zip_dir(work_dir, output_ppt)
    print(output_ppt)


if __name__ == "__main__":
    main()
