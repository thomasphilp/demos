#!/usr/bin/env python3
"""Fetch all icons from the Figma Glyphs file and save to icons.json."""

import json
import os
import sys
import urllib.request
import urllib.parse
import time

FILE_KEY = "GpC0B22mFhe7gS1yoAe4Ov"
TOKEN = os.environ.get("FIGMA_TOKEN", "")
OUTPUT = "icons.json"
BATCH_SIZE = 100

if not TOKEN:
    print("Error: set FIGMA_TOKEN environment variable")
    print("  export FIGMA_TOKEN=your_token_here")
    sys.exit(1)

def figma_get(path):
    url = f"https://api.figma.com/v1{path}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": TOKEN})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def fetch_url(url):
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8")

# Step 1: get all components, filter to glyph icons (solid/ or outline/)
print("Fetching component list...")
data = figma_get(f"/files/{FILE_KEY}")
components = data.get("components", {})

icons = {
    node_id: name
    for node_id, info in components.items()
    if (name := info.get("name", "")) and ("/" in name)
    and not name.startswith("Product=")
}
print(f"Found {len(icons)} icon components")

# Step 2: export in batches as SVG
ids = list(icons.keys())
batches = [ids[i:i+BATCH_SIZE] for i in range(0, len(ids), BATCH_SIZE)]
svg_urls = {}

for i, batch in enumerate(batches):
    print(f"Fetching SVG URLs batch {i+1}/{len(batches)}...")
    ids_param = urllib.parse.quote(",".join(batch))
    result = figma_get(f"/images/{FILE_KEY}?ids={ids_param}&format=svg")
    svg_urls.update(result.get("images", {}))
    if i < len(batches) - 1:
        time.sleep(0.5)  # be polite to the API

# Step 3: fetch each SVG and extract inner content
print("Fetching SVG content...")
icon_data = {}
failed = []

for j, (node_id, url) in enumerate(svg_urls.items()):
    name = icons.get(node_id)
    if not name or not url:
        continue
    try:
        svg = fetch_url(url)
        # Extract inner SVG content (strip outer <svg> wrapper)
        start = svg.find(">", svg.find("<svg")) + 1
        end = svg.rfind("</svg>")
        inner = svg[start:end].strip()
        # Extract viewBox from outer svg
        vb_start = svg.find('viewBox="')
        viewBox = "0 0 24 24"
        if vb_start != -1:
            vb_end = svg.find('"', vb_start + 9)
            viewBox = svg[vb_start+9:vb_end]
        icon_data[name] = {"viewBox": viewBox, "inner": inner}
        if (j + 1) % 50 == 0:
            print(f"  {j+1}/{len(svg_urls)} done...")
    except Exception as e:
        failed.append((name, str(e)))

print(f"\nDone: {len(icon_data)} icons saved, {len(failed)} failed")
if failed:
    print("Failed:", failed[:5])

with open(OUTPUT, "w") as f:
    json.dump(icon_data, f, indent=2)

print(f"Written to {OUTPUT}")
