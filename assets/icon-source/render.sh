#!/bin/sh
# Renders every Glassfin icon asset from the SVGs here (needs rsvg-convert and
# ImageMagick). The iOS Icon Composer bundle takes the layer-*.svg files as is.
set -e
cd "$(dirname "$0")"
I=../images
rsvg-convert -w 1024 -h 1024 icon-dark.svg | magick - -alpha off $I/icon.png
rsvg-convert -w 1024 -h 1024 icon-light.svg | magick - -alpha off $I/icon-ios-light.png
rsvg-convert -w 1024 -h 1024 icon-tinted.svg | magick - -alpha off $I/icon-ios-tinted.png
rsvg-convert -w 1024 -h 1024 mark.svg -o $I/icon-ios-plain.png
rsvg-convert -w 1024 -h 1024 android-foreground.svg -o $I/icon-android-plain.png
rsvg-convert -w 1024 -h 1024 android-monochrome.svg -o $I/icon-android-themed.png
rsvg-convert -w 96 -h 96 notification.svg -o $I/notification.png
B=$I/icon-ios-liquid-glass.icon/Assets
cp layer-hull.svg $B/glassfin_hull.svg
cp layer-sail.svg $B/glassfin_sail.svg
cp layer-play.svg $B/glassfin_play.svg
