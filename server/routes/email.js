const express = require('express');
const db = require('../config/database');
const router = express.Router();

// POST /api/email/group - Add a new group to users.email_groups
router.post('/group', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Group name required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO users.email_groups (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id, name, created_at, updated_at`,
      [name.trim()]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error adding group:', err);
    res.status(500).json({ success: false, error: 'Failed to add group', message: err.message });
  }
});

module.exports = router;
