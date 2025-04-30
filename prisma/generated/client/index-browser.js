
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  password: 'password',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLogin: 'lastLogin',
  bio: 'bio',
  department: 'department',
  jobTitle: 'jobTitle',
  location: 'location',
  phone: 'phone',
  skills: 'skills'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isSystem: 'isSystem',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  isSystem: 'isSystem',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  roleId: 'roleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permissionId: 'permissionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserPermissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  permissionId: 'permissionId',
  granted: 'granted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  dueDate: 'dueDate',
  estimatedTime: 'estimatedTime',
  totalTimeSpent: 'totalTimeSpent'
};

exports.Prisma.ProjectStatusScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  description: 'description',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  order: 'order',
  projectId: 'projectId'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  priority: 'priority',
  dueDate: 'dueDate',
  projectId: 'projectId',
  parentId: 'parentId',
  order: 'order',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  completed: 'completed',
  endDate: 'endDate',
  estimatedTime: 'estimatedTime',
  startDate: 'startDate',
  statusId: 'statusId',
  timeSpent: 'timeSpent'
};

exports.Prisma.TaskAssigneeScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  date: 'date',
  projectId: 'projectId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  checkInLatitude: 'checkInLatitude',
  checkInLongitude: 'checkInLongitude',
  checkOutLatitude: 'checkOutLatitude',
  checkOutLongitude: 'checkOutLongitude',
  checkInIpAddress: 'checkInIpAddress',
  checkOutIpAddress: 'checkOutIpAddress',
  checkInDeviceInfo: 'checkInDeviceInfo',
  checkOutDeviceInfo: 'checkOutDeviceInfo',
  totalHours: 'totalHours',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  checkInLocationName: 'checkInLocationName',
  checkOutLocationName: 'checkOutLocationName',
  adjustedById: 'adjustedById',
  adjustmentReason: 'adjustmentReason',
  projectId: 'projectId',
  taskId: 'taskId'
};

exports.Prisma.AttendanceSettingsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  workHoursPerDay: 'workHoursPerDay',
  workDays: 'workDays',
  reminderEnabled: 'reminderEnabled',
  reminderTime: 'reminderTime',
  autoCheckoutEnabled: 'autoCheckoutEnabled',
  autoCheckoutTime: 'autoCheckoutTime',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  description: 'description',
  userId: 'userId',
  projectId: 'projectId',
  taskId: 'taskId',
  createdAt: 'createdAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  fileType: 'fileType',
  fileSize: 'fileSize',
  filePath: 'filePath',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  taskId: 'taskId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskAttachmentScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  fileUrl: 'fileUrl',
  fileSize: 'fileSize',
  fileType: 'fileType',
  taskId: 'taskId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.UserOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  image: 'image',
  password: 'password',
  role: 'role',
  bio: 'bio',
  department: 'department',
  jobTitle: 'jobTitle',
  location: 'location',
  phone: 'phone',
  skills: 'skills'
};

exports.Prisma.AccountOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionOrderByRelevanceFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId'
};

exports.Prisma.VerificationTokenOrderByRelevanceFieldEnum = {
  identifier: 'identifier',
  token: 'token'
};

exports.Prisma.RoleOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description'
};

exports.Prisma.PermissionOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category'
};

exports.Prisma.UserRoleOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  roleId: 'roleId'
};

exports.Prisma.RolePermissionOrderByRelevanceFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permissionId: 'permissionId'
};

exports.Prisma.UserPermissionOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  permissionId: 'permissionId'
};

exports.Prisma.ProjectOrderByRelevanceFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  createdById: 'createdById'
};

exports.Prisma.ProjectStatusOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  description: 'description',
  projectId: 'projectId'
};

exports.Prisma.TaskOrderByRelevanceFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  priority: 'priority',
  projectId: 'projectId',
  parentId: 'parentId',
  statusId: 'statusId'
};

exports.Prisma.TaskAssigneeOrderByRelevanceFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  userId: 'userId'
};

exports.Prisma.TeamMemberOrderByRelevanceFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId'
};

exports.Prisma.EventOrderByRelevanceFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  projectId: 'projectId'
};

exports.Prisma.AttendanceOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  checkInIpAddress: 'checkInIpAddress',
  checkOutIpAddress: 'checkOutIpAddress',
  checkInDeviceInfo: 'checkInDeviceInfo',
  checkOutDeviceInfo: 'checkOutDeviceInfo',
  notes: 'notes',
  checkInLocationName: 'checkInLocationName',
  checkOutLocationName: 'checkOutLocationName',
  adjustedById: 'adjustedById',
  adjustmentReason: 'adjustmentReason',
  projectId: 'projectId',
  taskId: 'taskId'
};

exports.Prisma.AttendanceSettingsOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  workDays: 'workDays',
  reminderTime: 'reminderTime',
  autoCheckoutTime: 'autoCheckoutTime'
};

exports.Prisma.ActivityOrderByRelevanceFieldEnum = {
  id: 'id',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  description: 'description',
  userId: 'userId',
  projectId: 'projectId',
  taskId: 'taskId'
};

exports.Prisma.DocumentOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  fileType: 'fileType',
  filePath: 'filePath',
  userId: 'userId'
};

exports.Prisma.CommentOrderByRelevanceFieldEnum = {
  id: 'id',
  content: 'content',
  taskId: 'taskId',
  userId: 'userId'
};

exports.Prisma.TaskAttachmentOrderByRelevanceFieldEnum = {
  id: 'id',
  filename: 'filename',
  fileUrl: 'fileUrl',
  fileType: 'fileType',
  taskId: 'taskId',
  userId: 'userId'
};


exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Role: 'Role',
  Permission: 'Permission',
  UserRole: 'UserRole',
  RolePermission: 'RolePermission',
  UserPermission: 'UserPermission',
  Project: 'Project',
  ProjectStatus: 'ProjectStatus',
  Task: 'Task',
  TaskAssignee: 'TaskAssignee',
  TeamMember: 'TeamMember',
  Event: 'Event',
  Attendance: 'Attendance',
  AttendanceSettings: 'AttendanceSettings',
  Activity: 'Activity',
  Document: 'Document',
  Comment: 'Comment',
  TaskAttachment: 'TaskAttachment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
