CREATE TABLE `DriveConnection` (
  `id` INTEGER NOT NULL,
  `refreshToken` TEXT NOT NULL,
  `connectedById` VARCHAR(191) NOT NULL,
  `rootFolderId` VARCHAR(191) NULL,
  `rootFolderName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
