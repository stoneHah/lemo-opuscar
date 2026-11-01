#!/bin/bash
# Chunked render (150 frames/chunk), timeout + up to 4 retries + frame-count check; kills stray Chrome on failure.
# usage: scripts/render_chunks.sh <outdir> [scale=0.5] [crf=19]   (run from the project folder; N= overrides frame count)
D=${1:?outdir}; SCALE=${2:-0.5}; CRF=${3:-19}; C=${C:-150}
N=${N:-$(npx --no-install tsx -e 'import {DURATION,FPS} from "./src/timeline"; console.log(Math.ceil(DURATION*FPS))')}
mkdir -p "$D"
for ((a=0; a<N; a+=C)); do
  b=$((a+C-1)); [ $b -ge $N ] && b=$((N-1))
  f=$D/c_$(printf %05d $a).mp4
  [ -s "$f" ] && continue
  ok=0
  for try in 1 2 3 4; do
    echo "chunk $a-$b try $try $(date +%T)"
    timeout 1500 npx remotion render src/index.ts Main "$f" --frames=$a-$b --scale=$SCALE --concurrency=4 --muted --crf=$CRF --timeout=120000 --log=error > "$D/log_$a.txt" 2>&1
    if [ $? -eq 0 ] && [ -s "$f" ]; then
      n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$f" | tr -dc 0-9)
      if [ "$n" = "$((b-a+1))" ]; then ok=1; break; else echo "  frames $n != $((b-a+1))"; fi
    fi
    pkill -f puppeteer_dev_chrome; pkill -f "chrome.*remotion"; rm -f "$f"; sleep 3
  done
  [ $ok -eq 1 ] || { echo "CHUNK_FAILED $a"; exit 1; }
done
echo RENDER_DONE
