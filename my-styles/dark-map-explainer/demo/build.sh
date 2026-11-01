#!/bin/bash
# Rebuild the Yancheng demo ("盐城，是从海里长出来的", 143.9 s) from this folder.
# Engine: Remotion + SVG (TypeScript), NOT Lemo's core/render. Style kit: /workspace/templates/dark-map-explainer.
#   OUT=…            where everything is written (default /workspace/dark-map-explainer-demo; never inside demo/)
#   SCALE=0.5|1      0.5 = low-res preview (default), 1 = 1080p
#   FRAMES=a-b       render only these frames (quick check), e.g. FRAMES=1500-1529
#   MUSIC=…          the user's own score (not shipped; default the "老配乐" path below). Missing → silent film
#   NODE_MODULES=…   an existing node_modules with Remotion 4.0.536 to link instead of `npm i`
LIB=/workspace/lemo-opuscar   # Lemo-Opuscar library (not used by this engine; kept for convention)
TEMPLATE=${TEMPLATE:-/workspace/templates/dark-map-explainer}
OUT=${OUT:-/workspace/dark-map-explainer-demo}
SCALE=${SCALE:-0.5}
MUSIC=${MUSIC:-/workspace/blackgold-template/assets/music.mp3}
FONT_URL=https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Black.otf
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT/public/fonts" "$OUT/audio" "$OUT/out"
cp -a "$HERE"/src "$HERE"/scripts "$HERE"/package.json "$HERE"/tsconfig.json "$HERE"/remotion.config.ts "$OUT"/ && cp "$HERE"/public/map.json "$OUT"/public/
cd "$OUT"
# font (OFL): reuse the kit's copy, else download
if [ ! -s public/fonts/NotoSerifSC-Black.otf ]; then
  if [ -s "$TEMPLATE/public/fonts/NotoSerifSC-Black.otf" ]; then cp "$TEMPLATE/public/fonts/NotoSerifSC-Black.otf" public/fonts/
  else curl -fsSL "$FONT_URL" -o public/fonts/NotoSerifSC-Black.otf; fi
fi
# paper grain (generated, seed 7)
[ -s public/grain.png ] || python3 scripts/gen_grain.py
# node deps
if [ ! -e node_modules ]; then
  if [ -n "${NODE_MODULES:-}" ] && [ -d "$NODE_MODULES" ]; then ln -s "$NODE_MODULES" node_modules; else npm i --no-audit --no-fund; fi
fi
npx --no-install tsx scripts/camrate.ts | tail -1
# audio: code-synth SFX + the user's score looped at constant level → −14 LUFS master
if [ -s "$MUSIC" ]; then
  npx --no-install tsx scripts/events.ts > audio/events.json
  MUSIC="$MUSIC" python3 scripts/make_audio.py
else echo "WARN: MUSIC not found ($MUSIC): rendering without sound"; fi
if [ -n "${FRAMES:-}" ]; then
  npx remotion render src/index.ts Main out/frames.mp4 --frames="$FRAMES" --scale="$SCALE" --concurrency=4 --muted --log=error
  echo "check: $OUT/out/frames.mp4"; exit 0
fi
scripts/render_chunks.sh out/chunks "$SCALE"
for f in out/chunks/c_*.mp4; do echo "file '$PWD/$f'"; done > out/list.txt
if [ -s audio/master.m4a ]; then
  ffmpeg -y -v error -f concat -safe 0 -i out/list.txt -i audio/master.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest final.mp4
else ffmpeg -y -v error -f concat -safe 0 -i out/list.txt -c copy final.mp4; fi
npx remotion still src/index.ts Cover34 cover_3x4.jpg --log=error
npx remotion still src/index.ts Cover43 cover_4x3.jpg --log=error
echo "final: $OUT/final.mp4"
