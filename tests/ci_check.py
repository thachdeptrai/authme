"""Fast, dependency-free static checks run before GitHub Pages deployment."""
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.paths = []
        self.landmarks = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in {'main', 'header', 'footer', 'nav'}:
            self.landmarks.append(tag)
        for attr in ('href', 'src'):
            value = attrs.get(attr, '')
            if value.startswith('./'):
                self.paths.append(value.split('#', 1)[0].split('?', 1)[0][2:])

html = (ROOT / 'index.html').read_text(encoding='utf-8')
page = Document()
page.feed(html)
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML ids'
for essential in ['main', 'about', 'work', 'beyond', 'contact', 'world-canvas', 'light-switch']:
    assert essential in page.ids, f'Missing landmark #{essential}'
assert {'main', 'header', 'footer', 'nav'} <= set(page.landmarks), 'Missing semantic navigation landmarks'
for path in page.paths:
    assert (ROOT / path).is_file(), f'Missing referenced asset: {path}'
assert html.count('class="project-card ') == 4, 'Expected 4 featured projects'
assert (ROOT / 'src/scene.js').stat().st_size > 5000, 'Missing procedural WebGL renderer'
assert (ROOT / 'src/main.js').stat().st_size > 1000, 'Missing interactions'
assert ':focus-visible' in (ROOT / 'src/styles.css').read_text(), 'Missing keyboard focus styling'
print(f'PASS: HTML landmarks, {len(page.ids)} unique ids, {len(page.paths)} local asset references, 4 project cards, WebGL and focus styling')
