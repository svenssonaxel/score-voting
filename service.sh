#!/bin/bash
set -e
finish() { if [ $? -gt 0 ]; then echo FAILED; exit 1; fi; }
trap finish EXIT

export NVMDIR="$PWD/.nvm"
set +e
[ -s "$NVMDIR/nvm.sh" ] && \. "$NVMDIR/nvm.sh"
set -e
nvm use

if [ -z "${SCORE_VOTING_DATA_DIR+x}" ]; then
    mkdir -p /var/local/score-voting
else
    mkdir -p "${SCORE_VOTING_DATA_DIR}"
fi

export NODE_ENV=production
node backend/index.js
