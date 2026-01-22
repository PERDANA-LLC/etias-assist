CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(100),
	`eventType` varchar(100) NOT NULL,
	`eventData` json,
	`pageUrl` varchar(500),
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('draft','eligibility_checked','form_completed','payment_pending','payment_completed','ready_to_submit','redirected') NOT NULL DEFAULT 'draft',
	`nationality` varchar(100),
	`hasValidPassport` boolean,
	`travelPurpose` varchar(100),
	`destinationCountries` json,
	`plannedArrivalDate` timestamp,
	`plannedDepartureDate` timestamp,
	`isEligible` boolean,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`dateOfBirth` timestamp,
	`placeOfBirth` varchar(200),
	`gender` enum('male','female','other'),
	`passportNumber` varchar(50),
	`passportIssuingCountry` varchar(100),
	`passportIssueDate` timestamp,
	`passportExpiryDate` timestamp,
	`phoneNumber` varchar(30),
	`addressLine1` varchar(200),
	`addressLine2` varchar(200),
	`city` varchar(100),
	`postalCode` varchar(20),
	`country` varchar(100),
	`accommodationAddress` text,
	`emergencyContactName` varchar(200),
	`emergencyContactPhone` varchar(30),
	`hasCriminalRecord` boolean,
	`hasVisaDenied` boolean,
	`hasDeportationHistory` boolean,
	`currentStep` int DEFAULT 1,
	`completedSteps` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	`redirectedAt` timestamp,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eligibility_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(100),
	`nationality` varchar(100) NOT NULL,
	`hasValidPassport` boolean NOT NULL,
	`travelPurpose` varchar(100),
	`isEligible` boolean NOT NULL,
	`eligibilityReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eligibility_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `help_queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(100),
	`question` text NOT NULL,
	`answer` text,
	`context` varchar(100),
	`helpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `help_queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`applicationId` int,
	`type` enum('application_started','eligibility_confirmed','payment_received','application_ready','reminder_incomplete','admin_alert') NOT NULL,
	`channel` enum('email','system') NOT NULL DEFAULT 'email',
	`recipientEmail` varchar(320),
	`subject` varchar(500),
	`content` text,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCustomerId` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('pending','processing','succeeded','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`receiptUrl` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
