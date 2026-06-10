const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db/sqlite-service');

const JWT_SECRET = process.env.JWT_SECRET || 'aethon-super-secret-key-change-in-prod';

async function login(email, password) {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) throw new Error('Invalid credentials');
    
    const user = rows[0];
    if (user.status !== 'ACTIVE') throw new Error('Account disabled');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
        { user_id: user.user_id, role: user.role, employee_id: user.employee_id, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, user: { user_id: user.user_id, role: user.role, full_name: user.full_name } };
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token expired or invalid' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ error: 'Admin access required' });
    }
}

module.exports = {
    login,
    authMiddleware,
    requireAdmin
};
