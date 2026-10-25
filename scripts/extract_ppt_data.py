#!/usr/bin/env python3
import os
import sys
import json
import zipfile
import subprocess
import xml.etree.ElementTree as ET

def extract_and_generate():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    pptx_path = os.path.join(project_root, 'public/projects/07 Amazon Prime - Gold Digger/Amazon Prime Video pitch_Round_2_deck.pptx')
    media_dest_dir = os.path.join(project_root, 'public/projects/07 Amazon Prime - Gold Digger/media')
    output_public_json = os.path.join(project_root, 'public/projects/07 Amazon Prime - Gold Digger/pptData.json')
    output_src_json = os.path.join(project_root, 'src/data/pptData.json')

    os.makedirs(media_dest_dir, exist_ok=True)
    os.makedirs(os.path.dirname(output_src_json), exist_ok=True)

    print(f"Opening presentation: {pptx_path}")
    if not os.path.exists(pptx_path):
        print(f"Error: PPTX file not found at {pptx_path}")
        sys.exit(1)

    z = zipfile.ZipFile(pptx_path)

    # 1. Extract all media assets and convert non-web formats if any
    extracted_count = 0
    for f in z.namelist():
        if f.startswith('ppt/media/'):
            filename = os.path.basename(f)
            if filename:
                target_path = os.path.join(media_dest_dir, filename)
                with open(target_path, 'wb') as out_f:
                    out_f.write(z.read(f))
                extracted_count += 1
                
                # Check for non-web formats (.emf, .wmf, .wdp, .tif, .tiff) and convert using macOS sips
                lower_name = filename.lower()
                if lower_name.endswith(('.emf', '.wmf', '.wdp', '.tif', '.tiff')):
                    png_name = os.path.splitext(filename)[0] + '.png'
                    png_path = os.path.join(media_dest_dir, png_name)
                    try:
                        subprocess.run(['sips', '-s', 'format', 'png', target_path, '--out', png_path],
                                       check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    except Exception as e:
                        print(f"Notice: sips conversion for {filename}: {e}")

    print(f"Extracted {extracted_count} media files to {media_dest_dir}")

    # 2. Read slide dimensions (default widescreen 16:9 = 12,192,000 x 6,858,000 EMUs)
    sld_w = 12192000.0
    sld_h = 6858000.0
    try:
        pres_root = ET.fromstring(z.read('ppt/presentation.xml'))
        sld_sz = pres_root.find('{http://schemas.openxmlformats.org/presentationml/2006/main}sldSz')
        if sld_sz is not None:
            sld_w = float(sld_sz.attrib.get('cx', 12192000))
            sld_h = float(sld_sz.attrib.get('cy', 6858000))
    except Exception as e:
        print(f"Defaulting to 16:9 slide size: {e}")

    # Helper function to extract background color/fill from XML root
    def extract_bg_from_root(xml_root, rels_map):
        bg_color = None
        bg_image = None
        for bg in xml_root.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}bg'):
            # Check srgbClr
            for clr in bg.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr'):
                val = clr.attrib.get('val')
                if val:
                    bg_color = f"#{val.upper()}"
            # Check blip in bg
            for blip in bg.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}blip'):
                embed = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                if embed and embed in rels_map:
                    tgt = os.path.basename(rels_map[embed])
                    bg_image = f"/projects/07%20Amazon%20Prime%20-%20Gold%20Digger/media/{tgt}"
        return bg_color, bg_image

    # Helper to parse relationship files
    def parse_rels(rel_path):
        rels_map = {}
        if rel_path in z.namelist():
            try:
                rel_root = ET.fromstring(z.read(rel_path))
                for r in rel_root:
                    r_id = r.attrib.get('Id')
                    target = r.attrib.get('Target')
                    if r_id and target:
                        rels_map[r_id] = target
            except Exception:
                pass
        return rels_map

    # 3. Process all 68 slides in strict numerical order
    slides_data = []

    for i in range(1, 69):
        slide_num = i
        slide_padded = f"{i:02d}"
        slide_xml_path = f"ppt/slides/slide{i}.xml"
        slide_rel_path = f"ppt/slides/_rels/slide{i}.xml.rels"

        base_image_url = f"/projects/07%20Amazon%20Prime%20-%20Gold%20Digger/Slide%20{slide_padded}.jpg"

        if slide_xml_path not in z.namelist():
            slides_data.append({
                "slideNumber": slide_num,
                "baseImage": base_image_url,
                "backgroundColor": "#0d0d12",
                "backgroundImage": None,
                "elements": []
            })
            continue

        slide_root = ET.fromstring(z.read(slide_xml_path))
        slide_rels = parse_rels(slide_rel_path)

        # Layout and master inheritance
        layout_path = None
        layout_rels = {}
        for r_id, target in slide_rels.items():
            if 'slideLayout' in target:
                layout_path = os.path.normpath(os.path.join('ppt/slides', target)).replace('\\', '/')
                layout_rel_path = os.path.normpath(os.path.join('ppt/slides', os.path.dirname(target), '_rels', os.path.basename(target) + '.rels')).replace('\\', '/')
                layout_rels = parse_rels(layout_rel_path)
                break

        master_path = None
        master_rels = {}
        if layout_path:
            for r_id, target in layout_rels.items():
                if 'slideMaster' in target:
                    master_path = os.path.normpath(os.path.join('ppt/slideLayouts', target)).replace('\\', '/')
                    master_rel_path = os.path.normpath(os.path.join('ppt/slideLayouts', os.path.dirname(target), '_rels', os.path.basename(target) + '.rels')).replace('\\', '/')
                    master_rels = parse_rels(master_rel_path)
                    break

        # Extract background (Slide -> Layout -> Master)
        bg_color, bg_image = extract_bg_from_root(slide_root, slide_rels)
        if not bg_color and not bg_image and layout_path and layout_path in z.namelist():
            layout_root = ET.fromstring(z.read(layout_path))
            bg_color, bg_image = extract_bg_from_root(layout_root, layout_rels)
        if not bg_color and not bg_image and master_path and master_path in z.namelist():
            master_root = ET.fromstring(z.read(master_path))
            bg_color, bg_image = extract_bg_from_root(master_root, master_rels)

        # For known Amazon blue section dividers, ensure brand blue
        if not bg_color:
            bg_color = "#0d0d12"

        # 4. Extract elements (<p:pic> and <p:sp> with <p:blipFill>)
        raw_elements = []

        for elem in slide_root.iter():
            tag = elem.tag.split('}')[-1]
            if tag in ('pic', 'sp'):
                # Find blipFill anywhere within elem
                blip_fill = None
                for child in elem.iter():
                    if child.tag.endswith('blipFill'):
                        blip_fill = child
                        break

                if blip_fill is None:
                    continue

                # Collect all r:embed and r:link attributes inside blipFill (including extLst, svgBlip, media)
                candidate_rel_ids = []
                for node in blip_fill.iter():
                    for k, v in node.attrib.items():
                        if k.endswith('embed') or k.endswith('link'):
                            if v not in candidate_rel_ids:
                                candidate_rel_ids.append(v)

                if not candidate_rel_ids:
                    continue

                # Map to target media file paths
                candidate_targets = []
                for rel_id in candidate_rel_ids:
                    if rel_id in slide_rels:
                        candidate_targets.append(slide_rels[rel_id])

                if not candidate_targets:
                    continue

                # PRIORITY RULE:
                # 1. Any .gif file -> ALWAYS select .gif over .png/.jpg fallback
                # 2. Any .mp4 / .mov / .webm -> video
                # 3. Any .svg
                # 4. Any .png / .jpg / .jpeg
                selected_target = None
                elem_type = 'image'

                for t in candidate_targets:
                    if t.lower().endswith('.gif'):
                        selected_target = t
                        elem_type = 'gif'
                        break

                if not selected_target:
                    for t in candidate_targets:
                        if t.lower().endswith(('.mp4', '.mov', '.webm')):
                            selected_target = t
                            elem_type = 'video'
                            break

                if not selected_target:
                    for t in candidate_targets:
                        if t.lower().endswith('.svg'):
                            selected_target = t
                            elem_type = 'image'
                            break

                if not selected_target:
                    for t in candidate_targets:
                        if t.lower().endswith(('.png', '.jpg', '.jpeg')):
                            selected_target = t
                            elem_type = 'image'
                            break

                if not selected_target:
                    # Check if .emf / .wmf was converted to .png
                    for t in candidate_targets:
                        if t.lower().endswith(('.emf', '.wmf', '.wdp', '.tif', '.tiff')):
                            base_t = os.path.splitext(os.path.basename(t))[0] + '.png'
                            if os.path.exists(os.path.join(media_dest_dir, base_t)):
                                selected_target = base_t
                                elem_type = 'image'
                                break

                if not selected_target:
                    # Ignore placeholder or non-web asset so broken image icon is never created
                    continue

                media_filename = os.path.basename(selected_target)
                local_media_path = os.path.join(media_dest_dir, media_filename)
                if not os.path.exists(local_media_path):
                    # Target does not exist on disk, skip to prevent 404 broken image
                    continue

                # Extract bounding box from <a:xfrm>
                xfrm = None
                for child in elem.iter():
                    if child.tag.endswith('xfrm'):
                        xfrm = child
                        break

                if xfrm is None:
                    continue

                off = None
                ext = None
                for child in xfrm:
                    if child.tag.endswith('off'):
                        off = child
                    elif child.tag.endswith('ext'):
                        ext = child

                if off is None or ext is None:
                    continue

                x_emu = float(off.attrib.get('x', 0))
                y_emu = float(off.attrib.get('y', 0))
                w_emu = float(ext.attrib.get('cx', 0))
                h_emu = float(ext.attrib.get('cy', 0))

                x_pct = round((x_emu / sld_w) * 100.0, 3)
                y_pct = round((y_emu / sld_h) * 100.0, 3)
                w_pct = round((w_emu / sld_w) * 100.0, 3)
                h_pct = round((h_emu / sld_h) * 100.0, 3)

                is_full_bleed = (w_pct >= 99.0 and h_pct >= 99.0 and x_pct <= 1.0 and y_pct <= 1.0 and elem_type != 'gif')

                if is_full_bleed:
                    bg_image = f"/projects/07%20Amazon%20Prime%20-%20Gold%20Digger/media/{media_filename}"
                    continue

                raw_elements.append({
                    "src": f"/projects/07%20Amazon%20Prime%20-%20Gold%20Digger/media/{media_filename}",
                    "filename": media_filename,
                    "type": elem_type,
                    "x": x_pct,
                    "y": y_pct,
                    "w": w_pct,
                    "h": h_pct,
                })

        # Dynamic overlay selection:
        # 1. Any animated GIF (elem_type == 'gif')
        # 2. Any video (elem_type == 'video')
        # 3. Transparent phone frames (image27.png) on slides containing a GIF mockup (Slides 20, 50)
        has_gif = any(e['type'] == 'gif' for e in raw_elements)
        final_elements = []

        if has_gif:
            for e in raw_elements:
                if e['type'] in ('gif', 'video'):
                    # Hard-override to left side (x: 6) for Slide 20 and Slide 50
                    elem_x = 6.0 if slide_num in (20, 50) else e['x']
                    final_elements.append({
                        "id": f"elem-{len(final_elements) + 1}",
                        "type": e['type'],
                        "src": e['src'],
                        "filename": e['filename'],
                        "x": elem_x,
                        "y": e['y'],
                        "w": e['w'],
                        "h": e['h'],
                        "zIndex": 15,
                        "objectFit": "contain"
                    })
                elif e['filename'] == 'image27.png':
                    # Phone mockup frame placed on top of the GIF (offset matching GIF at left side)
                    elem_x = 5.972 if slide_num in (20, 50) else e['x']
                    final_elements.append({
                        "id": f"elem-{len(final_elements) + 1}",
                        "type": 'image',
                        "src": e['src'],
                        "filename": e['filename'],
                        "x": elem_x,
                        "y": e['y'],
                        "w": e['w'],
                        "h": e['h'],
                        "zIndex": 20,
                        "objectFit": "contain"
                    })

        slides_data.append({
            "slideNumber": slide_num,
            "baseImage": base_image_url,
            "backgroundColor": bg_color,
            "backgroundImage": bg_image,
            "elements": final_elements
        })

    # Write output to both public/ and src/data/
    json_str = json.dumps(slides_data, indent=2)
    with open(output_public_json, 'w', encoding='utf-8') as f:
        f.write(json_str)
    with open(output_src_json, 'w', encoding='utf-8') as f:
        f.write(json_str)

    print(f"Generated {output_public_json} and {output_src_json} successfully with {len(slides_data)} slides.")

if __name__ == '__main__':
    extract_and_generate()
