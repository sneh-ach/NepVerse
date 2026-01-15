import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantAdminAccess(email: string) {
  try {
    console.log(`🔐 Granting admin access to: ${email}`)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found!`)
      console.log('💡 Creating new admin user...')
      
      // Create new admin user (you'll need to set a password)
      const { hashPassword } = await import('../lib/auth')
      const password = await hashPassword('admin123') // Change this password!
      
      const newAdmin = await prisma.user.create({
        data: {
          email,
          passwordHash: password,
          role: 'ADMIN',
          profile: {
            create: {
              firstName: 'Admin',
              lastName: 'User',
            },
          },
        },
      })
      
      console.log('✅ Created new admin user!')
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Role: ${newAdmin.role}`)
      console.log(`   ⚠️  Default password: admin123 - Please change this!`)
      return
    }

    // Update existing user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })

    console.log('✅ Admin access granted!')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Role: ${updatedUser.role}`)
    console.log(`   User ID: ${updatedUser.id}`)
  } catch (error) {
    console.error('❌ Error granting admin access:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address!')
  console.log('Usage: npm run grant-admin <email>')
  console.log('Example: npm run grant-admin sxa6003@mavs.uta.edu')
  process.exit(1)
}

grantAdminAccess(email)


