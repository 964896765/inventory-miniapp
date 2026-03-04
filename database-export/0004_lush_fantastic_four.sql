CREATE TABLE `doc_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docId` int NOT NULL,
	`materialId` int NOT NULL,
	`quantity` varchar(50) NOT NULL,
	`unitPrice` varchar(50),
	`batchNo` varchar(100),
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doc_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docType` enum('stock_in','stock_out','transfer','inventory_check','bom_issue','return','exchange','adjustment') NOT NULL,
	`docNo` varchar(100) NOT NULL,
	`status` enum('draft','submitted','approved','rejected','posted') NOT NULL DEFAULT 'draft',
	`warehouseId` int,
	`toWarehouseId` int,
	`departmentId` int,
	`bomId` int,
	`createdBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`postedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docs_id` PRIMARY KEY(`id`),
	CONSTRAINT `docs_docNo_unique` UNIQUE(`docNo`)
);
--> statement-breakpoint
CREATE TABLE `stock_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docId` int NOT NULL,
	`materialId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`departmentId` int,
	`direction` enum('IN','OUT') NOT NULL,
	`quantity` varchar(50) NOT NULL,
	`balance` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_ledger_id` PRIMARY KEY(`id`)
);
