const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create database connection
        const connection = await mysql.createConnection(dbConfig);

        // Check if username already exists
        const [existingUsers] = await connection.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Insert new user
        const [result] = await connection.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );

        await connection.end();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create database connection
        const connection = await mysql.createConnection(dbConfig);

        // Get user
        const [users] = await connection.query(
            'SELECT * FROM users WHERE username = ? AND role = ?',
            [username, role]
        );

        await connection.end();

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 