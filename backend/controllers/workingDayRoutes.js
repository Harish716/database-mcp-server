const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/start', async (req, res) => {
    try {

        const today = new Date()
            .toISOString()
            .split('T')[0];

        await db.query(
            'INSERT IGNORE INTO working_days (working_date) VALUES (?)',
            [today]
        );

        res.json({
            success: true,
            message: 'Attendance Day Started'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Server Error'
        });

    }
});

router.get('/count', async (req, res) => {
    try {

        const [result] = await db.query(
            'SELECT COUNT(*) AS total FROM working_days'
        );

        res.json({
            totalWorkingDays: result[0].total
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Server Error'
        });

    }
});

module.exports = router;