#!/usr/bin/env python3
"""Builds the marketplace /mcp page from mcp-landing.html.

    python3 tools/port-mcp.py <marketplace checkout>/apps/marketing

The demo is the design source: run this after every change to the MCP landing, then, from apps/marketing,

    corepack pnpm exec biome check --write src/content/marketing/mcp.tsx src/i18n/catalogs/mcp.json
    corepack pnpm exec biome format --write src/components/marketing/mcp-page.js   (twice: the first pass adds semicolons)
    corepack pnpm exec vitest run --project unit src/content/marketing/mcp.unit.test.ts src/i18n

and push the marketplace branch (cursor/mcp-preview-landing-7716, PR #3566) along with the demo. It writes:

  src/i18n/catalogs/mcp.json          the copy, from assets/mcp-landing/mcp-copy.json (English and Chinese)
  src/content/marketing/mcp.tsx       the page: the demo's <main> as JSX, every string from the catalog, inside the
                                      site's own nav and footer (MarketingLayout)
  src/components/marketing/mcp-page.js  the demo's script, less its demo-only blocks, run once the page mounts
  public/site/css/page-mcp.css        the demo's CSS, scoped to .mcp-page so it and the site's Webflow CSS never meet
  public/site/images/mcp/, public/site/videos/mcp/  the images and clips the page uses

Python's standard library only.
"""
import json, re, shutil, sys
from html.parser import HTMLParser
from pathlib import Path

DEMO = Path(__file__).resolve().parent.parent
SRC = DEMO / 'mcp-landing.html'
ASSETS = DEMO / 'assets' / 'mcp-landing'
if len(sys.argv) != 2: sys.exit(__doc__)
APP = Path(sys.argv[1]).resolve()
if not (APP / 'src' / 'content' / 'marketing').is_dir(): sys.exit(f'{APP} is not apps/marketing')

html = SRC.read_text()
copy = json.loads((ASSETS / 'mcp-copy.json').read_text())

# ── Assets: images under /site/images/mcp, clips under /site/videos/mcp ──
def asset_url(name):
    return f"/site/{'videos' if name.endswith('.mp4') else 'images'}/mcp/{name}"
ASSET_RE = re.compile(r'assets/mcp-landing/((?:[A-Za-z0-9_.-]|\$\{[^}]+\})+)')
def rewrite_assets(text):
    # a name the script fills in (`${src}`) is always an image: the only clip is the hero's, named in the markup
    return ASSET_RE.sub(lambda m: asset_url(m.group(1)), text)

# ── CSS ──
style = html[html.index('<style>') + 7:html.index('</style>')]
DEMO_ONLY = ('.demo-bar', '.vp-', 'is-previewing', 'is-embed', '#lang-toggle', '.site-chrome', 'body.show-all')
keyframes = sorted(set(re.findall(r'@keyframes ([\w-]+)', style)), key=len, reverse=True)

def split_top(text, sep):
    out, depth, cur, q = [], 0, '', None
    for ch in text:
        if q: cur += ch; q = None if ch == q else q; continue
        if ch in '"\'': q = ch
        elif ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == sep and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur)
    return out

def scope(sel):
    sel = sel.strip()
    if any(d in sel for d in DEMO_ONLY): return None
    m = re.match(r'html:lang\(([\w-]+)\)\s+body\s*(.*)$', sel) or re.match(r'html:lang\(([\w-]+)\)\s*(.*)$', sel)
    if m: return f'.mcp-page:lang({m.group(1)}) {m.group(2)}'.strip()
    if sel in (':root', 'html', 'body'): return '.mcp-page'
    if sel.startswith(('html ', 'body ')): sel = sel.split(' ', 1)[1]
    return f'.mcp-page {sel}'

def blocks(css):
    """Top-level (prelude, body) pairs; body is None for statements."""
    out, i, n = [], 0, len(css)
    while i < n:
        if css.startswith('/*', i):
            j = css.index('*/', i) + 2; out.append(('comment', css[i:j])); i = j; continue
        if css[i].isspace(): i += 1; continue
        j = i
        while j < n and css[j] not in '{;': j += 1
        if j >= n: break
        if css[j] == ';': out.append((css[i:j].strip(), None)); i = j + 1; continue
        depth, k = 1, j + 1
        while depth:
            if css.startswith('/*', k): k = css.index('*/', k) + 2; continue
            depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
        out.append((css[i:j].strip(), css[j + 1:k - 1])); i = k
    return out

def rename_keyframes(body):
    def fix(m):
        value = m.group(2)
        for name in keyframes: value = re.sub(rf'(?<![\w-]){re.escape(name)}(?![\w-])', f'mcp-{name}', value)
        return m.group(1) + value
    return re.sub(r'((?:^|[;{\s])animation(?:-name)?\s*:)([^;}]*)', fix, body)

def port_css(css, indent=''):
    out = []
    for prelude, body in blocks(css):
        if prelude == 'comment': out.append(indent + body); continue
        if body is None: out.append(f'{indent}{prelude};'); continue
        if prelude.startswith('@keyframes'):
            out.append(f"{indent}@keyframes mcp-{prelude.split()[1]} {{{body}}}"); continue
        if prelude.startswith(('@property', '@font-face')):
            out.append(f'{indent}{prelude} {{{body}}}'); continue
        if prelude.startswith(('@media', '@supports')):
            inner = port_css(body, indent + '  ')
            if inner.strip(): out.append(f'{indent}{prelude} {{\n{inner}\n{indent}}}')
            continue
        sels = [s for s in (scope(s) for s in split_top(prelude, ',')) if s]
        if not sels: continue
        body = rename_keyframes(rewrite_assets(body))
        if sels == ['.mcp-page'] and 'padding-top: 44px' in body:  # the demo's body: no room for the demo bar here
            body = body.replace('padding-top: 44px;', '').replace('overflow-x: hidden;', 'overflow-x: clip;')
        if prelude == 'html': continue  # smooth page scroll is the site's call
        out.append(f"{indent}{', '.join(sels)} {{{body}}}")
    return '\n'.join(out)

css_out = f"""/* Generated by tools/port-mcp.py in thomasphilp/demos from mcp-landing.html. Change the demo, then re-run it.
   The page's own CSS, scoped to .mcp-page (the site's nav and footer keep the Webflow styles). */
@font-face {{ font-family: 'Geist Pixel'; font-style: normal; font-weight: 400; font-display: swap; src: url(../fonts/GeistPixel-Regular.woff2) format('woff2'); }}
/* The site's Webflow CSS styles bare elements page-wide (p, a, headings, images…). Inside the page they go back to the
   browser defaults the demo is built on, and the page's own rules (all more specific) take it from there */
.mcp-page {{ line-height: normal; letter-spacing: normal; }}
.mcp-page :where(p, a, h1, h2, h3, h4, strong, b, em, small, ul, ol, li, button, img, video, svg, figure, blockquote, label, input) {{ all: revert; }}
{port_css(style)}
"""
(APP / 'public/site/css/page-mcp.css').write_text(css_out)

# ── Markup → JSX ──
main = html[html.index('<main id="top">'):html.index('</main>') + 7]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
ATTR = {'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'playsinline': 'playsInline', 'readonly': 'readOnly',
        'crossorigin': 'crossOrigin', 'stroke-width': 'strokeWidth', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule'}
BOOL = {'muted', 'loop', 'playsinline', 'hidden', 'inert', 'disabled'}
NUMERIC = {'tabindex'}

def jsx_style(css):
    props = []
    for decl in filter(None, (d.strip() for d in css.split(';'))):
        k, v = (x.strip() for x in decl.split(':', 1))
        key = f"'{k}'" if k.startswith('--') else re.sub(r'-(\w)', lambda m: m.group(1).upper(), k)
        props.append(f"{key}: {json.dumps(v)}")
    return '{{ ' + ', '.join(props) + ' }}'

def jsx_text(text):
    return text.replace('{', "{'{'}").replace('}', "{'}'}").replace('<', '&lt;').replace('>', '&gt;')

class Node:
    def __init__(self, tag, attrs): self.tag, self.attrs, self.kids = tag, attrs, []

class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.root = Node('#root', {}); self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs)); self.stack[-1].kids.append(node)
        if tag not in VOID: self.stack.append(node)
    def handle_startendtag(self, tag, attrs): self.stack[-1].kids.append(Node(tag, dict(attrs)))
    def handle_endtag(self, tag):
        if tag in VOID: return
        while self.stack[-1].tag != tag: self.stack.pop()
        self.stack.pop()
    def handle_data(self, data): self.stack[-1].kids.append(data)
    def handle_comment(self, data): self.stack[-1].kids.append(('comment', data))

tree = Tree(); tree.feed(main)
rich_keys = set()

def message_jsx(key):
    msg = copy['en'][key]
    if re.search(r'<(?:c\d+|b|br)\b', msg):
        rich_keys.add(key)
        return f"<PageTrans message={{t('{key}')}} components={{rich('{key}')}} />"
    return f"{{t('{key}')}}"

def attrs_jsx(node):
    out, attrs = [], dict(node.attrs)
    i18n_attr = attrs.pop('data-i18n-attr', None)
    attrs.pop('data-i18n', None); attrs.pop('data-i18n-plain', None)
    translated = dict(pair.split(':') for pair in i18n_attr.split(';')) if i18n_attr else {}
    if node.tag == 'main': attrs['class'] = 'mcp-page'
    for k, v in attrs.items():
        name = ATTR.get(k, k)
        if k in translated: out.append(f"{name}={{t('{translated[k]}')}}"); continue
        if k == 'style': out.append(f'style={jsx_style(v)}'); continue
        if k in BOOL and (v is None or v == ''): out.append(name); continue
        if v is None: v = ''
        if k in NUMERIC: out.append(f'{name}={{{int(v)}}}'); continue
        # links into the site go local, so they keep the visitor's domain and locale (/sign-up redirects Chinese visitors)
        if k == 'href' and v.startswith('https://www.mothership.com/'): v = v[len('https://www.mothership.com'):]
        out.append(f'{name}={json.dumps(rewrite_assets(v), ensure_ascii=False)}')
    return (' ' + ' '.join(out)) if out else ''

def render(node, depth):
    out = render_node(node, depth)
    if isinstance(node, Node) and node.tag == 'div' and node.attrs.get('role') == 'group':  # controls, not a form fieldset
        out = '  ' * depth + '{/* biome-ignore lint/a11y/useSemanticElements: a row of slideshow controls, not a form fieldset */}\n' + out
    return out

def render_node(node, depth):
    pad = '  ' * depth
    if isinstance(node, tuple): return f"{pad}{{/* {node[1].strip()} */}}"
    if isinstance(node, str):
        if node.strip(' \t\n\r') == '\xa0': return pad + "{'\\u00a0'}"  # a held line (&nbsp;), filled in by the script
        text = re.sub(r'\s+', ' ', node)
        return pad + jsx_text(text.strip()) if text.strip() else None
    open_tag = f'<{node.tag}{attrs_jsx(node)}'
    if node.tag in VOID: return f'{pad}{open_tag} />'
    key = node.attrs.get('data-i18n')
    if key:
        icons = [k for k in node.kids if isinstance(k, Node) and (k.tag == 'img' or 'ic' in k.attrs.get('class', '').split())]
        parts = [render(k, 0) for k in icons]
        text = f"{{plain(t('{key}'))}}" if 'data-i18n-plain' in node.attrs else message_jsx(key)
        return f"{pad}{open_tag}>{''.join(parts)}{text}</{node.tag}>"
    kids = [r for r in (render(k, depth + 1) for k in node.kids) if r is not None]
    if not kids: return f'{pad}{open_tag} />'
    if len(kids) == 1 and '\n' not in kids[0] and len(kids[0]) < 90: return f'{pad}{open_tag}>{kids[0].strip()}</{node.tag}>'
    return f"{pad}{open_tag}>\n" + '\n'.join(kids) + f"\n{pad}</{node.tag}>"

main_jsx = render(tree.root.kids[0], 3)
components = {'b': '<strong />'}
RICH = {'heroTitle': {'c0': '<Iri />'}, 'ctaTitle': {'c0': '<Iri />'}, 'connectLead': {'br': '<br className="br-mobile" />'}}
rich_map = ',\n'.join(f"  {k}: {{ {', '.join(f'{c}: {v}' for c, v in RICH[k].items())} }}" for k in sorted(rich_keys) if k in RICH)
tsx = f"""// Generated by tools/port-mcp.py in thomasphilp/demos from mcp-landing.html. Change the demo, then re-run it.
import {{ Children, type ReactElement, type ReactNode, useEffect }} from 'react'
import {{ MarketingLayout }} from '@/components/marketing/marketing-layout'
import {{ initMcpPage }} from '@/components/marketing/mcp-page'
import messages from '@/i18n/catalogs/mcp.json'
import {{ PageTrans, usePageTranslation }} from '@/i18n/page-translations'
import {{ useLocale }} from '@/i18n/use-locale'

type MessageKey = keyof (typeof messages)['en']

/** The iridescent words keep one-line copies of their text in data-text, for the RGB split and glow */
function Iri({{ children }}: {{ children?: ReactNode }}) {{
  const text = Children.toArray(children).join('')
  return (
    <span className="iri" data-text={{text}}>
      <span className="iri-glow" data-text={{text}} aria-hidden="true" />
      <span className="iri-fill">{{text}}</span>
    </span>
  )
}}

/** Elements for each message's named tags; bold is <strong> throughout */
const richComponents: Partial<Record<MessageKey, Record<string, ReactElement>>> = {{
{rich_map},
}}
const rich = (key: MessageKey) => ({{ b: <strong />, ...richComponents[key] }})
/** Copy shown without its bold (the typed question keeps it for the input) */
const plain = (message: string) => message.replace(/<\\/?b>/g, '')

export default function MarketingPage() {{
  const {{ t }} = usePageTranslation(messages)
  const locale = useLocale()
  // The page's motion, typing and canvases run once it has mounted, in the page's language
  useEffect(() => initMcpPage(messages, locale), [locale])
  return (
    <MarketingLayout>
{main_jsx}
    </MarketingLayout>
  )
}}
"""
(APP / 'src/content/marketing/mcp.tsx').write_text(tsx)

# ── Script ──
script = html[html.index('<script type="module">') + 22:html.rindex('</script>')]
script = re.sub(r'/\* demo-only:start \*/.*?/\* demo-only:end \*/\n?', '', script, flags=re.S)
for name in keyframes:
    script = re.sub(rf"(animationName === ')({re.escape(name)})(')", rf'\1mcp-\2\3', script)
script = rewrite_assets(script)
body = '\n'.join(('  ' + line) if line.strip() else '' for line in script.strip('\n').split('\n'))
js = f"""// Generated by tools/port-mcp.py in thomasphilp/demos from mcp-landing.html. Change the demo, then re-run it.
/* biome-ignore-all lint: the demo's script, ported as it is */
let started = false

/** The page's motion: the intro, typing, reveals, sliders, cursor grids and shaders. Runs once per page load. */
export function initMcpPage(COPY, LANG) {{
  if (started) return
  started = true
  // The site's nav bar, for the hero's cube placement (a top bar on desktop, a bottom bar on tablets and phones)
  const siteNavBar = () => document.querySelector('.navbar-wrapper-light, .navbar-wrapper')
{body}
}}
"""
(APP / 'src/components/marketing/mcp-page.js').write_text(js)
(APP / 'src/components/marketing/mcp-page.d.ts').write_text(
    "// The page script is plain JS, ported from the demo by tools/port-mcp.py in thomasphilp/demos\n"
    "export function initMcpPage(copy: { en: Record<string, string>; 'zh-CN': Record<string, string> }, lang: string): void\n")

# ── Copy ──
(APP / 'src/i18n/catalogs/mcp.json').write_text(json.dumps(copy, ensure_ascii=False, indent='\t') + '\n')

# ── Assets the page uses ──
used = set(re.findall(r'/site/(?:images|videos)/mcp/([A-Za-z0-9_.${}-]+)', css_out + tsx + js))
for d in ('images', 'videos'):
    target = APP / 'public/site' / d / 'mcp'
    if target.exists(): shutil.rmtree(target)
    target.mkdir(parents=True)
copied = 0
for f in sorted(ASSETS.iterdir()):
    if not f.is_file() or f.name == 'mcp-copy.json': continue
    # a name ending in '-' (or holding ${…}) is a prefix the script completes, e.g. vscode-1.svg … vscode-4.svg;
    # a bare name in the script ('logo-claude.svg' in a list) is one it puts on a path
    named = f"'{f.name}'" in js
    if named or any(f.name == u or (('${' in u or u.endswith('-')) and u.split('${')[0] and f.name.startswith(u.split('${')[0]))
                    for u in used):
        shutil.copy2(f, APP / 'public/site' / ('videos' if f.suffix == '.mp4' else 'images') / 'mcp' / f.name); copied += 1
missing = [u for u in used if '${' not in u and not u.endswith('-') and not (ASSETS / u).exists()]
print(json.dumps({'css_bytes': len(css_out), 'tsx_lines': tsx.count('\n'), 'js_lines': js.count('\n'),
                  'rich': sorted(rich_keys), 'assets': copied, 'missing': missing}, ensure_ascii=False))
