#!/usr/bin/env bash
#
# Build the single-file PDF of the developer guide from the Markdown chapters.
#
# This is "configuration as code" (see 04-devops.md): the exact recipe for
# producing the PDF lives in the repo, so anyone can regenerate it identically
# instead of remembering a long pandoc command.
#
# Requirements:  pandoc + a LaTeX engine (xelatex).
#   macOS:   brew install pandoc  &&  brew install --cask mactex-no-gui
#   Ubuntu:  sudo apt-get install pandoc texlive-xetex texlive-fonts-recommended
#
# Usage:  ./build-pdf.sh            (run from the docs/ folder or anywhere)

set -euo pipefail
cd "$(dirname "$0")"          # always run relative to this script (the docs/ folder)

OUT="Nuclear-Winter-Developer-Guide.pdf"
COMBINED="$(mktemp -t nw-guide-XXXX).md"
trap 'rm -f "$COMBINED"' EXIT   # clean up the temp file no matter how we exit

# Chapters, in reading order.
ORDER=(README.md 01-system-design.md 02-code-walkthrough.md \
       03-graphics-and-audio.md 04-devops.md 05-exercises.md)

# 1. Emit the PDF metadata / title-page front matter.
cat > "$COMBINED" <<'YAML'
---
title: "Nuclear Winter"
subtitle: "A Developer's Learning Guide — Coding, DevOps & System Design"
author: "Built around the Nuclear Winter game · Documentation for junior developers"
date: "2026"
---
YAML

# 2. Concatenate every chapter, page-breaking between them, and flatten the
#    intra-repo Markdown/source links (they can't resolve inside one PDF) into
#    plain bold / inline-code so the text still reads correctly.
python3 - "${ORDER[@]}" >> "$COMBINED" <<'PY'
import re, sys
files = sys.argv[1:]
for i, fn in enumerate(files):
    txt = open(fn, encoding="utf-8").read()
    txt = re.sub(r'\[`([^`]+)`\]\((?:\.\./)[^)]+\)', r'`\1`', txt)          # [`js/x.js`](../js/x.js) -> `js/x.js`
    txt = re.sub(r'\[([^\]]+)\]\((?:\.\./)?[\w./-]+\.md(?:#[^)]*)?\)', r'**\1**', txt)  # chapter links -> bold
    txt = re.sub(r'\[([^\]]+)\]\((?:\.\./)[\w./-]+\)', r'\1', txt)          # other repo links -> plain text
    if i: print("\n\n\\newpage\n")
    print(txt)
PY

# 3. Render to PDF. Arial for readable body text; Menlo for code + box-drawing
#    diagrams (it has the arrows and line-drawing glyphs the ASCII art needs).
pandoc "$COMBINED" \
  --pdf-engine=xelatex \
  --toc --toc-depth=2 \
  --syntax-highlighting=breezedark \
  -V colorlinks=true -V linkcolor=RoyalBlue -V urlcolor=RoyalBlue \
  -V geometry:margin=2.5cm \
  -V mainfont="Arial" -V monofont="Menlo" -V monofontoptions="Scale=0.80" \
  -o "$OUT"

echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
