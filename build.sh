#!/bin/sh
# The whole build: copy the app's three source files into dist/, then
# write a version stamp next to them. The stamp is a short hash of all
# three, so it changes exactly when the app changes and not on every
# deploy — an unchanged redeploy will not nag anyone to reload.
set -e
mkdir -p dist

cp src/index.html  dist/index.html
cp src/styles.css  dist/styles.css
cp src/app.js      dist/app.js
cp _headers        dist/_headers
cp og.png          dist/og.png

# Hash the markup, the stylesheet and the script together: a change in
# any one of them is a new build, and index.html alone no longer moves
# when the CSS or the JS does.
HASH=$( cat dist/index.html dist/styles.css dist/app.js \
        | (sha256sum 2>/dev/null || shasum -a 256) | cut -c1-12 )
printf '{"build":"%s"}\n' "$HASH" > dist/version.json
echo "built $HASH"
