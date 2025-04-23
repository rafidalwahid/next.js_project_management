const { PrismaClient } = require('../lib/prisma-client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createUsers() {
  try {
    // First, delete any existing users
    console.log('Cleaning up existing users...');
    await prisma.user.deleteMany();
    
    console.log('Creating users...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
      },
    });
    console.log('Admin user created');

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.create({
      data: {
        name: 'Project Manager',
        email: 'manager@example.com',
        password: managerPassword,
        role: 'manager',
      },
    });
    console.log('Manager user created');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
      },
    });
    console.log('Regular user created');

    console.log('\nUsers created successfully! Here are the credentials:');
    console.table([
      {
        Type: 'Admin',
        Email: 'admin@example.com',
        Password: 'admin123',
      },
      {
        Type: 'Manager',
        Email: 'manager@example.com',
        Password: 'manager123',
      },
      {
        Type: 'User',
        Email: 'user@example.com',
        Password: 'user123',
      }
    ]);

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();

