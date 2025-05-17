const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Submit assignment (student only)
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    try {
        const { assignment_id, submission_type, content } = req.body;

        // Validate required fields
        if (!assignment_id || !submission_type || !content) {
            return res.status(400).json({ 
                message: 'Assignment ID, submission type, and content are required' 
            });
        }

        // Verify student has access to the assignment
        const [assignments] = await global.pool.query(`
            SELECT a.id
            FROM assignments a
            JOIN grp g ON a.group_id = g.id
            JOIN group_members gm ON g.id = gm.group_id
            WHERE a.id = ? AND gm.student_id = ?
        `, [assignment_id, req.user.id]);

        if (assignments.length === 0) {
            return res.status(403).json({ 
                message: 'You do not have access to this assignment' 
            });
        }

        let filePath = content;
        if (submission_type === 'file' && content.startsWith('data:')) {
            // Handle base64 file upload
            const matches = content.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return res.status(400).json({ message: 'Invalid file format' });
            }

            const fileType = matches[1].split('/')[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // Generate unique filename
            const filename = `${Date.now()}-${req.user.id}-${assignment_id}.${fileType}`;
            filePath = path.join('uploads', filename);
            const fullPath = path.join(__dirname, '..', 'public', filePath);

            // Save file
            fs.writeFileSync(fullPath, buffer);
        }

        // Check if submission already exists
        const [existingSubmissions] = await global.pool.query(
            'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
            [assignment_id, req.user.id]
        );

        if (existingSubmissions.length > 0) {
            // Delete old file if it exists
            const [oldSubmission] = await global.pool.query(
                'SELECT content FROM submissions WHERE assignment_id = ? AND student_id = ?',
                [assignment_id, req.user.id]
            );
            if (oldSubmission[0]?.content?.startsWith('uploads/')) {
                const oldPath = path.join(__dirname, '..', 'public', oldSubmission[0].content);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Update existing submission
            await global.pool.query(
                'UPDATE submissions SET submission_type = ?, content = ?, submitted_at = CURRENT_TIMESTAMP WHERE assignment_id = ? AND student_id = ?',
                [submission_type, filePath, assignment_id, req.user.id]
            );
        } else {
            // Create new submission
            await global.pool.query(
                'INSERT INTO submissions (assignment_id, student_id, submission_type, content) VALUES (?, ?, ?, ?)',
                [assignment_id, req.user.id, submission_type, filePath]
            );
        }

        res.json({ message: 'Assignment submitted successfully' });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get submission details
router.get('/:assignmentId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            // Get all submissions for the assignment
            const [submissions] = await global.pool.query(`
                SELECT s.*, u.username
                FROM submissions s
                JOIN users u ON s.student_id = u.id
                JOIN assignments a ON s.assignment_id = a.id
                JOIN grp g ON a.group_id = g.id
                WHERE s.assignment_id = ? AND g.teacher_id = ?
            `, [req.params.assignmentId, req.user.id]);

            res.json(submissions);
        } else {
            // Get student's own submission
            const [submissions] = await global.pool.query(`
                SELECT s.*
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                JOIN grp g ON a.group_id = g.id
                JOIN group_members gm ON g.id = gm.group_id
                WHERE s.assignment_id = ? AND s.student_id = ? AND gm.student_id = ?
            `, [req.params.assignmentId, req.user.id, req.user.id]);

            res.json(submissions[0] || null);
        }
    } catch (error) {
        console.error('Get submission details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 