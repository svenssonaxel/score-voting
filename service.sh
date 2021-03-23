#!/bin/bash
set -e
finish() { if [ $? -gt 0 ]; then echo FAILED; exit 1; fi; }
trap finish EXIT

export NVMDIR="$PWD/.nvm"
[ -d "$NVMDIR" ] || git clone https://github.com/nvm-sh/nvm.git "$NVMDIR"
( cd "$NVMDIR"; git pull )
set +e
[ -s "$NVMDIR/nvm.sh" ] && \. "$NVMDIR/nvm.sh"
set -e
nvm install
nvm use

mkdir -p /var/local/score-voting

export NODE_ENV=production
node backend/index.js
