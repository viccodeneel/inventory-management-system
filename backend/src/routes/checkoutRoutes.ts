import { Router, Request, Response } from "express";
import pool from "../db.js";

const router = Router();

// ✅ CHECK OUT equipment
router.post("/checkout", async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { equipment_id, user_id } = req.body;

    // Validate required fields
    if (!equipment_id || !user_id) {
      return res.status(400).json({ 
        error: "Missing required fields: equipment_id, user_id" 
      });
    }

    await client.query('BEGIN');

    // Check if equipment exists and is available
    const equipmentCheck = await client.query(
      `SELECT id, name, serial_number, status FROM equipment WHERE id = $1`,
      [equipment_id]
    );

    if (equipmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    const equipment = equipmentCheck.rows[0];

    if (equipment.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Equipment is currently ${equipment.status}, not available for checkout` 
      });
    }

    // Check if user exists in approved_users
    const userCheck = await client.query(
      `SELECT id, name, department FROM approved_users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "User not found in approved users" });
    }

    const user = userCheck.rows[0];

    // Update equipment status and assign to user
    const updateResult = await client.query(
      `UPDATE equipment 
       SET status = 'in_use', 
           assigned_to = $1, 
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [user.name, equipment_id]
    );

    // Log the checkout in activity/history table
    await client.query(
      `INSERT INTO checkout_history 
        (equipment_id, equipment_name, equipment_serial, action, user_name, department, timestamp)
       VALUES ($1, $2, $3, 'check_out', $4, $5, NOW())`,
      [equipment_id, equipment.name, equipment.serial_number, user.name, user.department]
    );

    await client.query('COMMIT');

    console.log(`✅ Equipment checked out: ${equipment.name} to ${user.name}`);
    
    res.status(200).json({
      message: "Equipment checked out successfully",
      equipment: updateResult.rows[0],
      checkout_info: {
        user_name: user.name,
        department: user.department,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error checking out equipment:", err);
    res.status(500).json({ error: "Failed to check out equipment" });
  } finally {
    client.release();
  }
});

// ✅ CHECK IN equipment
router.post("/checkin", async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { equipment_id, condition } = req.body;

    // Validate required fields
    if (!equipment_id || !condition) {
      return res.status(400).json({ 
        error: "Missing required fields: equipment_id, condition" 
      });
    }

    // Validate condition value
    const validConditions = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ 
        error: "Invalid condition value. Must be one of: excellent, good, fair, poor, needs_repair" 
      });
    }

    await client.query('BEGIN');

    // Check if equipment exists and is checked out
    const equipmentCheck = await client.query(
      `SELECT id, name, serial_number, status, assigned_to FROM equipment WHERE id = $1`,
      [equipment_id]
    );

    if (equipmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    const equipment = equipmentCheck.rows[0];

    if (equipment.status !== 'in_use') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Equipment is not checked out (current status: ${equipment.status})` 
      });
    }

    const previousUser = equipment.assigned_to;

    // Update equipment status, condition, and clear assignment
    const updateResult = await client.query(
      `UPDATE equipment 
       SET status = 'available', 
           condition = $1,
           assigned_to = NULL, 
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [condition, equipment_id]
    );

    // Log the check-in in activity/history table
    await client.query(
      `INSERT INTO checkout_history 
        (equipment_id, equipment_name, equipment_serial, action, user_name, condition_on_return, timestamp)
       VALUES ($1, $2, $3, 'check_in', $4, $5, NOW())`,
      [equipment_id, equipment.name, equipment.serial_number, previousUser, condition]
    );

    await client.query('COMMIT');

    console.log(`✅ Equipment checked in: ${equipment.name} (condition: ${condition})`);
    
    res.status(200).json({
      message: "Equipment checked in successfully",
      equipment: updateResult.rows[0],
      checkin_info: {
        returned_by: previousUser,
        condition,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error checking in equipment:", err);
    res.status(500).json({ error: "Failed to check in equipment" });
  } finally {
    client.release();
  }
});

// ✅ GET checkout history/activity log
router.get("/history", async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT 
        id,
        equipment_id,
        equipment_name,
        equipment_serial,
        action,
        user_name,
        department,
        condition_on_return,
        timestamp
       FROM checkout_history
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching checkout history:", err);
    res.status(500).json({ error: "Failed to fetch checkout history" });
  }
});

// ✅ GET checkout history for specific equipment
router.get("/history/equipment/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id,
        equipment_id,
        equipment_name,
        equipment_serial,
        action,
        user_name,
        department,
        condition_on_return,
        timestamp
       FROM checkout_history
       WHERE equipment_id = $1
       ORDER BY timestamp DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching equipment checkout history:", err);
    res.status(500).json({ error: "Failed to fetch equipment checkout history" });
  }
});

// ✅ GET current checkouts (equipment currently in use)
router.get("/current", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id,
        e.serial_number,
        e.name,
        e.model,
        e.brand,
        e.status,
        e.condition,
        e.assigned_to,
        e.updated_at,
        ec.name AS category,
        l.name AS location
       FROM equipment e
       LEFT JOIN equipment_categories ec ON e.category_id = ec.id
       LEFT JOIN locations l ON e.location_id = l.id
       WHERE e.status = 'in_use'
       ORDER BY e.updated_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching current checkouts:", err);
    res.status(500).json({ error: "Failed to fetch current checkouts" });
  }
});

// ✅ GET approved users
router.get("/approved", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, department FROM approved_users ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching approved users:", err);
    res.status(500).json({ error: "Failed to fetch approved users" });
  }
});

export default router;