const db = require('../config/db');

exports.scanRFID = async (req, res) => {
    try {
        const { uid } = req.body;


        if (!uid) {
            return res.status(400).json({
                error: 'UID is required'
            });
        }

        // Find student by RFID UID
        const [students] = await db.query(
            'SELECT id, attendance_percentage, reward_points FROM students WHERE rfid_uid = ?',
            [uid]
        );

        if (students.length === 0) {
            return res.status(404).json({
                error: 'Student not found for this RFID'
            });
        }

        const student = students[0];

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        // Check if attendance already marked today
        const [attendance] = await db.query(
            'SELECT id FROM attendance WHERE student_id = ? AND attendance_date = ?',
            [student.id, today]
        );

        if (attendance.length > 0) {
            return res.json({
                message: 'Attendance already recorded for today',
                status: 'duplicate'
            });
        }

        // Insert attendance
        await db.query(
            'INSERT INTO attendance (student_id, attendance_date, attendance_time, status) VALUES (?, ?, ?, ?)',
            [student.id, today, currentTime, 'Present']
        );

        // Total Working Days
        const [workingDaysResult] = await db.query(
            'SELECT COUNT(*) AS total FROM working_days'
        );

        const totalWorkingDays = workingDaysResult[0].total;

        // Student Present Days
        const [presentDaysResult] = await db.query(
            'SELECT COUNT(*) AS total FROM attendance WHERE student_id = ? AND status = "Present"',
            [student.id]
        );

        const presentDays = presentDaysResult[0].total;

        // Attendance Percentage
        let newPercentage = 0;

        if (totalWorkingDays > 0) {
            newPercentage = (
                (presentDays / totalWorkingDays) * 100
            ).toFixed(2);
        }

        // Reward Logic
        let newPoints = 0;
        let eligible = false;

        if (
            totalWorkingDays >= 30 &&
            parseFloat(newPercentage) >= 90
        ) {
            eligible = true;
            newPoints = 5;

            await db.query(
                'INSERT INTO rewards (student_id, points, reason) VALUES (?, ?, ?)',
                [
                    student.id,
                    newPoints,
                    'Daily Eligible Attendance'
                ]
            );
        }

        // Update Student Record
        await db.query(
            'UPDATE students SET attendance_percentage = ?, reward_points = reward_points + ? WHERE id = ?',
            [
                newPercentage,
                newPoints,
                student.id
            ]
        );

        res.json({
            message: 'Attendance recorded successfully',
            status: 'success',
            student_id: student.id,
            attendance_percentage: newPercentage,
            present_days: presentDays,
            working_days: totalWorkingDays,
            points_awarded: newPoints,
            eligible_for_rewards: eligible
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Server error during scan'
        });
    }

};

exports.getHistory = async (req, res) => {
    try {

        const studentId = req.user.id;

        const [history] = await db.query(
            'SELECT attendance_date, attendance_time, status FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC LIMIT 30',
            [studentId]
        );

        res.json(history);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Server error'
        });

    }


};
