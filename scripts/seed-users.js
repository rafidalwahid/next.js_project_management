// scripts/seed-users.js
const { PrismaClient } = require('../lib/prisma-client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Clear existing users (optional - comment out if you want to keep existing users)
    console.log('Clearing existing users...');
    await prisma.user.deleteMany({});
    console.log('Existing users cleared.');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        bio: 'System administrator with full access to all features.',
        jobTitle: 'System Administrator',
        department: 'IT',
        location: 'Headquarters',
        phone: '+1 (555) 123-4567',
        skills: 'System administration, User management, Security',
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user: ${admin.email}`);

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.create({
      data: {
        name: 'Manager User',
        email: 'manager@example.com',
        password: managerPassword,
        role: 'manager',
        bio: 'Project manager responsible for overseeing team activities and project progress.',
        jobTitle: 'Project Manager',
        department: 'Operations',
        location: 'Regional Office',
        phone: '+1 (555) 234-5678',
        skills: 'Project management, Team leadership, Resource planning',
        emailVerified: new Date(),
      },
    });
    console.log(`Created manager user: ${manager.email}`);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
        bio: 'Team member working on various projects.',
        jobTitle: 'Developer',
        department: 'Engineering',
        location: 'Remote',
        phone: '+1 (555) 345-6789',
        skills: 'Frontend development, UI/UX design, Testing',
        emailVerified: new Date(),
      },
    });
    console.log(`Created regular user: ${user.email}`);

    // Create guest user
    const guestPassword = await bcrypt.hash('guest123', 10);
    const guest = await prisma.user.create({
      data: {
        name: 'Guest User',
        email: 'guest@example.com',
        password: guestPassword,
        role: 'user', // Using 'user' role with limited permissions
        bio: 'Guest account with limited access.',
        jobTitle: 'Guest',
        department: 'External',
        location: 'External',
        phone: '+1 (555) 456-7890',
        skills: 'Basic system usage',
        emailVerified: new Date(),
      },
    });
    console.log(`Created guest user: ${guest.email}`);

    // Create test user
    const testPassword = await bcrypt.hash('test123', 10);
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: testPassword,
        role: 'user',
        bio: 'Account used for testing purposes.',
        jobTitle: 'Tester',
        department: 'QA',
        location: 'Test Environment',
        phone: '+1 (555) 567-8901',
        skills: 'Testing, Bug reporting, Documentation',
        emailVerified: new Date(),
      },
    });
    console.log(`Created test user: ${testUser.email}`);

    console.log('Database seeding completed successfully!');
    console.log('\nUser credentials:');
    console.log('- Admin: admin@example.com / admin123');
    console.log('- Manager: manager@example.com / manager123');
    console.log('- User: user@example.com / user123');
    console.log('- Guest: guest@example.com / guest123');
    console.log('- Test: test@example.com / test123');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
