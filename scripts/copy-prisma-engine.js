#!/usr/bin/env node

/**
 * Script to copy Prisma engine to the correct location for Vercel deployment
 * This ensures the engine binary is available at runtime
 */

const fs = require('fs')
const path = require('path')

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client')
const prismaClientLibPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client')

console.log('Copying Prisma engine files for Vercel...')

// Find the rhel-openssl-3.0.x engine
const engineFiles = fs.readdirSync(prismaClientPath).filter((file) =>
  file.includes('rhel-openssl-3.0.x')
)

if (engineFiles.length === 0) {
  console.error('❌ No rhel-openssl-3.0.x engine files found')
  process.exit(1)
}

console.log('✅ Found engine files:', engineFiles)

// The engine should already be in the right place after prisma generate
// This script just verifies it exists
engineFiles.forEach((file) => {
  const filePath = path.join(prismaClientPath, file)
  const stats = fs.statSync(filePath)
  console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
})

console.log('✅ Prisma engine files verified for Vercel deployment')
