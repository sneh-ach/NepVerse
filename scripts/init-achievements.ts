import { initializeAchievements } from '../lib/achievements'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Initializing achievements...')
  await initializeAchievements()
  console.log('✅ Achievements initialized!')
  
  const count = await prisma.achievement.count()
  console.log(`Total achievements: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
