#!/usr/bin/env node

/**
 * Script to ensure Prisma engine is available after generation
 * This helps with Vercel deployments where the engine might not be included
 */

const fs = require('fs')
const path = require('path')

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client')
const prismaClientLibPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client')

console.log('Checking Prisma engine files...')

// Check if Prisma client was generated
if (!fs.existsSync(prismaClientPath)) {
  console.error('❌ Prisma client not found at:', prismaClientPath)
  console.log('Running prisma generate...')
  const { execSync } = require('child_process')
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
  } catch (error) {
    console.error('Failed to generate Prisma client:', error)
    process.exit(1)
  }
}

// List engine files
const engineFiles = fs.readdirSync(prismaClientPath).filter((file) =>
  file.includes('query_engine') || file.includes('libquery_engine')
)

if (engineFiles.length === 0) {
  console.error('❌ No Prisma engine files found')
  process.exit(1)
}

console.log('✅ Prisma engine files found:')
engineFiles.forEach((file) => {
  const filePath = path.join(prismaClientPath, file)
  const stats = fs.statSync(filePath)
  console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
})

console.log('✅ Prisma engine check complete')
