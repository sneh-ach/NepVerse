/**
 * Force Next.js to include Prisma engine binaries
 * This file is imported to ensure Prisma files are traced during build
 */

// This import forces Next.js to include the Prisma client
import '@prisma/client'

export {}
