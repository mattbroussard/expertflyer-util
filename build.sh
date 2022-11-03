#!/bin/sh

VERSION=$(jq -r .version manifest.json)
mkdir -p bin
zip -vr bin/ef-utils-$VERSION.zip lib src *.js *.mjs *.html *.json *.css icon.png
