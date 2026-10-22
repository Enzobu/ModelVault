CREATE TABLE `DriveSyncState` (
  `id` INTEGER NOT NULL,
  `requested` BOOLEAN NOT NULL DEFAULT false,
  `running` BOOLEAN NOT NULL DEFAULT false,
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `lastResult` TEXT NULL,
  `lastError` TEXT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
