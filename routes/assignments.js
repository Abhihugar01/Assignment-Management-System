const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Create new assignment (teacher only)
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    try {
        const { title, group_id, description, deadline } = req.body;

        // Validate required fields
        if (!title || !group_id || !deadline) {
            return res.status(400).json({ 
                message: 'Title, group_id, and deadline are required' 
            });
        }

        // Verify that the teacher owns the group
        const [groups] = await global.pool.query(
            'SELECT id FROM grp WHERE id = ? AND teacher_id = ?',
            [group_id, req.user.id]
        );

        if (groups.length === 0) {
            return res.status(403).json({ 
                message: 'You do not have permission to create assignments for this group' 
            });
        }

        // Create the assignment
        const [result] = await global.pool.query(
            'INSERT INTO assignments (group_id, title, description, deadline) VALUES (?, ?, ?, ?)',
            [group_id, title, description || '', deadline]
        );

        res.status(201).json({
            message: 'Assignment created successfully',
            assignment: {
                id: result.insertId,
                title,
                group_id,
                description,
                deadline
            }
        });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get teacher's assignments
router.get('/teacher', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const [assignments] = await global.pool.query(`
            SELECT a.*, g.name as group_name,
            (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
            FROM assignments a
            JOIN grp g ON a.group_id = g.id
            WHERE g.teacher_id = ?
            ORDER BY a.deadline DESC
        `, [req.user.id]);

        res.json(assignments);
    } catch (error) {
        console.error('Get teacher assignments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get student's assignments
router.get('/student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const [assignments] = await global.pool.query(`
            SELECT a.*, g.name as group_name,
            (SELECT COUNT(*) FROM submissions s 
             WHERE s.assignment_id = a.id AND s.student_id = ?) as has_submitted
            FROM assignments a
            JOIN grp g ON a.group_id = g.id
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.student_id = ?
            ORDER BY a.deadline DESC
        `, [req.user.id, req.user.id]);

        res.json(assignments);
    } catch (error) {
        console.error('Get student assignments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get assignment details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            const [assignments] = await global.pool.query(`
                SELECT a.*, g.name as group_name
                FROM assignments a
                JOIN grp g ON a.group_id = g.id
                WHERE a.id = ? AND g.teacher_id = ?
            `, [req.params.id, req.user.id]);

            if (assignments.length === 0) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            // Get submissions for this assignment
            const [submissions] = await global.pool.query(`
                SELECT s.*, u.username
                FROM submissions s
                JOIN users u ON s.student_id = u.id
                WHERE s.assignment_id = ?
            `, [req.params.id]);

            res.json({
                ...assignments[0],
                submissions
            });
        } else {
            const [assignments] = await global.pool.query(`
                SELECT a.*, g.name as group_name
                FROM assignments a
                JOIN grp g ON a.group_id = g.id
                JOIN group_members gm ON g.id = gm.group_id
                WHERE a.id = ? AND gm.student_id = ?
            `, [req.params.id, req.user.id]);

            if (assignments.length === 0) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            // Get student's submission for this assignment
            const [submissions] = await global.pool.query(`
                SELECT * FROM submissions
                WHERE assignment_id = ? AND student_id = ?
            `, [req.params.id, req.user.id]);

            res.json({
                ...assignments[0],
                submission: submissions[0] || null
            });
        }
    } catch (error) {
        console.error('Get assignment details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 