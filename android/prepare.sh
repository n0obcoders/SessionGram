#!/usr/bin/env bash
# Copy the shared SessionGram server + web UI into the Android project.
set -e
cd "$(dirname "$0")"
rm -rf app/src/main/assets/web && mkdir -p app/src/main/assets/web
cp ../static/* app/src/main/assets/web/
cp ../server.py app/src/main/python/server.py
