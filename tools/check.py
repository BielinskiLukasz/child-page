#!/usr/bin/env python3
"""Mechanical repository checks (run on every pull request by .github/workflows/checks.yml).

Run locally from anywhere with:  python3 tools/check.py
Needs only Python 3 and Node.js (for `node --check`); no network, no packages.
Every failure is printed as `<file>: [<rule>] <message>`; exit code 1 if any failed.
"""
import glob
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []


def fail(path, rule, msg):
    failures.append('%s: [%s] %s' % (path, rule, msg))


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def exists(rel):
    return os.path.exists(os.path.join(ROOT, rel))


# 2. JS syntax
def check_syntax():
    node = shutil.which('node')
    files = sorted(glob.glob(os.path.join(ROOT, 'js', '*.js')))
    if not node:
        fail('js/', 'js-syntax', 'node is not installed, cannot run `node --check`')
        return
    for p in files:
        r = subprocess.run([node, '--check', p], capture_output=True, text=True)
        if r.returncode != 0:
            fail('js/' + os.path.basename(p), 'js-syntax', ' '.join(r.stderr.strip().splitlines()[:4]))


# 3. index.html scripts
def check_scripts():
    html = read('index.html')
    srcs = re.findall(r'<script[^>]*\ssrc="([^"]+)"', html)
    for s in srcs:
        if not re.match(r'https?:', s) and not exists(s):
            fail('index.html', 'script-exists', 'script %s does not exist' % s)
    local = [s for s in srcs if s.startswith('js/')]
    if 'js/app.js' not in local:
        fail('index.html', 'script-order', 'js/app.js is not loaded')
    elif local.index('js/app.js') != len(local) - 1:
        later = local[local.index('js/app.js') + 1:]
        fail('index.html', 'script-order',
             'js/app.js must be loaded after all other scripts, but these come after it: ' + ', '.join(later))
    seen = set()
    for s in local:
        if s in seen:
            fail('index.html', 'script-duplicate', 'script %s is loaded twice' % s)
        seen.add(s)


# 3b. registry src/deps (lazy-loaded activity scripts)
def check_registry():
    reg = read('js/activities.js')
    used = set()
    for m in re.finditer(r"\bsrc:\s*'([^']+)'", reg):
        used.add(m.group(1))
        if not exists(m.group(1)):
            fail('js/activities.js', 'registry-src', 'src %s does not exist' % m.group(1))
    for m in re.finditer(r"\bdeps:\s*\[([^\]]*)\]", reg):
        for d in re.findall(r"'([^']+)'", m.group(1)):
            used.add(d)
            if not exists(d):
                fail('js/activities.js', 'registry-deps', 'dep %s does not exist' % d)
    tags = set(re.findall(r'<script[^>]*\ssrc="([^"]+)"', read('index.html')))
    for p in sorted(glob.glob(os.path.join(ROOT, 'js', '*.js'))):
        rel = 'js/' + os.path.basename(p)
        if rel not in used and rel not in tags:
            fail(rel, 'script-orphan', 'not loaded by index.html and not listed as src/deps in js/activities.js')


# 4 + 5. activities, docs index, README list
def check_activities():
    ids = re.findall(r"\{\s*id:\s*'([^']+)'", read('js/activities.js'))
    seen = set()
    for i in ids:
        if i in seen:
            fail('js/activities.js', 'activity-id-unique', "id '%s' appears more than once" % i)
        seen.add(i)
    idset = set(ids)

    index_path = 'docs/activities/README.md'
    rows = []  # (id, link target, status)
    for line in read(index_path).splitlines():
        m = re.match(r'\|\s*\d+\s*\|\s*\[[^\]]*\]\(([^)]+)\)\s*\|\s*`([^`]+)`\s*\|.*\|\s*([^|]+?)\s*\|\s*$', line)
        if m:
            rows.append((m.group(2), m.group(1), m.group(3)))
    implemented = set()
    for rid, target, status in rows:
        if status.lower() == 'planned':
            if rid in idset:
                fail(index_path, 'index-status', "'%s' is in js/activities.js but its row says planned" % rid)
            continue
        implemented.add(rid)
        if rid not in idset:
            fail(index_path, 'index-row', "row '%s' has no entry in js/activities.js" % rid)
        if not exists('docs/activities/' + target):
            fail(index_path, 'activity-doc', "document %s for '%s' does not exist" % (target, rid))
    for i in ids:
        if i not in implemented:
            fail(index_path, 'activity-doc', "activity '%s' has no row in the activity index (or its row is marked planned)" % i)
    row_ids = [r[0] for r in rows]
    for i in set(row_ids):
        if row_ids.count(i) > 1:
            fail(index_path, 'index-row', "id '%s' has more than one row" % i)

    # README Activities list: numbered items, "(planned)" ones are placeholders
    readme = read('README.md')
    m = re.search(r'^## Activities\s*$(.*?)(?=^## )', readme, re.S | re.M)
    items = re.findall(r'^\d+\.\s+(.*)$', m.group(1), re.M) if m else []
    if not m:
        fail('README.md', 'readme-count', 'no "## Activities" section found')
    n_impl = len(set(ids))
    n_list = len([i for i in items if '(planned)' not in i])
    if n_list != n_impl:
        fail('README.md', 'readme-count',
             'Activities list has %d implemented items but js/activities.js has %d activities' % (n_list, n_impl))
    n_rows = len(implemented)
    if n_rows != n_impl:
        fail(index_path, 'index-count',
             'activity index has %d implemented rows but js/activities.js has %d activities' % (n_rows, n_impl))
    # stated counts such as "all 56 activities" must match when present
    for rel in ('README.md', index_path):
        for mm in re.finditer(r'\ball (\d+) activities', read(rel)):
            if int(mm.group(1)) != n_impl:
                fail(rel, 'stated-count', 'says "all %s activities" but js/activities.js has %d' % (mm.group(1), n_impl))


# 6. Markdown links
def check_links():
    files = ['README.md'] + sorted(
        os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'docs', '**', '*.md'), recursive=True))
    for rel in files:
        text = read(rel)
        text = re.sub(r'```.*?```', '', text, flags=re.S)
        text = re.sub(r'`[^`\n]*`', '', text)
        for m in re.finditer(r'\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)', text):
            target = m.group(1)
            if re.match(r'[a-z][a-z0-9+.-]*:', target, re.I) or target.startswith('#'):
                continue
            path = target.split('#')[0].split('?')[0]
            if not path:
                continue
            full = os.path.normpath(os.path.join(ROOT, os.path.dirname(rel), path))
            if not os.path.exists(full):
                fail(rel, 'md-link', 'link target %s does not exist' % target)


# 7. CSS prefixes (declared in each activity document)
def check_prefixes():
    css = ''.join(open(p, encoding='utf-8').read() for p in glob.glob(os.path.join(ROOT, 'css', '*.css')))
    owners = {}
    for p in sorted(glob.glob(os.path.join(ROOT, 'docs', 'activities', '*.md'))):
        rel = os.path.relpath(p, ROOT)
        if os.path.basename(p) in ('README.md', 'ACTIVITY_TEMPLATE.md'):
            continue
        text = open(p, encoding='utf-8').read()
        if re.search(r'^Status:\s*planned', text, re.M | re.I):
            pass  # placeholders still reserve their prefix
        m = re.search(r'^(?:\|\s*Source\s*\|.*?|-\s*CSS prefix:\s*)(?:CSS )?(?:styles with )?(?:prefix\s+)?`([a-z]+-)`', text, re.M)
        if not m:
            continue
        pre = m.group(1)
        owners.setdefault(pre, []).append(rel)
        if not re.search(r'status:\s*planned', text, re.I) and ('.' + pre) not in css and ('-' + pre) not in css:
            fail(rel, 'css-prefix', "prefix `%s` is documented but no `.%s…` selector exists in css/" % (pre, pre))
    for pre, docs in owners.items():
        if len(docs) > 1:
            fail(docs[1], 'css-prefix-unique', 'prefix `%s` is claimed by more than one activity: %s' % (pre, ', '.join(docs)))


def main():
    check_syntax()
    check_scripts()
    check_registry()
    check_activities()
    check_links()
    check_prefixes()
    if failures:
        print('\n'.join(failures))
        print('\n%d check(s) failed.' % len(failures))
        return 1
    print('All checks passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
