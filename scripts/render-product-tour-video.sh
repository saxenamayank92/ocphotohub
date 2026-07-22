#!/bin/zsh
set -euo pipefail

export SWIFT_MODULECACHE_PATH=/tmp/clubphotohub-swift-cache
export CLANG_MODULE_CACHE_PATH=/tmp/clubphotohub-clang-cache
mkdir -p artifacts/video/product-tour-segments

swift scripts/render-product-tour-assets.swift

for frame in artifacts/video/product-tour-frames/*.png; do
  name="${frame:t:r}"
  ffmpeg -y -loop 1 -i "$frame" -t 6 -vf "scale=1980:1114,crop=1920:1080,zoompan=z='min(zoom+0.00022,1.025)':d=180:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35,format=yuv420p" -r 30 -an "artifacts/video/product-tour-segments/${name}.mp4" >/dev/null 2>&1
done

ffmpeg -y \
  -i artifacts/video/product-tour-segments/01-workspace.mp4 \
  -i artifacts/video/product-tour-segments/02-member-check.mp4 \
  -i artifacts/video/product-tour-segments/03-gallery.mp4 \
  -i artifacts/video/product-tour-segments/04-upload.mp4 \
  -i artifacts/video/product-tour-segments/05-admin.mp4 \
  -i artifacts/video/product-tour-segments/06-privacy.mp4 \
  -i artifacts/video/product-tour-segments/07-cta.mp4 \
  -filter_complex '[0:v][1:v][2:v][3:v][4:v][5:v][6:v]concat=n=7:v=1:a=0[outv]' \
  -map '[outv]' -c:v libx264 -preset medium -crf 19 -movflags +faststart -pix_fmt yuv420p artifacts/video/club-photohub-product-tour.mp4 >/dev/null 2>&1

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 artifacts/video/club-photohub-product-tour.mp4
