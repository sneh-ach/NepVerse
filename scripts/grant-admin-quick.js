/**
 * Quick script to grant admin access to a user
 * Usage: node grant-admin-quick.js YOUR_EMAIL
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantAdmin(email) {
  if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: node grant-admin-quick.js YOUR_EMAIL');
    process.exit(1);
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!existingUser) {
      console.log(`❌ User with email "${email}" not found`);
      console.log('   Please sign up first at http://localhost:3000/signup');
      process.exit(1);
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    });

    console.log('✅ Admin access granted!');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log('\n🎉 You can now access the admin panel!');
    console.log('   Go to: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2025') {
      console.log('   User not found. Please check the email address.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
grantAdmin(email);
