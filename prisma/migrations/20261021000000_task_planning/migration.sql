ALTER TABLE `tasks`
  ADD COLUMN `resourceUrl` VARCHAR(2048) NULL,
  ADD COLUMN `estimatedMinutes` INTEGER NULL,
  ADD COLUMN `startDate` DATE NULL;
