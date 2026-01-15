// Quick script to grant admin access
// Usage: node scripts/quick-grant-admin.js sxa6003@mavs.uta.edu

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function grantAdmin(email) {
  try {
    console.log(`🔐 Granting admin access to: ${email}`)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User not found! Please sign up first at /signup`)
      process.exit(1)
    }

    // Update to admin
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })

    console.log('✅ Admin access granted!')
    console.log(`   Email: ${updated.email}`)
    console.log(`   Role: ${updated.role}`)
    console.log('')
    console.log('🎉 You can now access:')
    console.log('   - http://localhost:3000/admin/dashboard')
    console.log('   - http://localhost:3000/admin/content')
    console.log('   - http://localhost:3000/admin/moderation')
    console.log('')
    console.log('💡 You may need to refresh the page or logout/login again')
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User not found: ${email}`)
      console.log('💡 User needs to sign up first at /signup')
    } else if (error.message.includes('Unknown arg `role`')) {
      console.error('❌ Role field not in database!')
      console.log('💡 Run: npx prisma db push')
    } else {
      console.error('❌ Error:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('❌ Please provide email!')
  console.log('Usage: node scripts/quick-grant-admin.js <email>')
  process.exit(1)
}

grantAdmin(email)


