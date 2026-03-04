CREATE TABLE `approval_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`exemptSelf` int NOT NULL DEFAULT 0,
	`approver1Id` int,
	`approver2Id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docId` int NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`reason` text,
	`level` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_logs_id` PRIMARY KEY(`id`)
);
