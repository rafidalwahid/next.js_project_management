-- CreateIndex
CREATE INDEX `team_member_role_idx` ON `team_member`(`role`);

-- CreateIndex
CREATE INDEX `team_member_projectId_role_idx` ON `team_member`(`projectId`, `role`);

-- CreateIndex
CREATE INDEX `team_member_userId_role_idx` ON `team_member`(`userId`, `role`);
