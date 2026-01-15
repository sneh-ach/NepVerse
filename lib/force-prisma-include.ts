/**
 * Force Next.js to include Prisma engine binaries
 * This file is imported to ensure Prisma files are traced during build
 */

// This import forces Next.js to include the Prisma client
import '@prisma/client'

// Try to require the engine file directly (this will fail at runtime but ensures it's included)
if (typeof require !== 'undefined') {
  try {
    // This path ensures the engine is included in the build
    require.resolve('@prisma/client/runtime/query-engine-rhel-openssl-3.0.x')
  } catch {
    // Ignore - we just want to ensure the file is traced
  }
}

export {}
