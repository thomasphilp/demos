#!/usr/bin/env python3
"""
generate-tokens.py
Reads tokens.json → generates CSS custom properties → injects into HTML files.

Usage:
    python3 generate-tokens.py            # inject into all HTML files
    python3 generate-tokens.py --dry-run  # print CSS only, no file changes
"""

import json
import re
import sys
from pathlib import Path

ROOT        = Path(__file__).parent
TOKENS_FILE = ROOT / 'tokens.json'
HTML_FILES  = [ROOT / 'services-simplified.html', ROOT / 'accessorials-form.html']
MARKER_START = '/* !! TOKENS:START !! */'
MARKER_END   = '/* !! TOKENS:END !! */'

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def to_css_var(name: str) -> str:
    """'Border/Global Alternate' → '--border-global-alternate'"""
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-').lower()
    return f'--{slug}'

def rgba_str(c: dict) -> str:
    r, g, b, a = round(c['r']), round(c['g']), round(c['b']), c['a']
    if a >= 1:
        return f'rgb({r}, {g}, {b})'
    a_fmt = f'{a:.3f}'.rstrip('0').rstrip('.')
    return f'rgba({r}, {g}, {b}, {a_fmt})'

def effects_to_shadow(effects: list) -> str:
    parts = []
    for e in effects:
        etype = e.get('type', '')
        # Backdrop/layer blurs don't map to box-shadow — skip them
        if etype in ('BACKGROUND_BLUR', 'LAYER_BLUR'):
            continue
        if 'color' not in e:
            continue
        inset  = 'inset ' if etype == 'INNER_SHADOW' else ''
        c      = rgba_str(e['color'])
        x, y   = e['offset']['x'], e['offset']['y']
        blur   = e.get('radius', 0)
        spread = e.get('spread', 0)
        spread_part = f' {spread}px' if spread else ''
        parts.append(f'{inset}{x}px {y}px {blur}px{spread_part} {c}')
    return ', '.join(parts)

def dim_to_css(name: str, val: float) -> str:
    """Assign CSS units based on token name prefix."""
    n = name.lower()
    no_unit = ('font-weight/', 'opacity/', 'z-index/', 'line-height/', 'family/')
    if any(n.startswith(p) for p in no_unit):
        return str(int(val) if val == int(val) else val)
    return f'{int(val) if val == int(val) else val}px'

def process_variable(v: dict):
    """Return (css_var, css_value) or None if unsupported."""
    name = v['name']
    val  = v['value']
    t    = v.get('type', '')
    var  = to_css_var(name)

    if t == 'color' and isinstance(val, dict) and 'r' in val:
        return var, rgba_str(val)
    if isinstance(val, (int, float)):
        return var, dim_to_css(name, val)
    if isinstance(val, str):
        return var, val
    if isinstance(val, dict) and 'effects' in val:
        shadow = effects_to_shadow(val['effects'])
        return (var, shadow) if shadow else None
    return None

# --------------------------------------------------------------------------- #
# CSS generation
# --------------------------------------------------------------------------- #

def generate_css(data: dict) -> str:
    root_lines  = []
    dark_lines  = []
    extra_roots = []   # non-color single-mode collections go into :root too

    for col in data['collections']:
        name   = col['name']
        modes  = col['modes']

        if name == 'Colors':
            for mode in modes:
                pairs = [p for v in mode['variables'] if (p := process_variable(v))]
                if mode['name'] == 'Light':
                    root_lines += [f'  /* Colors » Light */'] + [f'  {v}: {val};' for v, val in pairs]
                elif mode['name'] == 'Dark':
                    dark_lines += [f'    {v}: {val};' for v, val in pairs]
        elif name in ('Grids', 'Responsive'):
            continue  # layout grids not useful as CSS vars
        else:
            # Use first mode (usually "Default" or "Style")
            mode  = modes[0]
            pairs = [p for v in mode['variables'] if (p := process_variable(v))]
            if pairs:
                extra_roots += [f'  /* {name} » {mode["name"]} */'] + [f'  {v}: {val};' for v, val in pairs]

    lines = [':root {']
    lines += root_lines
    if extra_roots:
        lines += ['']
        lines += extra_roots
    lines += ['}']

    if dark_lines:
        lines += ['', '[data-theme="dark"] {']
        lines += ['  /* Colors » Dark */']
        lines += dark_lines
        lines += ['}']

    return '\n'.join(lines)

# --------------------------------------------------------------------------- #
# HTML injection
# --------------------------------------------------------------------------- #

def inject(html_path: Path, css: str):
    text = html_path.read_text()
    block = f'{MARKER_START}\n{css}\n  {MARKER_END}'

    if MARKER_START in text and MARKER_END in text:
        pattern = re.escape(MARKER_START) + r'.*?' + re.escape(MARKER_END)
        new_text = re.sub(pattern, block, text, flags=re.DOTALL)
    else:
        # Insert just before the first </style>
        new_text = text.replace('</style>', f'  {block}\n</style>', 1)

    html_path.write_text(new_text)
    print(f'  ✓ {html_path.name}')

# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #

def main():
    dry_run = '--dry-run' in sys.argv

    with open(TOKENS_FILE) as f:
        data = json.load(f)

    css = generate_css(data)

    if dry_run:
        print(css)
        return

    var_count = css.count('\n  --')
    print(f'Generated {var_count} CSS custom properties from {TOKENS_FILE.name}')
    for path in HTML_FILES:
        if path.exists():
            inject(path, css)
        else:
            print(f'  ⚠ Not found: {path.name}')
    print('Done!')

if __name__ == '__main__':
    main()
