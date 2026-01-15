#!/bin/bash
set -e

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🚀 Upgrading to Node.js 18 and building..."
echo ""

# Use Node.js 18
nvm use 18
echo "✅ Using Node.js $(node --version)"
echo ""

# Build the application
echo "📦 Building application..."
npm run build

echo ""
echo "✅ Build complete!"
