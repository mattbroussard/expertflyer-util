#!/bin/sh

VERSION=$(jq -r .version manifest.json)
mkdir -p bin
zip -vr bin/ef-utils-$VERSION.zip lib *.js *.mjs *.html *.json *.css *.png
