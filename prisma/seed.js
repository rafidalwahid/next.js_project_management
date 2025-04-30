// prisma/seed.js
const { PrismaClient } = require('../lib/prisma-client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding process...');

  // Clear existing data (optional - be careful in production!)
  await clearExistingData();

  // Seed users with roles directly in the User model
  const users = await seedUsers();

  // Create projects with statuses
  const projects = await seedProjects(users);

  // Create team members for projects
  await seedTeamMembers(projects, users);

  // Create tasks for projects
  const tasks = await seedTasks(projects, users);

  // Create task assignments
  await seedTaskAssignees(tasks, users);

  // Create comments on tasks
  await seedComments(tasks, users);

  // Create attendance records
  await seedAttendanceRecords(users, projects, tasks);

  // Create attendance settings
  await seedAttendanceSettings(users);

  // Create events
  await seedEvents(projects);

  // Create documents
  await seedDocuments(users);

  // Create activities
  await seedActivities(users, projects, tasks);

  // Create task attachments
  await seedTaskAttachments(tasks, users);

  console.log('Database seeding completed successfully!');
}

// Clear existing data - be careful with this in production!
async function clearExistingData() {
  console.log('Clearing existing data...');

  // Delete dependent records first to avoid foreign key constraints
  await prisma.taskAttachment.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.projectStatus.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceSettings.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  console.log('Existing data cleared.');
}

// Role and permission functions have been removed
// Permissions are now managed through code in lib/permissions/permission-system.ts

// Seed users
async function seedUsers() {
  console.log('Seeding users...');

  const hashedPassword = await hash('password123', 10);

  const usersToCreate = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      bio: 'System administrator with full access to all features',
      location: 'New York',
      phone: '555-123-4567',
      skills: 'System Administration, Security, DevOps'
    },
    {
      name: 'Project Manager',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Product',
      jobTitle: 'Senior Project Manager',
      bio: 'Experienced project manager specializing in software delivery',
      location: 'San Francisco',
      phone: '555-234-5678',
      skills: 'Agile, Scrum, Team Leadership, Risk Management'
    },
    {
      name: 'Developer One',
      email: 'dev1@example.com',
      password: hashedPassword,
      role: 'developer',
      department: 'Engineering',
      jobTitle: 'Senior Developer',
      bio: 'Full-stack developer with 8 years of experience',
      location: 'Seattle',
      phone: '555-345-6789',
      skills: 'JavaScript, React, Node.js, TypeScript, Next.js'
    },
    {
      name: 'Developer Two',
      email: 'dev2@example.com',
      password: hashedPassword,
      role: 'developer',
      department: 'Engineering',
      jobTitle: 'Frontend Developer',
      bio: 'Frontend specialist focusing on user interfaces',
      location: 'Austin',
      phone: '555-456-7890',
      skills: 'HTML, CSS, JavaScript, React, UI/UX'
    },
    {
      name: 'Developer Three',
      email: 'dev3@example.com',
      password: hashedPassword,
      role: 'developer',
      department: 'Engineering',
      jobTitle: 'Backend Developer',
      bio: 'Backend developer with database expertise',
      location: 'Boston',
      phone: '555-567-8901',
      skills: 'Node.js, Python, SQL, NoSQL, API Design'
    },
    {
      name: 'Designer',
      email: 'designer@example.com',
      password: hashedPassword,
      role: 'designer',
      department: 'Design',
      jobTitle: 'UX/UI Designer',
      bio: 'Creative designer focused on user experience',
      location: 'Los Angeles',
      phone: '555-678-9012',
      skills: 'Figma, Adobe XD, Sketch, UI/UX Design, Prototyping'
    },
    {
      name: 'Tester',
      email: 'tester@example.com',
      password: hashedPassword,
      role: 'tester',
      department: 'QA',
      jobTitle: 'Quality Assurance Engineer',
      bio: 'Thorough QA engineer with automation experience',
      location: 'Chicago',
      phone: '555-789-0123',
      skills: 'Manual Testing, Automated Testing, QA Processes, Selenium'
    },
    {
      name: 'HR Manager',
      email: 'hr@example.com',
      password: hashedPassword,
      role: 'hr',
      department: 'Human Resources',
      jobTitle: 'HR Manager',
      bio: 'Human resources manager handling personnel and attendance',
      location: 'Denver',
      phone: '555-890-1234',
      skills: 'HR Management, Employee Relations, Attendance Tracking'
    },
    {
      name: 'Client User',
      email: 'client@example.com',
      password: hashedPassword,
      role: 'client',
      department: 'External',
      jobTitle: 'Client Representative',
      bio: 'External client with limited access to project details',
      location: 'Miami',
      phone: '555-901-2345',
      skills: 'Project Management, Communication'
    },
    {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: hashedPassword,
      role: 'viewer',
      department: 'Marketing',
      jobTitle: 'Marketing Specialist',
      bio: 'Marketing team member with read-only access',
      location: 'Portland',
      phone: '555-012-3456',
      skills: 'Marketing, Communication, Content Strategy'
    }
  ];

  const users = {};

  for (const userData of usersToCreate) {
    const { role, ...userDataWithoutRole } = userData;
    const user = await prisma.user.create({
      data: userDataWithoutRole
    });

    users[role] = user;
    console.log(`Created user: ${userData.name} (${userData.email})`);
  }

  // Create additional developers for team diversity
  const extraDevelopers = [];
  for (let i = 4; i <= 8; i++) {
    const devUser = await prisma.user.create({
      data: {
        name: `Developer ${i}`,
        email: `dev${i}@example.com`,
        password: hashedPassword,
        role: 'developer',
        department: 'Engineering',
        jobTitle: 'Software Developer',
        bio: `Developer with various skills and experience`,
        location: 'Remote',
        phone: `555-${i}00-${i}${i}${i}${i}`,
        skills: 'JavaScript, Python, React, Node.js'
      }
    });
    extraDevelopers.push(devUser);
    console.log(`Created additional developer: Developer ${i}`);
  }

  users.extraDevelopers = extraDevelopers;

  return users;
}

// Role assignments are now handled directly in the User model
// through the 'role' field

// Seed projects
async function seedProjects(users) {
  console.log('Seeding projects...');

  const now = new Date();
  const projectsToCreate = [
    {
      title: 'Website Redesign',
      description: 'Complete redesign of company marketing website with new branding',
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      estimatedTime: 450,
      totalTimeSpent: 280,
      createdById: users.manager.id,
      statuses: [
        { name: 'To Do', color: '#E5E5E5', description: 'Tasks not yet started', isDefault: true, order: 1 },
        { name: 'In Progress', color: '#3498DB', description: 'Tasks currently being worked on', isDefault: false, order: 2 },
        { name: 'Review', color: '#F39C12', description: 'Tasks ready for review', isDefault: false, order: 3 },
        { name: 'Done', color: '#2ECC71', description: 'Completed tasks', isDefault: false, order: 4 }
      ]
    },
    {
      title: 'Mobile App Development',
      description: 'Cross-platform mobile application to complement our main product',
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 30),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 3, 30),
      estimatedTime: 800,
      totalTimeSpent: 250,
      createdById: users.manager.id,
      statuses: [
        { name: 'Backlog', color: '#BDC3C7', description: 'Future tasks', isDefault: true, order: 1 },
        { name: 'In Development', color: '#3498DB', description: 'Currently in development', isDefault: false, order: 2 },
        { name: 'Testing', color: '#F1C40F', description: 'Under testing', isDefault: false, order: 3 },
        { name: 'Ready for Release', color: '#27AE60', description: 'Verified and ready for release', isDefault: false, order: 4 },
        { name: 'Released', color: '#2ECC71', description: 'Released to production', isDefault: false, order: 5 }
      ]
    },
    {
      title: 'API Integration Project',
      description: 'Integration with third-party payment and analytics APIs',
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 25),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 25),
      estimatedTime: 200,
      totalTimeSpent: 40,
      createdById: users.developer.id,
      statuses: [
        { name: 'Not Started', color: '#E5E5E5', description: 'Work not yet begun', isDefault: true, order: 1 },
        { name: 'In Progress', color: '#3498DB', description: 'Currently working', isDefault: false, order: 2 },
        { name: 'Testing', color: '#F39C12', description: 'In testing phase', isDefault: false, order: 3 },
        { name: 'Complete', color: '#2ECC71', description: 'Work completed', isDefault: false, order: 4 }
      ]
    },
    {
      title: 'Internal Dashboard',
      description: 'Admin dashboard for internal company use',
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), 5),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
      estimatedTime: 300,
      totalTimeSpent: 320,
      createdById: users.manager.id,
      statuses: [
        { name: 'To Do', color: '#E5E5E5', description: 'Tasks not yet started', isDefault: true, order: 1 },
        { name: 'Working', color: '#3498DB', description: 'In progress', isDefault: false, order: 2 },
        { name: 'Done', color: '#2ECC71', description: 'Completed', isDefault: false, order: 3 }
      ]
    },
    {
      title: 'Product Launch Campaign',
      description: 'Marketing and PR activities for upcoming product launch',
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      estimatedTime: 150,
      totalTimeSpent: 0,
      createdById: users.manager.id,
      statuses: [
        { name: 'Planning', color: '#BDC3C7', description: 'In planning phase', isDefault: true, order: 1 },
        { name: 'In Progress', color: '#3498DB', description: 'Work in progress', isDefault: false, order: 2 },
        { name: 'Review', color: '#F39C12', description: 'Under review', isDefault: false, order: 3 },
        { name: 'Approved', color: '#2ECC71', description: 'Approved and complete', isDefault: false, order: 4 }
      ]
    }
  ];

  const projects = [];

  for (const projectData of projectsToCreate) {
    const { statuses, ...projectDataWithoutStatuses } = projectData;

    const project = await prisma.project.create({
      data: projectDataWithoutStatuses
    });

    // Create status columns for each project
    for (const statusData of statuses) {
      await prisma.projectStatus.create({
        data: {
          ...statusData,
          projectId: project.id
        }
      });
    }

    projects.push(project);
    console.log(`Created project: ${projectData.title}`);
  }

  return projects;
}

// Seed team members for projects
async function seedTeamMembers(projects, users) {
  console.log('Assigning team members to projects...');

  const teamAssignments = [
    // Website Redesign Project
    { project: projects[0], user: users.manager },
    { project: projects[0], user: users.developer },
    { project: projects[0], user: users.designer },
    { project: projects[0], user: users.tester },

    // Mobile App Development
    { project: projects[1], user: users.manager },
    { project: projects[1], user: users.developer },
    { project: projects[1], user: users.extraDevelopers[0] },
    { project: projects[1], user: users.extraDevelopers[1] },
    { project: projects[1], user: users.designer },
    { project: projects[1], user: users.tester },

    // API Integration Project
    { project: projects[2], user: users.developer },
    { project: projects[2], user: users.extraDevelopers[2] },
    { project: projects[2], user: users.extraDevelopers[3] },

    // Internal Dashboard
    { project: projects[3], user: users.manager },
    { project: projects[3], user: users.developer },
    { project: projects[3], user: users.designer },
    { project: projects[3], user: users.extraDevelopers[0] },

    // Product Launch Campaign
    { project: projects[4], user: users.manager },
    { project: projects[4], user: users.designer },
    { project: projects[4], user: users.extraDevelopers[4] }
  ];

  for (const { project, user } of teamAssignments) {
    await prisma.teamMember.create({
      data: {
        projectId: project.id,
        userId: user.id
      }
    });
    console.log(`Assigned ${user.name} to project "${project.title}"`);
  }
}

// Get project statuses for a specific project
async function getProjectStatuses(projectId) {
  return await prisma.projectStatus.findMany({
    where: {
      projectId
    }
  });
}

// Seed tasks
async function seedTasks(projects, users) {
  console.log('Creating tasks for projects...');

  const tasks = [];

  for (const project of projects) {
    const statuses = await getProjectStatuses(project.id);

    // Create a mapping of status name to id for easier reference
    const statusMap = {};
    for (const status of statuses) {
      statusMap[status.name] = status.id;
    }

    // Create different tasks based on project type
    let projectTasks;

    if (project.title === 'Website Redesign') {
      projectTasks = [
        {
          title: 'Design homepage mockup',
          description: 'Create high-fidelity mockups for the new homepage design',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          statusId: statusMap['Done'],
          estimatedTime: 20,
          timeSpent: 22,
          completed: true
        },
        {
          title: 'Implement responsive layout',
          description: 'Build responsive grid system for all screen sizes',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          statusId: statusMap['In Progress'],
          estimatedTime: 40,
          timeSpent: 30,
          completed: false
        },
        {
          title: 'Create component library',
          description: 'Build reusable UI components for the website',
          priority: 'medium',
          dueDate: new Date(project.startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          statusId: statusMap['To Do'],
          estimatedTime: 60,
          timeSpent: 0,
          completed: false,
          subtasks: [
            {
              title: 'Button components',
              description: 'Create different button styles and states',
              priority: 'medium',
              estimatedTime: 10,
              timeSpent: 0,
              completed: false
            },
            {
              title: 'Form components',
              description: 'Create form elements and validation states',
              priority: 'medium',
              estimatedTime: 15,
              timeSpent: 0,
              completed: false
            },
            {
              title: 'Card components',
              description: 'Create various card layouts and styles',
              priority: 'medium',
              estimatedTime: 12,
              timeSpent: 0,
              completed: false
            }
          ]
        },
        {
          title: 'Content migration',
          description: 'Migrate existing content to new website structure',
          priority: 'low',
          dueDate: new Date(project.endDate.getTime() - 14 * 24 * 60 * 60 * 1000),
          statusId: statusMap['To Do'],
          estimatedTime: 30,
          timeSpent: 0,
          completed: false
        },
        {
          title: 'SEO optimization',
          description: 'Implement SEO best practices across the website',
          priority: 'medium',
          dueDate: new Date(project.endDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          statusId: statusMap['To Do'],
          estimatedTime: 25,
          timeSpent: 0,
          completed: false
        }
      ];
    } else if (project.title === 'Mobile App Development') {
      projectTasks = [
        {
          title: 'App architecture design',
          description: 'Design the overall architecture for the mobile app',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          statusId: statusMap['Released'],
          estimatedTime: 30,
          timeSpent: 35,
          completed: true
        },
        {
          title: 'User authentication module',
          description: 'Implement user login, registration and password recovery',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          statusId: statusMap['Testing'],
          estimatedTime: 50,
          timeSpent: 60,
          completed: false
        },
        {
          title: 'Product catalog implementation',
          description: 'Create product browsing and filtering functionality',
          priority: 'medium',
          dueDate: new Date(project.startDate.getTime() + 35 * 24 * 60 * 60 * 1000),
          statusId: statusMap['In Development'],
          estimatedTime: 70,
          timeSpent: 40,
          completed: false,
          subtasks: [
            {
              title: 'Product listing screen',
              description: 'Implement main product catalog view',
              priority: 'medium',
              estimatedTime: 20,
              timeSpent: 22,
              completed: true
            },
            {
              title: 'Product detail screen',
              description: 'Implement product detail view with images and specifications',
              priority: 'medium',
              estimatedTime: 15,
              timeSpent: 10,
              completed: false
            },
            {
              title: 'Search and filter functionality',
              description: 'Implement product search and filtering options',
              priority: 'medium',
              estimatedTime: 25,
              timeSpent: 8,
              completed: false
            }
          ]
        },
        {
          title: 'Shopping cart and checkout',
          description: 'Implement cart management and checkout process',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 50 * 24 * 60 * 60 * 1000),
          statusId: statusMap['Backlog'],
          estimatedTime: 60,
          timeSpent: 0,
          completed: false
        },
        {
          title: 'Push notification system',
          description: 'Set up push notifications for order updates and promotions',
          priority: 'low',
          dueDate: new Date(project.endDate.getTime() - 14 * 24 * 60 * 60 * 1000),
          statusId: statusMap['Backlog'],
          estimatedTime: 25,
          timeSpent: 0,
          completed: false
        }
      ];
    } else {
      // Generic tasks for other projects
      projectTasks = [
        {
          title: 'Project kickoff meeting',
          description: 'Initial team meeting to discuss project goals and timeline',
          priority: 'medium',
          dueDate: new Date(project.startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          statusId: Object.values(statusMap)[Object.values(statusMap).length - 1], // Last status (completed)
          estimatedTime: 4,
          timeSpent: 4,
          completed: true
        },
        {
          title: 'Requirements gathering',
          description: 'Document detailed project requirements',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          statusId: Object.values(statusMap)[Math.min(2, Object.values(statusMap).length - 1)],
          estimatedTime: 15,
          timeSpent: 18,
          completed: Object.values(statusMap).length <= 3
        },
        {
          title: 'Implementation phase',
          description: 'Execute core project development',
          priority: 'high',
          dueDate: new Date(project.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          statusId: Object.values(statusMap)[1], // Second status (in progress)
          estimatedTime: 80,
          timeSpent: 40,
          completed: false
        },
        {
          title: 'Testing and QA',
          description: 'Perform quality assurance testing',
          priority: 'medium',
          dueDate: new Date(project.endDate.getTime() - 10 * 24 * 60 * 60 * 1000),
          statusId: Object.values(statusMap)[0], // First status (to do)
          estimatedTime: 20,
          timeSpent: 0,
          completed: false
        },
        {
          title: 'Project documentation',
          description: 'Create user and technical documentation',
          priority: 'low',
          dueDate: new Date(project.endDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          statusId: Object.values(statusMap)[0], // First status (to do)
          estimatedTime: 10,
          timeSpent: 0,
          completed: false
        }
      ];
    }

    for (const taskData of projectTasks) {
      const { subtasks, ...taskDataWithoutSubtasks } = taskData;

      // Create the main task
      const task = await prisma.task.create({
        data: {
          ...taskDataWithoutSubtasks,
          projectId: project.id
        }
      });

      tasks.push(task);
      console.log(`Created task: ${task.title} for project "${project.title}"`);

      // Create subtasks if any
      if (subtasks) {
        for (const subtaskData of subtasks) {
          const subtask = await prisma.task.create({
            data: {
              ...subtaskData,
              projectId: project.id,
              parentId: task.id,
              statusId: task.statusId
            }
          });

          tasks.push(subtask);
          console.log(`Created subtask: ${subtask.title} for task "${task.title}"`);
        }
      }
    }
  }

  return tasks;
}

// Seed task assignees
async function seedTaskAssignees(tasks, users) {
  console.log('Assigning users to tasks...');

  const developerUsers = [users.developer, ...users.extraDevelopers];
  const allUsers = [users.manager, ...developerUsers, users.designer, users.tester];

  for (const task of tasks) {
    // Assign 1-3 users to each task
    const assigneeCount = Math.floor(Math.random() * 3) + 1;
    const shuffledUsers = [...allUsers].sort(() => 0.5 - Math.random());
    const taskAssignees = shuffledUsers.slice(0, assigneeCount);

    for (const user of taskAssignees) {
      await prisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id
        }
      });
      console.log(`Assigned user ${user.name} to task "${task.title}"`);
    }
  }
}

// Seed comments on tasks
async function seedComments(tasks, users) {
  console.log('Adding comments to tasks...');

  const commentTemplates = [
    "I've started working on this. Should be done soon.",
    "Need some clarification on the requirements.",
    "This is more complex than we initially thought.",
    "Just finished the first part of this task.",
    "Can someone review my work so far?",
    "I'm running into some challenges with this.",
    "Looking good! Just a few minor adjustments needed.",
    "Great progress on this task!",
    "Let's discuss this in the next standup meeting.",
    "I've updated the approach based on feedback."
  ];

  const allUsers = [users.manager, users.developer, ...users.extraDevelopers, users.designer, users.tester];

  for (const task of tasks) {
    // Add 0-5 comments per task
    const commentCount = Math.floor(Math.random() * 6);

    for (let i = 0; i < commentCount; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

      await prisma.comment.create({
        data: {
          content: randomComment,
          taskId: task.id,
          userId: randomUser.id,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Random date within last week
        }
      });
    }

    console.log(`Added ${commentCount} comments to task "${task.title}"`);
  }
}

// Seed attendance records
async function seedAttendanceRecords(users, projects, tasks) {
  console.log('Creating attendance records...');

  const allUsers = [users.manager, users.developer, ...users.extraDevelopers, users.designer, users.tester];
  const now = new Date();

  // Create attendance records for the last 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    for (const user of allUsers) {
      // 90% chance of having an attendance record
      if (Math.random() < 0.9) {
        const checkInHour = 8 + Math.floor(Math.random() * 2); // Between 8-9 AM
        const checkInTime = new Date(date);
        checkInTime.setHours(checkInHour, Math.floor(Math.random() * 60), 0, 0);

        const workHours = 7 + Math.random() * 3; // 7-10 hours
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(checkOutTime.getHours() + Math.floor(workHours));
        checkOutTime.setMinutes(Math.floor(Math.random() * 60));

        // Choose a random project and task for this attendance
        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        const projectTasks = tasks.filter(task => task.projectId === randomProject.id);
        const randomTask = projectTasks.length > 0 ? projectTasks[Math.floor(Math.random() * projectTasks.length)] : null;

        await prisma.attendance.create({
          data: {
            userId: user.id,
            checkInTime,
            checkOutTime,
            checkInLatitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            checkInLongitude: -74.006 + (Math.random() - 0.5) * 0.01,
            checkOutLatitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            checkOutLongitude: -74.006 + (Math.random() - 0.5) * 0.01,
            checkInIpAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            checkOutIpAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            checkInDeviceInfo: 'Chrome on Windows',
            checkOutDeviceInfo: 'Chrome on Windows',
            totalHours: workHours,
            checkInLocationName: 'Office',
            checkOutLocationName: 'Office',
            projectId: randomProject.id,
            taskId: randomTask?.id
          }
        });
      }
    }

    console.log(`Created attendance records for ${date.toDateString()}`);
  }

  // Create some attendance adjustments by HR
  for (let i = 0; i < 10; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const adjustmentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 30));

    await prisma.attendance.create({
      data: {
        userId: randomUser.id,
        checkInTime: new Date(adjustmentDate.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(adjustmentDate.setHours(17, 0, 0, 0)),
        totalHours: 8,
        adjustedById: users.hr.id,
        adjustmentReason: 'Adjusted due to forgotten check-in/out',
        notes: 'Manual adjustment approved by HR'
      }
    });
  }
}

// Seed attendance settings
async function seedAttendanceSettings(users) {
  console.log('Creating attendance settings...');

  const allUsers = [users.manager, users.developer, ...users.extraDevelopers, users.designer, users.tester];

  for (const user of allUsers) {
    await prisma.attendanceSettings.create({
      data: {
        userId: user.id,
        workHoursPerDay: 8,
        workDays: '1,2,3,4,5',
        reminderEnabled: Math.random() > 0.3,
        reminderTime: '09:00',
        autoCheckoutEnabled: Math.random() > 0.7,
        autoCheckoutTime: '17:30'
      }
    });

    console.log(`Created attendance settings for user ${user.name}`);
  }
}

// Seed events
async function seedEvents(projects) {
  console.log('Creating events...');

  const now = new Date();
  const eventTypes = [
    'Team Meeting',
    'Sprint Planning',
    'Sprint Review',
    'Client Demo',
    'Release',
    'Milestone',
    'Deployment',
    'Design Review',
    'Kickoff Meeting'
  ];

  for (const project of projects) {
    // Create 3-8 events per project
    const eventCount = 3 + Math.floor(Math.random() * 6);

    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const daysFromNow = -30 + Math.floor(Math.random() * 60); // Events from 30 days ago to 30 days in future
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + daysFromNow);

      await prisma.event.create({
        data: {
          title: `${project.title} - ${eventType}`,
          description: `${eventType} for ${project.title} project`,
          date: eventDate,
          projectId: project.id
        }
      });
    }

    console.log(`Created ${eventCount} events for project "${project.title}"`);
  }
}

// Seed documents
async function seedDocuments(users) {
  console.log('Creating documents...');

  const allUsers = [users.manager, users.developer, users.extraDevelopers[0], users.designer];
  const documentTypes = [
    { name: 'Requirements Doc', fileType: 'pdf', fileSize: 1024 * 1024 },
    { name: 'Design Specs', fileType: 'pdf', fileSize: 2048 * 1024 },
    { name: 'Technical Documentation', fileType: 'pdf', fileSize: 3072 * 1024 },
    { name: 'User Guide', fileType: 'pdf', fileSize: 1536 * 1024 },
    { name: 'Project Plan', fileType: 'xlsx', fileSize: 512 * 1024 },
    { name: 'Budget Report', fileType: 'xlsx', fileSize: 256 * 1024 },
    { name: 'Meeting Minutes', fileType: 'docx', fileSize: 128 * 1024 },
    { name: 'Research Findings', fileType: 'pptx', fileSize: 4096 * 1024 }
  ];

  for (const user of allUsers) {
    // Create 1-3 documents per user
    const docCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < docCount; i++) {
      const docTemplate = documentTypes[Math.floor(Math.random() * documentTypes.length)];

      await prisma.document.create({
        data: {
          name: `${docTemplate.name} - ${user.name}`,
          description: `${docTemplate.name} uploaded by ${user.name}`,
          fileType: docTemplate.fileType,
          fileSize: docTemplate.fileSize,
          filePath: `/uploads/documents/${Date.now()}_${docTemplate.name.toLowerCase().replace(/\s+/g, '-')}.${docTemplate.fileType}`,
          userId: user.id
        }
      });
    }

    console.log(`Created ${docCount} documents for user ${user.name}`);
  }
}

// Seed activities
async function seedActivities(users, projects, tasks) {
  console.log('Creating activity logs...');

  const allUsers = [users.manager, users.developer, ...users.extraDevelopers, users.designer, users.tester];
  const now = new Date();

  const activityTemplates = [
    { action: 'create', description: 'created' },
    { action: 'update', description: 'updated' },
    { action: 'comment', description: 'commented on' },
    { action: 'complete', description: 'marked as complete' },
    { action: 'assign', description: 'assigned' }
  ];

  // Project activities
  for (const project of projects) {
    // Create activities
    await prisma.activity.create({
      data: {
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        description: `created project "${project.title}"`,
        userId: project.createdById,
        projectId: project.id,
        createdAt: project.createdAt
      }
    });

    // Create 2-5 update activities per project
    const updateCount = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < updateCount; i++) {
      const daysAfterCreation = Math.floor(Math.random() *
        Math.max(1, (now.getTime() - project.createdAt.getTime()) / (24 * 60 * 60 * 1000)));
      const activityDate = new Date(project.createdAt);
      activityDate.setDate(activityDate.getDate() + daysAfterCreation);

      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

      await prisma.activity.create({
        data: {
          action: 'update',
          entityType: 'project',
          entityId: project.id,
          description: `updated project "${project.title}"`,
          userId: randomUser.id,
          projectId: project.id,
          createdAt: activityDate
        }
      });
    }
  }

  // Task activities
  for (const task of tasks) {
    // Create activity
    await prisma.activity.create({
      data: {
        action: 'create',
        entityType: 'task',
        entityId: task.id,
        description: `created task "${task.title}"`,
        userId: projects.find(p => p.id === task.projectId)?.createdById || allUsers[0].id,
        projectId: task.projectId,
        taskId: task.id,
        createdAt: task.createdAt
      }
    });

    // Create task update activities
    if (Math.random() > 0.3) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const updateDate = new Date(task.createdAt);
      updateDate.setDate(updateDate.getDate() + Math.floor(Math.random() * 7) + 1);

      await prisma.activity.create({
        data: {
          action: 'update',
          entityType: 'task',
          entityId: task.id,
          description: `updated task "${task.title}"`,
          userId: randomUser.id,
          projectId: task.projectId,
          taskId: task.id,
          createdAt: updateDate
        }
      });
    }

    // Create task assignment activities
    if (Math.random() > 0.5) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const assignmentUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const assignDate = new Date(task.createdAt);
      assignDate.setDate(assignDate.getDate() + Math.floor(Math.random() * 3) + 1);

      await prisma.activity.create({
        data: {
          action: 'assign',
          entityType: 'task',
          entityId: task.id,
          description: `assigned task "${task.title}" to ${assignmentUser.name}`,
          userId: randomUser.id,
          projectId: task.projectId,
          taskId: task.id,
          createdAt: assignDate
        }
      });
    }

    // Create completed task activities
    if (task.completed) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const completeDate = new Date(task.createdAt);
      completeDate.setDate(completeDate.getDate() + Math.floor(Math.random() * 14) + 1);

      await prisma.activity.create({
        data: {
          action: 'complete',
          entityType: 'task',
          entityId: task.id,
          description: `marked task "${task.title}" as complete`,
          userId: randomUser.id,
          projectId: task.projectId,
          taskId: task.id,
          createdAt: completeDate
        }
      });
    }
  }

  console.log('Activity logs created successfully');
}

// Seed task attachments
async function seedTaskAttachments(tasks, users) {
  console.log('Creating task attachments...');

  const allUsers = [users.manager, users.developer, ...users.extraDevelopers, users.designer, users.tester];
  const attachmentTypes = [
    { fileType: 'png', size: 512 * 1024 },
    { fileType: 'jpg', size: 1024 * 1024 },
    { fileType: 'pdf', size: 2048 * 1024 },
    { fileType: 'docx', size: 1536 * 1024 },
    { fileType: 'xlsx', size: 256 * 1024 }
  ];

  // Only add attachments to some tasks
  const tasksWithAttachments = tasks.filter(() => Math.random() > 0.7);

  for (const task of tasksWithAttachments) {
    const attachmentCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < attachmentCount; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const attachmentType = attachmentTypes[Math.floor(Math.random() * attachmentTypes.length)];
      const filename = `attachment_${task.id}_${i + 1}.${attachmentType.fileType}`;

      await prisma.taskAttachment.create({
        data: {
          filename,
          fileUrl: `/uploads/attachments/${filename}`,
          fileSize: attachmentType.size,
          fileType: attachmentType.fileType,
          taskId: task.id,
          userId: randomUser.id
        }
      });
    }

    console.log(`Created ${attachmentCount} attachments for task "${task.title}"`);
  }
}

// Execute the main function
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });