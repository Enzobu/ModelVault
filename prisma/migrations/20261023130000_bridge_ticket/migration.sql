CREATE TABLE `BridgeTicket` (
  `tokenHash` VARCHAR(64) NOT NULL,
  `modelId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  PRIMARY KEY (`tokenHash`),
  INDEX `BridgeTicket_expiresAt_idx`(`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
