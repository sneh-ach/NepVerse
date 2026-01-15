#!/bin/bash

# Switch to Node 18 and start dev server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 18
npm run dev
