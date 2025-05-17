const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Create new group (teacher only)
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create groups' });
    }

    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Generate unique join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Check if join code already exists
        const [existingCodes] = await global.pool.query(
            'SELECT id FROM grp WHERE join_code = ?',
            [joinCode]
        );

        if (existingCodes.length > 0) {
            return res.status(500).json({ message: 'Failed to generate unique join code. Please try again.' });
        }

        const [result] = await global.pool.query(
            'INSERT INTO grp (name, join_code, teacher_id) VALUES (?, ?, ?)',
            [name, joinCode, req.user.id]
        );

        res.status(201).json({
            message: 'Group created successfully',
            group: {
                id: result.insertId,
                name,
                join_code: joinCode
            }
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get teacher's groups
router.get('/teacher', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const [groups] = await global.pool.query(`
            SELECT g.*, COUNT(gm.id) as member_count
            FROM grp g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            WHERE g.teacher_id = ?
            GROUP BY g.id
        `, [req.user.id]);

        res.json(groups);
    } catch (error) {
        console.error('Get teacher groups error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get student's groups
router.get('/student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const [groups] = await global.pool.query(`
            SELECT g.*, u.username as teacher_name
            FROM grp g
            JOIN users u ON g.teacher_id = u.id
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.student_id = ?
        `, [req.user.id]);

        res.json(groups);
    } catch (error) {
        console.error('Get student groups error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Join group (student only)
router.post('/join', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can join groups' });
    }

    try {
        const { join_code } = req.body;
        if (!join_code) {
            return res.status(400).json({ message: 'Join code is required' });
        }

        // Get group by join code
        const [groups] = await global.pool.query(
            'SELECT id FROM grp WHERE join_code = ?',
            [join_code]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Invalid join code' });
        }

        const groupId = groups[0].id;

        // Check if student is already a member
        const [existingMembers] = await global.pool.query(
            'SELECT id FROM group_members WHERE group_id = ? AND student_id = ?',
            [groupId, req.user.id]
        );

        if (existingMembers.length > 0) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }

        // Add student to group
        await global.pool.query(
            'INSERT INTO group_members (group_id, student_id) VALUES (?, ?)',
            [groupId, req.user.id]
        );

        res.json({ message: 'Successfully joined the group' });
    } catch (error) {
        console.error('Join group error:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                message: 'Invalid group or student ID',
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get group details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            // Get group details for teacher
            const [groups] = await global.pool.query(`
                SELECT g.*, u.username as teacher_name,
                COUNT(gm.id) as member_count
                FROM grp g
                JOIN users u ON g.teacher_id = u.id
                LEFT JOIN group_members gm ON g.id = gm.group_id
                WHERE g.id = ? AND g.teacher_id = ?
                GROUP BY g.id
            `, [req.params.id, req.user.id]);

            if (groups.length === 0) {
                return res.status(404).json({ message: 'Group not found' });
            }

            // Get group members
            const [members] = await global.pool.query(`
                SELECT u.id, u.username
                FROM group_members gm
                JOIN users u ON gm.student_id = u.id
                WHERE gm.group_id = ?
            `, [req.params.id]);

            res.json({
                ...groups[0],
                members
            });
        } else {
            // Get group details for student
            const [groups] = await global.pool.query(`
                SELECT g.*, u.username as teacher_name
                FROM grp g
                JOIN users u ON g.teacher_id = u.id
                JOIN group_members gm ON g.id = gm.group_id
                WHERE g.id = ? AND gm.student_id = ?
            `, [req.params.id, req.user.id]);

            if (groups.length === 0) {
                return res.status(404).json({ message: 'Group not found' });
            }

            res.json(groups[0]);
        }
    } catch (error) {
        console.error('Get group details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 