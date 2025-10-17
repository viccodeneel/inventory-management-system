import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test OK' });
});

// Get all approved users (no authentication required)
// Route: /api/admin/approved
router.get('/approved', async (req: Request, res: Response) => {
  try {
    console.log('Fetching approved users...');
    
    const result = await pool.query(
      `SELECT id, name, generated_email AS email, phone, department, requested_role, 
              equipment, approved_at, status
       FROM approved_users
       ORDER BY name ASC`
    );

    console.log(`Found ${result.rows.length} users`);

    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || 'user',
      status: row.status || 'inactive',
      equipment: row.equipment || [],
      approved_at: row.approved_at
    }));

    res.setHeader('Content-Type', 'application/json');
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching approved users:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to fetch approved users' });
  }
});

// Update user status (no authentication required)
// Route: /api/admin/:userId/status
router.patch('/:userId/status', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const targetUserId = req.params.userId;
    const { status } = req.body;

    console.log(`Updating user ${targetUserId} status to ${status}`);

    // Validate status
    if (!['using', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE approved_users 
       SET status = $1 
       WHERE id = $2
       RETURNING id, name, generated_email AS email, phone, department, requested_role, equipment, approved_at, status`,
      [status, targetUserId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.setHeader('Content-Type', 'application/json');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to update user status' });
  } finally {
    client.release();
  }
});

// Edit user information (authentication still required for editing)
// Route: /api/admin/:userId/edit
router.put('/:userId/edit', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user.id;
    const targetUserId = req.params.userId;
    const { name, email, phone, department, requested_role } = req.body;

    // Verify user is admin
    const adminCheck = await client.query(
      'SELECT requested_role FROM approved_users WHERE id = $1',
      [userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].requested_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Validate required fields
    if (!name || !email || !department) {
      return res.status(400).json({ error: 'Name, email, and department are required' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE approved_users 
       SET name = $1, 
           generated_email = $2,
           phone = $3,
           department = $4,
           requested_role = $5
       WHERE id = $6
       RETURNING id, name, generated_email AS email, phone, department, requested_role, equipment, approved_at, status`,
      [name, email, phone || null, department, requested_role || 'user', targetUserId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.setHeader('Content-Type', 'application/json');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error editing user:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to edit user' });
  } finally {
    client.release();
  }
});

export default router;