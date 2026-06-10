const db = require('../config/db');

exports.getTeacherDashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Total students
        const [studentCountResult] = await db.query('SELECT COUNT(*) as total FROM students');
        const totalStudents = studentCountResult[0].total;

        // Present today
        const [presentCountResult] = await db.query('SELECT COUNT(*) as present FROM attendance WHERE attendance_date = ? AND status = "Present"', [today]);
        const presentToday = presentCountResult[0].present;

        // Eligible students (demo logic: >= 90%)
        const [eligibleCountResult] = await db.query('SELECT COUNT(*) as eligible FROM students WHERE attendance_percentage >= 90');
        const rewardEligible = eligibleCountResult[0].eligible;

        // Student list
        const [students] = await db.query('SELECT id, name, register_no, department, attendance_percentage, reward_points FROM students ORDER BY name ASC');

        // Recent Scans
        const [recentScans] = await db.query(`
            SELECT a.attendance_time, s.name, s.register_no 
            FROM attendance a 
            JOIN students s ON a.student_id = s.id 
            WHERE a.attendance_date = ? 
            ORDER BY a.attendance_time DESC LIMIT 10
        `, [today]);

        res.json({
            stats: {
                totalStudents,
                presentToday,
                absentToday: totalStudents - presentToday,
                rewardEligible
            },
            students,
            recentScans
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        const [students] = await db.query('SELECT name, register_no, department, attendance_percentage, reward_points FROM students WHERE id = ?', [studentId]);
        if(students.length === 0) return res.status(404).json({error: 'Student not found'});
        
        const student = students[0];

        // Determine eligibility
        const isEligible = student.attendance_percentage >= 90;

        res.json({
            profile: student,
            isEligible,
            streak: Math.floor(student.attendance_percentage / 10) // mock streak
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
