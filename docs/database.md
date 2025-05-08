# Database

This document provides an overview of the database schema, entity relationships, and migration guide for the Project Management System.

## Schema Overview

The application uses a MySQL database with Prisma ORM for data modeling and access. The schema is defined in `prisma/schema.prisma`.

### Core Models

#### User

```prisma
model User {
  id                    String              @id @default(cuid())
  name                  String?
  email                 String              @unique
  emailVerified         DateTime?
  image                 String?
  password              String?
  role                  String              @default("user")
  active                Boolean             @default(true)
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  lastLogin             DateTime?
  bio                   String?             @db.Text
  department            String?
  jobTitle              String?
  location              String?
  phone                 String?
  skills                String?             @db.Text

  // Relations
  accounts              Account[]
  activities            Activity[]
  attendanceRecords     Attendance[]
  attendanceSettings    AttendanceSettings?
  correctionRequests    AttendanceCorrectionRequest[]
  comments              Comment[]
  documents             Document[]
  projects              Project[]
  sessions              Session[]
  taskAssignments       TaskAssignee[]
  taskAttachments       TaskAttachment[]
  teams                 TeamMember[]
}
```

#### Role

```prisma
model Role {
  id          String          @id @default(cuid())
  name        String          @unique
  description String?
  color       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  // Relations
  permissions RolePermission[]
}
```

#### Permission

```prisma
model Permission {
  id          String          @id @default(cuid())
  name        String          @unique
  description String?
  category    String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  // Relations
  roles       RolePermission[]
}
```

#### RolePermission

```prisma
model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relations
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

#### Project

```prisma
model Project {
  id             String          @id @default(cuid())
  title          String
  description    String?
  startDate      DateTime?
  endDate        DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  createdById    String
  dueDate        DateTime?
  estimatedTime  Float?
  totalTimeSpent Float?

  // Relations
  activities     Activity[]
  attendances    Attendance[]
  events         Event[]
  createdBy      User            @relation(fields: [createdById], references: [id])
  statuses       ProjectStatus[]
  tasks          Task[]
  teamMembers    TeamMember[]
}
```

#### Task

```prisma
model Task {
  id            String           @id @default(cuid())
  title         String
  description   String?          @db.Text
  priority      String           @default("medium")
  dueDate       DateTime?
  projectId     String
  parentId      String?
  order         Int              @default(0)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  completed     Boolean          @default(false)
  endDate       DateTime?
  estimatedTime Float?
  startDate     DateTime?
  statusId      String?
  timeSpent     Float?

  // Relations
  activities    Activity[]
  attendances   Attendance[]
  comments      Comment[]
  parent        Task?            @relation("SubTasks", fields: [parentId], references: [id], onDelete: Cascade)
  children      Task[]           @relation("SubTasks")
  project       Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status        ProjectStatus?   @relation(fields: [statusId], references: [id])
  assignees     TaskAssignee[]
  attachments   TaskAttachment[]
}
```

#### ProjectStatus

```prisma
model ProjectStatus {
  id          String   @id @default(cuid())
  name        String
  color       String   @default("#E5E5E5")
  description String?
  isDefault   Boolean  @default(false)
  order       Int      @default(0)
  projectId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]
}
```

#### Attendance

```prisma
model Attendance {
  id                  String    @id @default(cuid())
  userId              String
  checkInTime         DateTime
  checkOutTime        DateTime?
  checkInLatitude     Float?
  checkInLongitude    Float?
  checkOutLatitude    Float?
  checkOutLongitude   Float?
  checkInIpAddress    String?
  checkOutIpAddress   String?
  checkInDeviceInfo   String?
  checkOutDeviceInfo  String?
  totalHours          Float?
  notes               String?
  checkInLocationName String?
  checkOutLocationName String?
  projectId           String?
  taskId              String?
  autoCheckout        Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  project             Project?  @relation(fields: [projectId], references: [id])
  task                Task?     @relation(fields: [taskId], references: [id])
  correctionRequests  AttendanceCorrectionRequest[]
}
```

#### AttendanceSettings

```prisma
model AttendanceSettings {
  id                 String   @id @default(cuid())
  userId             String   @unique
  workHoursPerDay    Float    @default(8)
  workDays           String   @default("1,2,3,4,5")
  reminderEnabled    Boolean  @default(true)
  reminderTime       String?
  autoCheckoutEnabled Boolean  @default(false)
  autoCheckoutTime   String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### AttendanceCorrectionRequest

```prisma
model AttendanceCorrectionRequest {
  id                    String    @id @default(cuid())
  attendanceId          String
  userId                String
  requestedCheckInTime  DateTime?
  requestedCheckOutTime DateTime?
  reason                String?   @db.Text
  status                String    @default("pending") // pending, approved, rejected
  reviewedBy            String?
  reviewedAt            DateTime?
  reviewNotes           String?   @db.Text
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  attendance            Attendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Authentication Models

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  // Relations
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Entity Relationships

### One-to-Many Relationships

- **User → Project**: A user can create multiple projects
- **User → Attendance**: A user can have multiple attendance records
- **Project → Task**: A project can have multiple tasks
- **Project → ProjectStatus**: A project can have multiple statuses
- **Project → TeamMember**: A project can have multiple team members
- **Task → Task (SubTasks)**: A task can have multiple subtasks

### Many-to-Many Relationships

- **User ↔ Task**: Users can be assigned to multiple tasks, and tasks can have multiple assignees (via TaskAssignee)
- **User ↔ Project**: Users can be members of multiple projects, and projects can have multiple team members (via TeamMember)
- **Role ↔ Permission**: Roles can have multiple permissions, and permissions can be assigned to multiple roles (via RolePermission)

### One-to-One Relationships

- **User → AttendanceSettings**: A user has one attendance settings record

## Database Migrations

Prisma handles database migrations automatically. When you change the schema, you need to create and apply a migration.

### Creating a Migration

```bash
npx prisma migrate dev --name <migration-name>
```

This command:
1. Generates a new migration based on changes to the schema
2. Applies the migration to the database
3. Regenerates the Prisma client

### Applying Migrations

In development:

```bash
npx prisma migrate dev
```

In production:

```bash
npx prisma migrate deploy
```

### Resetting the Database

To reset the database (delete all data and apply migrations):

```bash
npx prisma migrate reset
```

Or use the npm script:

```bash
npm run db-reset
```

## Seeding

The application includes seed scripts to populate the database with test data.

### Running Seeds

```bash
node scripts/seed.js
```

Or use the npm script:

```bash
npm run seed
```

## Prisma Studio

You can use Prisma Studio to view and edit your database:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555.

## Best Practices

1. **Use Transactions**: When performing multiple related operations, use transactions to ensure data consistency
2. **Validate Input**: Always validate input data before saving to the database
3. **Use Relations**: Leverage Prisma's relation queries to efficiently fetch related data
4. **Pagination**: Use pagination for large result sets
5. **Indexes**: Add indexes for frequently queried fields
6. **Soft Deletes**: Consider implementing soft deletes for important data
