const { PrismaClient } = require('../lib/prisma-client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Clean up existing data (in reverse order of dependencies)
    console.log('Cleaning up existing data...');
    await prisma.activity.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.event.deleteMany();
    await prisma.task.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.projectStatus.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // Create project statuses
    console.log('Creating project statuses...');
    const activeStatus = await prisma.projectStatus.create({
      data: {
        name: 'Active',
        color: '#22c55e', // Green color
        description: 'Project is currently active and in progress',
        isDefault: true,
      },
    });

    await prisma.projectStatus.createMany({
      data: [
        {
          name: 'Completed',
          color: '#3b82f6', // Blue color
          description: 'Project has been completed successfully',
          isDefault: false,
        },
        {
          name: 'On Hold',
          color: '#f59e0b', // Amber color
          description: 'Project is temporarily on hold',
          isDefault: false,
        },
        {
          name: 'Cancelled',
          color: '#ef4444', // Red color
          description: 'Project has been cancelled',
          isDefault: false,
        },
        {
          name: 'Planning',
          color: '#8b5cf6', // Purple color
          description: 'Project is in the planning phase',
          isDefault: false,
        },
      ],
    });

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
      },
    });

    // Create regular user
    console.log('Creating regular user...');
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
      },
    });

    // Create project manager
    console.log('Creating project manager...');
    const pmPassword = await bcrypt.hash('manager123', 10);
    const projectManager = await prisma.user.create({
      data: {
        name: 'Project Manager',
        email: 'manager@example.com',
        password: pmPassword,
        role: 'manager',
      },
    });

    // Create projects
    console.log('Creating projects...');
    const project1 = await prisma.project.create({
      data: {
        title: 'Website Redesign',
        description: 'Complete update of the corporate website with new branding and improved UX',
        statusId: activeStatus.id,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-30'),
        createdById: admin.id,
        teamMembers: {
          create: [
            { userId: admin.id, role: 'owner' },
            { userId: projectManager.id, role: 'admin' },
            { userId: user.id, role: 'member' },
          ]
        }
      },
    });

    const project2 = await prisma.project.create({
      data: {
        title: 'Mobile App Development',
        description: 'Create a mobile app for iOS and Android to complement our web platform',
        statusId: activeStatus.id,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-08-15'),
        createdById: projectManager.id,
        teamMembers: {
          create: [
            { userId: projectManager.id, role: 'owner' },
            { userId: user.id, role: 'member' },
          ]
        }
      },
    });

    // Create tasks for Website Redesign project
    console.log('Creating tasks for Website Redesign project...');
    await prisma.task.createMany({
      data: [
        {
          title: 'Requirements Gathering',
          description: 'Interview stakeholders and document all requirements',
          status: 'completed',
          priority: 'high',
          dueDate: new Date('2025-01-30'),
          projectId: project1.id,
          assignedToId: projectManager.id,
          order: 1000, // Explicit order value
        },
        {
          title: 'Design Wireframes',
          description: 'Create wireframes for all main pages',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2025-02-15'),
          projectId: project1.id,
          assignedToId: user.id,
          order: 2000, // Explicit order value
        },
        {
          title: 'Frontend Development',
          description: 'Implement the frontend using React',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date('2025-03-15'),
          projectId: project1.id,
          assignedToId: user.id,
          order: 3000, // Explicit order value
        },
        {
          title: 'Backend API Development',
          description: 'Create the REST API for the frontend',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date('2025-03-30'),
          projectId: project1.id,
          assignedToId: admin.id,
          order: 4000, // Explicit order value
        },
      ]
    });

    // Create tasks for Mobile App project
    console.log('Creating tasks for Mobile App project...');
    const mobileAppTasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'App Architecture Planning',
          description: 'Design the overall architecture of the mobile app',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2025-03-15'),
          projectId: project2.id,
          assignedToId: projectManager.id,
          order: 1000, // Explicit order value
        },
      }),
      prisma.task.create({
        data: {
          title: 'UI/UX Design',
          description: 'Create the user interface and experience design',
          status: 'pending',
          priority: 'high',
          dueDate: new Date('2025-04-01'),
          projectId: project2.id,
          assignedToId: user.id,
          order: 2000, // Explicit order value
        },
      }),
      prisma.task.create({
        data: {
          title: 'iOS Development',
          description: 'Implement the iOS version of the app',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date('2025-06-01'),
          projectId: project2.id,
          assignedToId: null,
          order: 3000, // Explicit order value
        },
      }),
    ]);

    // Create subtasks for UI/UX Design task
    console.log('Creating subtasks for UI/UX Design task...');
    const uiUxTask = mobileAppTasks[1]; // UI/UX Design task
    const uiUxSubtasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'Create Wireframes',
          description: 'Create wireframes for all main screens',
          status: 'pending',
          priority: 'high',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: uiUxTask.id,
          order: 1000, // Explicit order value
        },
      }),
      prisma.task.create({
        data: {
          title: 'Design System',
          description: 'Create a design system with colors, typography, and components',
          status: 'pending',
          priority: 'medium',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: uiUxTask.id,
          order: 2000, // Explicit order value
        },
      }),
      prisma.task.create({
        data: {
          title: 'User Testing',
          description: 'Conduct user testing with prototypes',
          status: 'pending',
          priority: 'medium',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: uiUxTask.id,
          order: 3000, // Explicit order value
        },
      }),
    ]);

    // Create nested subtasks for the wireframes task
    console.log('Creating nested subtasks for wireframes task...');
    const wireframesTask = uiUxSubtasks[0]; // Create Wireframes task
    await prisma.task.createMany({
      data: [
        {
          title: 'Home Screen Wireframe',
          description: 'Create wireframe for the home screen',
          status: 'pending',
          priority: 'high',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: wireframesTask.id,
          order: 1000, // Explicit order value
        },
        {
          title: 'Profile Screen Wireframe',
          description: 'Create wireframe for the profile screen',
          status: 'pending',
          priority: 'medium',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: wireframesTask.id,
          order: 2000, // Explicit order value
        },
        {
          title: 'Settings Screen Wireframe',
          description: 'Create wireframe for the settings screen',
          status: 'pending',
          priority: 'low',
          projectId: project2.id,
          assignedToId: user.id,
          parentId: wireframesTask.id,
          order: 3000, // Explicit order value
        },
      ],
    });

    // Create events
    console.log('Creating events...');
    await prisma.event.createMany({
      data: [
        {
          title: 'Kickoff Meeting',
          description: 'Initial project kickoff with all stakeholders',
          date: new Date('2025-01-15'),
          projectId: project1.id,
        },
        {
          title: 'Design Review',
          description: 'Review wireframes and design mockups',
          date: new Date('2025-02-20'),
          projectId: project1.id,
        },
        {
          title: 'Mobile App Strategy Meeting',
          description: 'Define the strategy and goals for the mobile app',
          date: new Date('2025-03-02'),
          projectId: project2.id,
        },
      ]
    });

    // Create resources
    console.log('Creating resources...');
    await prisma.resource.createMany({
      data: [
        {
          name: 'Design Software Licenses',
          type: 'software',
          quantity: 3,
          projectId: project1.id,
        },
        {
          name: 'Frontend Developer',
          type: 'human',
          quantity: 2,
          projectId: project1.id,
        },
        {
          name: 'iOS Test Devices',
          type: 'hardware',
          quantity: 4,
          projectId: project2.id,
        },
      ]
    });

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();