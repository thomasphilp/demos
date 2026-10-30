#!/usr/bin/env python3
"""Builds the MCP landing demo from the real /mcp page in mothership/marketplace.

    python3 tools/build-demo.py <marketplace checkout>/apps/marketing [dev server, default http://localhost:3005]

The marketplace page is the source: everyone edits apps/marketing (mcp.tsx, page-mcp.css, mcp-page.js and the copy in
src/i18n/catalogs/mcp.json), and this script turns it into the shareable demo on GitHub Pages. Run the app's dev server
(`corepack pnpm --filter @apps/marketing dev`) first: the script reads the page it renders, in English from localhost
and in Chinese from zh-cn.localhost, with the site's own nav and footer. It writes

  mcp-landing.html, mcp-landing.zh-CN.html   the page in each language, under the demo bar (Replay intro, the viewport
                                             frames, English / 中文)
  assets/mcp-landing/site/                   the stylesheets, script, copy, images and clip the page uses, as the
                                             app's public/site has them

The site's server-side scripts don't come along: the page script runs on its own, and the nav menu opens with a small
script that does what the site's Navigation component does. Python's standard library only.
"""
import json, re, shutil, subprocess, sys, time, urllib.request
from pathlib import Path

DEMO = Path(__file__).resolve().parent.parent
if len(sys.argv) not in (2, 3): sys.exit(__doc__)
APP = Path(sys.argv[1]).resolve()
SERVER = (sys.argv[2] if len(sys.argv) == 3 else 'http://localhost:3005').rstrip('/')
PUBLIC = APP / 'public'
OUT = DEMO / 'assets' / 'mcp-landing' / 'site'
SITE = {'en': 'https://www.mothership.com', 'zh-CN': 'https://www.gomothership.cn'}
PAGES = {'en': 'mcp-landing.html', 'zh-CN': 'mcp-landing.zh-CN.html'}
STYLES = ['normalize.css', 'webflow.css', 'mothership-landing.webflow.css', 'page-mcp.css', 'native.css']
if not (APP / 'src/content/marketing/mcp.tsx').exists(): sys.exit(f'{APP} is not apps/marketing')

def fetch(lang):
    host = SERVER.split('//', 1)[1]
    req = urllib.request.Request(f'{SERVER}/mcp', headers={'Host': f'zh-cn.{host}' if lang == 'zh-CN' else host})
    return urllib.request.urlopen(req).read().decode()

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
def element(html, start):
    """The whole element that opens at `start`."""
    i, depth = html.index(start), 0
    for m in re.finditer(r'<(/?)([\w:-]+)(?:\s[^>]*?)?(/?)>', html[i:]):
        if m.group(1) == '' and (m.group(3) == '/' or m.group(2).lower() in VOID): continue
        depth += 1 if m.group(1) == '' else -1
        if depth == 0: return html[i:i + m.end()]
    raise ValueError(start)

copied = set()
def take(path):
    """Copy a public/site file into the demo; returns its demo path."""
    rel = path.split('?')[0].lstrip('/')
    src = PUBLIC / rel
    if src.is_file() and rel not in copied:
        dst = DEMO / 'assets' / 'mcp-landing' / rel
        dst.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src, dst); copied.add(rel)
    return f'assets/mcp-landing/{rel}'

def localize(html, lang):
    # the page's own files come along; links into the rest of the site open the live site in a new tab
    html = re.sub(r'(src|poster|href)="(/site/[^"]+)"', lambda m: f'{m.group(1)}="{take(m.group(2))}"', html)
    html = re.sub(r'href="(/[^"/][^"]*|/)"', lambda m: f'href="{SITE[lang]}{m.group(1)}" target="_blank" rel="noopener"', html)
    return html

def site_paths(text):
    """/site/… paths in a script: copied, and pointed at the demo's copy."""
    return re.sub(r'([\'"`(])/site/([^\'"`)\s]+)', lambda m: m.group(1) + take('/site/' + m.group(2)), text)

if OUT.exists(): shutil.rmtree(OUT)
# Stylesheets, with the files they reference (fonts.css stays behind: the site's licensed faces aren't the demo's to
# publish, and the page and its nav and footer only use Geist, which the demo loads from Google Fonts)
# The page's own images and clip, whole (the script builds some of their names, like vscode-1.svg … vscode-4.svg)
for d in ('images/mcp', 'videos/mcp'):
    for f in sorted((PUBLIC / 'site' / d).iterdir()):
        if f.is_file(): take(f'/site/{d}/{f.name}')
for name in STYLES:
    take(f'/site/css/{name}')
    css = (PUBLIC / 'site/css' / name).read_text()
    # absolute /site/ paths become relative to the demo's copy of the stylesheet
    if '/site/' in css:
        (OUT / 'css' / name).write_text(re.sub(r'url\((["\']?)/site/', r'url(\1../', css))
    for ref in re.findall(r'url\(["\']?(?!data:|https?:|#)([^)"\']+)["\']?\)', css):
        take('/site/' + str((Path('css') / ref).as_posix()).replace('css/../', ''))
script = site_paths((APP / 'src/components/marketing/mcp-page.js').read_text())
# The page script imports its loop registry from a TypeScript file next to it; the browser gets it with the types
# stripped (Node's own stripTypeScriptTypes: the file holds only erasable types), as mcp-loops.js
script = script.replace("from './mcp-loops'", "from './mcp-loops.js'")
(OUT / 'mcp-page.js').write_text(script)
(OUT / 'mcp-loops.js').write_text(subprocess.run(
    ['node', '-e', "process.stdout.write(require('node:module').stripTypeScriptTypes(require('node:fs').readFileSync(process.argv[1], 'utf8')))",
     str(APP / 'src/components/marketing/mcp-loops.ts')], check=True, capture_output=True, text=True).stdout)
shutil.copy2(APP / 'src/i18n/catalogs/mcp.json', OUT / 'mcp-copy.json')
page = next(p for p in json.loads((APP / 'src/content/marketing/pages.json').read_text()) if p['slug'] == 'mcp')
zh_meta = json.loads((APP / 'src/i18n/page-metadata.zh-CN.json').read_text())['mcp']

SHELL_CSS = """
/* ── Demo bar (the demo only: the real page has none) ── */
html:not(.demo-framed) body { padding-top: 44px; }
.demo-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; height: 44px; display: flex; align-items: center; gap: 8px;
  padding: 10px 24px; background: #000; border-bottom: 1px solid rgba(255,255,255,0.08); font-family: Geist, sans-serif; font-size: 12px; color: #fff; }
.demo-bar-label { font-weight: 500; margin-right: 4px; background: linear-gradient(to right, #00ffff, #ff00cc);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.demo-bar button, .demo-bar a { padding: 4px 12px; border-radius: 20px; font: 500 12px/16px Geist, sans-serif; border: 1px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); cursor: pointer; text-decoration: none; transition: background 0.12s; }
.demo-bar button:hover, .demo-bar a:hover { background: rgba(255,255,255,0.15); }
.demo-bar-note { margin-left: auto; color: rgba(255,255,255,0.45); }
.demo-bar .vp-group { display: flex; gap: 2px; padding: 2px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25); }
.demo-bar .vp-group button { border: 0; padding: 3px 10px; background: transparent; }
.demo-bar .vp-group button[aria-pressed="true"] { background: #fff; color: #000; }
.vp-shell { position: fixed; inset: 44px 0 0; z-index: 9998; display: flex; justify-content: center; align-items: flex-start; padding: 16px; overflow: auto; background: #1a1a1a; }
.vp-shell iframe { flex: none; border: 0; background: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 24px 64px rgba(0,0,0,0.5); }
html.is-previewing body { overflow: hidden; }
html.is-previewing body > :not(.demo-bar):not(.vp-shell) { visibility: hidden; }
html.demo-framed .demo-bar { display: none; }
/* The site's top bar sits under the demo bar; 991px and down the site uses its bottom bar */
@media screen and (min-width: 992px) { html:not(.demo-framed) .navbar-component { top: 44px; } }
@media (max-width: 720px) { .demo-bar { padding: 10px 16px; } .demo-bar-note, .demo-bar .vp-group { display: none; } }
"""

SHELL_JS = r"""
// The site's Navigation component, as plain script: the menu button toggles .w--open and shows the menu for its
// 200ms close animation; [data-product] follows the hovered product; an outside press or Escape closes it
{
  const nav = document.querySelector('.w-nav'), buttons = [...document.querySelectorAll('.w-nav-button')];
  const menus = [...document.querySelectorAll('nav.w-nav-menu')];
  let open = false, hideTimer = 0;
  const set = next => {
    open = next; clearTimeout(hideTimer);
    buttons.forEach(b => { b.classList.toggle('w--open', open); b.setAttribute('aria-expanded', String(open)); });
    if (open) { nav.dataset.menuOpen = 'true'; menus.forEach(m => { m.style.display = 'block'; m.classList.add('w--nav-menu-open'); m.dataset.menuPhase = 'open'; m.inert = false; }); return; }
    menus.forEach(m => { m.dataset.menuPhase = 'closing'; m.inert = true; });
    hideTimer = setTimeout(() => { nav.dataset.menuOpen = 'false'; menus.forEach(m => { m.style.display = 'none'; m.classList.remove('w--nav-menu-open'); }); },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Number(nav?.dataset.duration ?? 200));
  };
  buttons.forEach(b => b.addEventListener('click', () => set(!open)));
  const preview = t => {
    const trigger = t instanceof Element ? t.closest('[class*="trigger-box"]') : null;
    const item = [...(trigger?.classList ?? [])].find(n => n.startsWith('trigger-') && !n.startsWith('trigger-box'));
    if (item) { const name = item.replace(/^trigger-/, '').replace(/-(light|dark)$/, ''); nav.dataset.product = name === 'ltl-carriers' ? 'ltl-carrier-partners' : name; }
  };
  nav?.addEventListener('pointerover', e => preview(e.target)); nav?.addEventListener('focusin', e => preview(e.target));
  document.addEventListener('pointerdown', e => { if (open && !nav.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (open && e.key === 'Escape') { set(false); buttons[0]?.focus(); } });
}
// Demo bar
const embed = document.documentElement.classList.contains('demo-framed');
document.getElementById('replay-intro').addEventListener('click', () => { scrollTo(0, 0); location.reload(); });
// Viewport switcher: Tablet / Mobile show this page in a frame at that width (?view= keeps it on reload)
(() => {
  if (embed) return;
  const SIZES = { tablet: [768, 1024], mobile: [375, 812] };
  const btns = [...document.querySelectorAll('.demo-bar [data-view]')];
  let shell = null;
  const set = view => {
    if (!SIZES[view]) view = 'desktop';
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    const url = new URL(location.href);
    view === 'desktop' ? url.searchParams.delete('view') : url.searchParams.set('view', view);
    history.replaceState(null, '', url);
    document.querySelectorAll('.demo-bar a[data-lang]').forEach(a => { a.search = url.search; });
    shell?.remove(); shell = null;
    document.documentElement.classList.toggle('is-previewing', view !== 'desktop');
    if (view === 'desktop') return;
    const [w, h] = SIZES[view];
    shell = Object.assign(document.createElement('div'), { className: 'vp-shell' });
    const frame = Object.assign(document.createElement('iframe'), { title: `This page at ${w} × ${h}`, src: `${location.pathname}?embed=1&build=__BUILD__`, allow: 'clipboard-write' });
    frame.style.width = `${w}px`; frame.style.height = `min(${h}px, 100%)`;
    shell.appendChild(frame); document.body.appendChild(shell);
  };
  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.view)));
  set(new URLSearchParams(location.search).get('view'));
})();
"""

# Each build stamps the framed page's address, so a browser never shows a framed copy cached from an older build
SHELL_JS = SHELL_JS.replace('__BUILD__', str(int(time.time())))

def shell(lang, body, title, description):
    other = 'zh-CN' if lang == 'en' else 'en'
    switch = f'<a href="{PAGES[other]}" data-lang="{other}" lang="{other}">{"中文" if other == "zh-CN" else "English"}</a>'
    return f"""<!DOCTYPE html>
<!-- Generated by tools/build-demo.py from the /mcp page in mothership/marketplace (apps/marketing): change the page there,
     then re-run it. -->
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Mothership Demo</title>
<meta name="description" content="{description}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="https://thomasphilp.github.io/demos/{PAGES[lang]}">
<meta property="og:type" content="website">
<script>if (new URLSearchParams(location.search).has('embed')) document.documentElement.classList.add('demo-framed');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
{chr(10).join(f'<link rel="stylesheet" href="assets/mcp-landing/site/css/{n}">' for n in STYLES)}
<style>{SHELL_CSS}</style>
</head>
<body class="body">
<div class="demo-bar" role="region" aria-label="Demo controls">
  <span class="demo-bar-label">MCP landing</span>
  <button type="button" id="replay-intro">Replay intro</button>
  <span class="vp-group" role="group" aria-label="Viewport size">
    <button type="button" data-view="desktop" aria-pressed="true" title="Full window">Desktop</button>
    <button type="button" data-view="tablet" aria-pressed="false" title="768 × 1024">Tablet</button>
    <button type="button" data-view="mobile" aria-pressed="false" title="375 × 812">Mobile</button>
  </span>
  {switch}
  <span class="demo-bar-note">Pick a topic to see its conversation</span>
</div>
{body}
<script type="module">
import {{ initMcpPage }} from './assets/mcp-landing/site/mcp-page.js';
initMcpPage(await fetch('assets/mcp-landing/site/mcp-copy.json').then(r => r.json()), '{lang}');
{SHELL_JS}
</script>
</body>
</html>
"""

for lang in ('en', 'zh-CN'):
    html = fetch(lang)
    body = localize(element(html, '<div class="page-wrapper"'), lang)
    title = page['title'] if lang == 'en' else zh_meta['title']
    description = (page['description'] if lang == 'en' else zh_meta['description']).replace('"', '&quot;')
    (DEMO / PAGES[lang]).write_text(shell(lang, body, title, description))

print(json.dumps({'pages': list(PAGES.values()), 'files': len(copied)}))
