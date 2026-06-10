const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.teacherLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM teachers WHERE email = ?', [email]);
        
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const teacher = rows[0];
        const validPassword = (password === teacher.password);
        
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: teacher.id, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ token, user: { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher' } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM students WHERE email = ?', [email]);
        
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const student = rows[0];
        const validPassword = (password === student.password);
        
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: student.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ token, user: { id: student.id, name: student.name, email: student.email, register_no: student.register_no, role: 'student' } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
