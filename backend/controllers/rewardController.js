const db = require('../config/db');

exports.redeem = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { reward_name, cost } = req.body;

        const [students] = await db.query('SELECT reward_points FROM students WHERE id = ?', [studentId]);
        if(students.length === 0) return res.status(404).json({error: 'Student not found'});
        
        let currentPoints = students[0].reward_points;

        if (currentPoints < cost) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Deduct points
        await db.query('UPDATE students SET reward_points = reward_points - ? WHERE id = ?', [cost, studentId]);
        
        // Log redemption
        await db.query('INSERT INTO redemptions (student_id, reward_name, points_used) VALUES (?, ?, ?)', [studentId, reward_name, cost]);

        res.json({ success: true, message: `Successfully redeemed ${reward_name}`, remainingPoints: currentPoints - cost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMarketplace = async (req, res) => {
    // Static marketplace items for demo
    const items = [
        { id: 1, name: 'Canteen Coffee', cost: 15, category: 'Canteen', icon: '☕' },
        { id: 2, name: 'Free Lunch Meal', cost: 50, category: 'Canteen', icon: '🍔' },
        { id: 3, name: 'Snack Vending Machine', cost: 10, category: 'Vending', icon: '🍫' },
        { id: 4, name: 'Extra Library Book', cost: 20, category: 'Library', icon: '📚' },
        { id: 5, name: 'Late Submission Pass', cost: 100, category: 'Academic', icon: '🎫' }
    ];
    res.json(items);
}
