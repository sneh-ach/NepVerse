/**
 * This file forces Next.js to include Prisma engine binaries
 * by importing them explicitly
 */
import { PrismaClient } from '@prisma/client'

// Force import to ensure Prisma files are included in build
export const prismaImport = PrismaClient
