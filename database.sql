CREATE DATABASE IF NOT EXISTS aethon_db;
USE aethon_db;

CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    register_no VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rfid_uid VARCHAR(100) UNIQUE NOT NULL,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    status ENUM('Present', 'Absent') DEFAULT 'Present',
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_daily_attendance (student_id, attendance_date)
);

CREATE TABLE rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    reward_name VARCHAR(255) NOT NULL,
    points_used INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Insert dummy teacher
INSERT INTO teachers (name, email, password) VALUES 
('Admin Teacher', 'teacher@aethon.com', '$2b$10$A5v1H5bLwY.F200N.Y.ZJu1fH7T.r0Y2G9X.o8o.5r1K7gZ9A.qWe'); -- password: password123

-- Insert dummy students
INSERT INTO students (name, register_no, department, email, password, rfid_uid) VALUES 
('John Doe', 'REG001', 'Computer Science', 'john@aethon.com', '$2b$10$A5v1H5bLwY.F200N.Y.ZJu1fH7T.r0Y2G9X.o8o.5r1K7gZ9A.qWe', 'A1B2C3D4'),
('Jane Smith', 'REG002', 'Electrical', 'jane@aethon.com', '$2b$10$A5v1H5bLwY.F200N.Y.ZJu1fH7T.r0Y2G9X.o8o.5r1K7gZ9A.qWe', 'E5F6G7H8');
