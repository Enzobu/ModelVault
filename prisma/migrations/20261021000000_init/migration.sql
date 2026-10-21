-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `googleSub` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `role` ENUM('PENDING', 'USER', 'EDITOR', 'ADMIN') NOT NULL DEFAULT 'PENDING',
    `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `theme` ENUM('SYSTEM', 'LIGHT', 'DARK') NOT NULL DEFAULT 'SYSTEM',
    `colorPalette` VARCHAR(191) NOT NULL DEFAULT 'cuivre',
    `colorVariant` ENUM('LIGHT', 'STANDARD', 'DARK') NOT NULL DEFAULT 'STANDARD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `User_googleSub_key`(`googleSub`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Model3D` (
    `id` VARCHAR(191) NOT NULL,
    `driveFolderId` VARCHAR(191) NOT NULL,
    `driveName` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `organized` BOOLEAN NOT NULL DEFAULT false,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    UNIQUE INDEX `Model3D_driveFolderId_key`(`driveFolderId`),
    INDEX `Model3D_organized_idx`(`organized`),
    INDEX `Model3D_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelFile` (
    `id` VARCHAR(191) NOT NULL,
    `googleFileId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `sizeBytes` BIGINT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `ModelFile_googleFileId_key`(`googleFileId`),
    INDEX `ModelFile_modelId_idx`(`modelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelTag` (
    `modelId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`modelId`,`tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `userId` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`userId`,`modelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Model3D` ADD CONSTRAINT `Model3D_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelFile` ADD CONSTRAINT `ModelFile_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model3D`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelTag` ADD CONSTRAINT `ModelTag_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model3D`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelTag` ADD CONSTRAINT `ModelTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model3D`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
