const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'aethon.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Database connected.');
    }
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(async () => {
    // 1. Apply Schema
    db.exec(schema, async (err) => {
        if (err) {
            console.error('Error applying schema', err);
            return;
        }
        console.log('Schema applied successfully.');

        // 2. Clear existing data
        const tables = ['users', 'employees', 'departments', 'attendance', 'rewards', 'announcements', 'audit_logs', 'ai_activity'];
        for (const table of tables) {
            db.run(`DELETE FROM ${table}`);
            db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
        }

        // 3. Seed Departments
        const departments = [
            'Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance'
        ];
        
        const stmtDept = db.prepare('INSERT INTO departments (department_name, description) VALUES (?, ?)');
        for (const dept of departments) {
            stmtDept.run(dept, `${dept} Department`);
        }
        stmtDept.finalize();

        // 4. Seed Employees
        const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Jessica', 'Daniel', 'Ashley', 'James', 'Amanda', 'Robert', 'Melissa', 'William'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
        const designations = ['Software Engineer', 'Senior Engineer', 'Manager', 'Analyst', 'Specialist', 'Director', 'Coordinator'];
        
        const stmtEmp = db.prepare(`
            INSERT INTO employees (employee_code, full_name, email, phone, department_id, designation, joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (let i = 1; i <= 50; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@aethon.local`;
            const phone = `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`;
            const deptId = Math.floor(Math.random() * 5) + 1;
            const desig = designations[Math.floor(Math.random() * designations.length)];
            
            // Random date in the past 5 years
            const date = new Date();
            date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 5));
            date.setMonth(Math.floor(Math.random() * 12));
            date.setDate(Math.floor(Math.random() * 28));
            
            stmtEmp.run(`EMP-${String(i).padStart(3, '0')}`, fullName, email, phone, deptId, desig, date.toISOString().split('T')[0]);
        }
        stmtEmp.finalize();

        // 5. Seed Users (Admin + Employees)
        const passwordHash = await bcrypt.hash('password123', 10);
        const stmtUser = db.prepare(`
            INSERT INTO users (employee_id, full_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `);

        // Create one master admin
        stmtUser.run(null, 'mohammed shameem', 'admin@aethon.local', passwordHash, 'ADMIN');
        stmtUser.finalize();

        // Create user accounts for some employees
        db.run(`
            INSERT INTO users (employee_id, full_name, email, password_hash, role)
            SELECT employee_id, full_name, email, ?, 'EMPLOYEE' 
            FROM employees LIMIT 20
        `, [passwordHash]);
        
        // Wait a bit for async queries to finish then close
        setTimeout(() => {
            
            // Seed Attendance (Last 7 days for employee 1 to 10)
            const stmtAtt = db.prepare(`
                INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, working_hours)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            for(let empId = 1; empId <= 10; empId++) {
                for(let day = 0; day < 7; day++) {
                    const date = new Date();
                    date.setDate(date.getDate() - day);
                    const status = Math.random() > 0.1 ? 'PRESENT' : 'ABSENT';
                    const checkIn = new Date(date);
                    checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
                    const checkOut = new Date(date);
                    checkOut.setHours(17, Math.floor(Math.random() * 30), 0);
                    
                    if (status === 'PRESENT') {
                        stmtAtt.run(empId, date.toISOString().split('T')[0], checkIn.toISOString(), checkOut.toISOString(), status, 8);
                    } else {
                        stmtAtt.run(empId, date.toISOString().split('T')[0], null, null, status, 0);
                    }
                }
            }
            stmtAtt.finalize();

            console.log('Seeding completed. Default passwords are "password123". Admin is admin@aethon.local');
            db.close();
        }, 1000);
    });
});
