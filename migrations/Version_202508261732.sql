CREATE TABLE imported_timesheet_entries (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    `Date` DATE NOT NULL,
    `Employee` VARCHAR(50) NOT NULL,
    `Customer` VARCHAR(50) NOT NULL,
    `Case_Task_Event` VARCHAR(100) NOT NULL,
    `Item` VARCHAR(50),
    `Note` VARCHAR(500),
    `Approval_Status` VARCHAR(100) DEFAULT NULL,
    `Duration` DECIMAL(5,2),

    `line_of_business_id` INT(10) UNSIGNED NOT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint on first 4 columns
    UNIQUE KEY unique_entry (`Date`, `Employee`, `Customer`, `Case_Task_Event`, `Note`),

    -- Foreign key constraint
    CONSTRAINT fk_line_of_business
        FOREIGN KEY (`line_of_business_id`)
        REFERENCES line_of_business(`line_of_business_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);