CREATE TABLE `bom_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bomId` int NOT NULL,
	`departmentId` int NOT NULL,
	`materialId` int NOT NULL,
	`reserved` varchar(50) NOT NULL DEFAULT '0',
	`issued` varchar(50) NOT NULL DEFAULT '0',
	`returned` varchar(50) NOT NULL DEFAULT '0',
	`adjusted` varchar(50) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bom_reservations_id` PRIMARY KEY(`id`)
);
