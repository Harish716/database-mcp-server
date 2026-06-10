const express = require('express');
const router = express.Router();
const auth = require('./auth');
const aiService = require('./ai-service');
const db = require('./db/sqlite-service');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await auth.login(email, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// Dashboard metrics
router.get('/dashboard', auth.authMiddleware, async (req, res) => {
    try {
        const { role, user_id, employee_id } = req.user;
        
        if (role === 'ADMIN') {
            const employeesCount = (await db.query('SELECT COUNT(*) as c FROM employees'))[0].c;
            const today = new Date().toISOString().split('T')[0];
            const presentCount = (await db.query("SELECT COUNT(*) as c FROM attendance WHERE attendance_date = ? AND status='PRESENT'", [today]))[0].c;
            const absentCount = (await db.query("SELECT COUNT(*) as c FROM attendance WHERE attendance_date = ? AND status='ABSENT'", [today]))[0].c;
            const totalRewards = (await db.query('SELECT SUM(reward_points) as sum FROM rewards'))[0].sum || 0;
            
            const recentActivity = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5');
            const aiActivity = await db.query('SELECT * FROM ai_activity ORDER BY timestamp DESC LIMIT 5');
            
            res.json({ employeesCount, presentCount, absentCount, totalRewards, recentActivity, aiActivity });
        } else {
            // Employee Dashboard
            const profile = await db.query('SELECT * FROM employees WHERE employee_id = ?', [employee_id]);
            const attendance = await db.query('SELECT * FROM attendance WHERE employee_id = ? ORDER BY attendance_date DESC LIMIT 5', [employee_id]);
            const rewards = await db.query('SELECT * FROM rewards WHERE employee_id = ? ORDER BY issued_date DESC', [employee_id]);
            const systemUpdates = await db.query("SELECT * FROM audit_logs WHERE action_type IN ('INSERT', 'UPDATE', 'DELETE') ORDER BY timestamp DESC LIMIT 5");
            
            res.json({ profile: profile[0], attendance, rewards, systemUpdates });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Command Route
router.post('/ai-command', auth.authMiddleware, async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        const { role, user_id } = req.user;
        
        // Strictly read-only for employees
        const promptUpper = prompt.toUpperCase();
        if (role === 'EMPLOYEE' && (promptUpper.includes('INSERT') || promptUpper.includes('UPDATE') || promptUpper.includes('DELETE'))) {
            return res.status(403).json({ answer: 'Employees have read-only access.', pipeline: [] });
        }
        
        const response = await aiService.processPrompt(user_id, role, prompt, sessionId);
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat History Routes
router.get('/chat/sessions', auth.authMiddleware, async (req, res) => {
    try {
        const { user_id } = req.user;
        const sessions = await db.query('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC', [user_id]);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/chat/sessions/:sessionId', auth.authMiddleware, async (req, res) => {
    try {
        const { user_id } = req.user;
        const { sessionId } = req.params;
        
        // Verify ownership
        const session = await db.query('SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ?', [sessionId, user_id]);
        if (session.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const messages = await db.query('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY message_id ASC', [sessionId]);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/chat/sessions/:sessionId', auth.authMiddleware, async (req, res) => {
    try {
        const { user_id } = req.user;
        const { sessionId } = req.params;
        await db.run('DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?', [sessionId, user_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Database Explorer (Admin Only)
router.get('/db-explorer/tables', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
    try {
        const rows = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const tablesWithCounts = [];
        for (const row of rows) {
            const tableName = row.name;
            const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            tablesWithCounts.push({
                name: tableName,
                rowCount: countResult[0].count
            });
        }
        res.json(tablesWithCounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/db-explorer/data/:table', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
    try {
        const rows = await db.query(`SELECT * FROM ${req.params.table} LIMIT 100`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Audit Logs Endpoint
router.get('/audit-logs', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                al.timestamp, 
                u.email as user, 
                al.action_type as action, 
                al.table_name, 
                al.affected_rows, 
                al.risk_level,
                'Success' as status
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            ORDER BY al.timestamp DESC
            LIMIT 100
        `;
        const logs = await db.query(query);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profile Endpoint
router.get('/profile', auth.authMiddleware, async (req, res) => {
    try {
        const { user_id, role, employee_id } = req.user;
        
        let profileData = {};
        
        // Fetch core user data
        const users = await db.query('SELECT user_id, full_name, email, role, status, created_at FROM users WHERE user_id = ?', [user_id]);
        if (users.length > 0) {
            profileData = { ...users[0] };
        }
        
        // If employee, fetch employee specific data and department
        if (role === 'EMPLOYEE' && employee_id) {
            const employees = await db.query(`
                SELECT e.employee_code, e.phone, e.designation, e.joining_date, e.employment_status, d.department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.department_id
                WHERE e.employee_id = ?
            `, [employee_id]);
            
            if (employees.length > 0) {
                profileData = { ...profileData, ...employees[0] };
            }
        }
        
        res.json(profileData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
