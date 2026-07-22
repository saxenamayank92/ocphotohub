#!/bin/zsh
set -euo pipefail

export SWIFT_MODULECACHE_PATH=/tmp/clubphotohub-swift-cache
export CLANG_MODULE_CACHE_PATH=/tmp/clubphotohub-clang-cache
mkdir -p artifacts/video/segments artifacts/screenshots

swift scripts/render-feature-assets.swift

for frame in artifacts/video/frames/*.png; do
  name="${frame:t:r}"
  ffmpeg -y -loop 1 -i "$frame" -t 5 -vf "scale=2000:1125,crop=1920:1080,zoompan=z='min(zoom+0.00035,1.035)':d=150:s=1920x1080:fps=30,fade=t=in:st=0:d=0.45,fade=t=out:st=4.55:d=0.45,format=yuv420p" -r 30 -an "artifacts/video/segments/${name}.mp4" >/dev/null 2>&1
done

ffmpeg -y \
  -i artifacts/video/segments/01-intro.mp4 \
  -i artifacts/video/segments/02-private.mp4 \
  -i artifacts/video/segments/03-upload.mp4 \
  -i artifacts/video/segments/04-community.mp4 \
  -i artifacts/video/segments/05-memories.mp4 \
  -i artifacts/video/segments/06-pricing.mp4 \
  -filter_complex '[0:v][1:v][2:v][3:v][4:v][5:v]concat=n=6:v=1:a=0[outv]' \
  -map '[outv]' -c:v libx264 -preset medium -crf 20 -movflags +faststart -pix_fmt yuv420p artifacts/video/club-photohub-feature.mp4 >/dev/null 2>&1
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 artifacts/video/club-photohub-feature.mp4
