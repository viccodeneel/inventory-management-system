import { Router, Request, Response } from "express";
import pool from "../db.js";

const router = Router();

// ✅ CHECK OUT equipment
router.post("/checkout", async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { equipment_id, user_id, quantity: checkOutQuantity } = req.body;

    // Validate required fields
    if (!equipment_id || !user_id || !checkOutQuantity) {
      return res.status(400).json({ 
        error: "Missing required fields: equipment_id, user_id, quantity" 
      });
    }

    if (checkOutQuantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await client.query('BEGIN');

    // Check if equipment exists and has enough available
    const equipmentCheck = await client.query(
      `SELECT id, name, serial_number, status, quantity, available_quantity FROM equipment WHERE id = $1 FOR UPDATE`,
      [equipment_id]
    );

    if (equipmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    const equipment = equipmentCheck.rows[0];

    if (equipment.available_quantity < checkOutQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Not enough available quantity (available: ${equipment.available_quantity})` 
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

    // Insert into active_checkouts
    await client.query(
      `INSERT INTO active_checkouts 
        (equipment_id, user_id, quantity, user_name, department)
       VALUES ($1, $2, $3, $4, $5)`,
      [equipment_id, user_id, checkOutQuantity, user.name, user.department]
    );

    // Update equipment available_quantity
    const newAvailable = equipment.available_quantity - checkOutQuantity;
    await client.query(
      `UPDATE equipment 
       SET available_quantity = $1, updated_at = NOW()
       WHERE id = $2`,
      [newAvailable, equipment_id]
    );

    // Update status and assigned_to
    const activeCountRes = await client.query(
      `SELECT COUNT(*) FROM active_checkouts WHERE equipment_id = $1`,
      [equipment_id]
    );
    const activeCount = parseInt(activeCountRes.rows[0].count);

    let assigned_to = null;
    if (newAvailable < equipment.quantity) {  // Some checked out
      if (activeCount === 1) {
        assigned_to = user.name;
      } else {
        assigned_to = 'Multiple';
      }
    }

    const status = (newAvailable > 0) ? 'available' : 'in_use';

    const updateResult = await client.query(
      `UPDATE equipment 
       SET status = $1, assigned_to = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, assigned_to, equipment_id]
    );

    // Log the checkout in history
    await client.query(
      `INSERT INTO checkout_history 
        (equipment_id, equipment_name, equipment_serial, action, user_name, department, timestamp, quantity)
       VALUES ($1, $2, $3, 'check_out', $4, $5, NOW(), $6)`,
      [equipment_id, equipment.name, equipment.serial_number, user.name, user.department, checkOutQuantity]
    );

    await client.query('COMMIT');

    console.log(`✅ Equipment checked out: ${equipment.name} (${checkOutQuantity}) to ${user.name}`);
    
    res.status(200).json({
      message: "Equipment checked out successfully",
      equipment: updateResult.rows[0],
      checkout_info: {
        user_name: user.name,
        department: user.department,
        quantity: checkOutQuantity,
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
    const { active_checkout_id, condition, quantity: checkInQuantity } = req.body;

    // Validate required fields
    if (!active_checkout_id || !condition || !checkInQuantity) {
      return res.status(400).json({ 
        error: "Missing required fields: active_checkout_id, condition, quantity" 
      });
    }

    if (checkInQuantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Validate condition value
    const validConditions = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ 
        error: "Invalid condition value. Must be one of: excellent, good, fair, poor, needs_repair" 
      });
    }

    await client.query('BEGIN');

    // Get active checkout
    const activeCheck = await client.query(
      `SELECT * FROM active_checkouts WHERE id = $1 FOR UPDATE`,
      [active_checkout_id]
    );

    if (activeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Active checkout not found" });
    }

    const active = activeCheck.rows[0];

    if (checkInQuantity > active.quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Quantity exceeds checked out amount (checked out: ${active.quantity})` 
      });
    }

    // Get equipment
    const equipmentCheck = await client.query(
      `SELECT id, name, serial_number, quantity, available_quantity FROM equipment WHERE id = $1 FOR UPDATE`,
      [active.equipment_id]
    );
    const equipment = equipmentCheck.rows[0];

    // Update equipment available_quantity
    const newAvailable = equipment.available_quantity + checkInQuantity;
    await client.query(
      `UPDATE equipment 
       SET available_quantity = $1, updated_at = NOW()
       WHERE id = $2`,
      [newAvailable, active.equipment_id]
    );

    // Update or delete active checkout
    if (checkInQuantity === active.quantity) {
      await client.query(
        `DELETE FROM active_checkouts WHERE id = $1`,
        [active_checkout_id]
      );
    } else {
      await client.query(
        `UPDATE active_checkouts 
         SET quantity = quantity - $1
         WHERE id = $2`,
        [checkInQuantity, active_checkout_id]
      );
    }

    // Update status and assigned_to
    const activeCountRes = await client.query(
      `SELECT COUNT(*) FROM active_checkouts WHERE equipment_id = $1`,
      [active.equipment_id]
    );
    const activeCount = parseInt(activeCountRes.rows[0].count);

    let assigned_to = null;
    if (newAvailable < equipment.quantity) {  // Some still checked out
      if (activeCount === 1) {
        const remainingUserRes = await client.query(
          `SELECT user_name FROM active_checkouts WHERE equipment_id = $1 LIMIT 1`,
          [active.equipment_id]
        );
        assigned_to = remainingUserRes.rows[0].user_name;
      } else {
        assigned_to = 'Multiple';
      }
    }

    const status = (newAvailable > 0) ? 'available' : 'in_use';

    const updateResult = await client.query(
      `UPDATE equipment 
       SET status = $1, assigned_to = $2, condition = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, assigned_to, condition, active.equipment_id]
    );

    // Log the check-in in history
    await client.query(
      `INSERT INTO checkout_history 
        (equipment_id, equipment_name, equipment_serial, action, user_name, department, condition_on_return, timestamp, quantity)
       VALUES ($1, $2, $3, 'check_in', $4, $5, $6, NOW(), $7)`,
      [active.equipment_id, equipment.name, equipment.serial_number, active.user_name, active.department, condition, checkInQuantity]
    );

    await client.query('COMMIT');

    console.log(`✅ Equipment checked in: ${equipment.name} (${checkInQuantity}) with condition ${condition}`);
    
    res.status(200).json({
      message: "Equipment checked in successfully",
      equipment: updateResult.rows[0],
      checkin_info: {
        returned_by: active.user_name,
        condition,
        quantity: checkInQuantity,
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
        timestamp,
        quantity
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
        timestamp,
        quantity
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

// ✅ GET current active checkouts (for Checked Out tab)
router.get("/active", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        ac.id,
        ac.equipment_id,
        e.name AS equipment_name,
        e.serial_number,
        ac.user_name,
        ac.department,
        ac.quantity,
        ac.checkout_timestamp
       FROM active_checkouts ac
       JOIN equipment e ON ac.equipment_id = e.id
       ORDER BY ac.checkout_timestamp DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching active checkouts:", err);
    res.status(500).json({ error: "Failed to fetch active checkouts" });
  }
});

// ✅ GET active checkouts for specific equipment
router.get("/active/:equipment_id", async (req: Request, res: Response) => {
  try {
    const { equipment_id } = req.params;

    const result = await pool.query(
      `SELECT 
        ac.id,
        ac.equipment_id,
        e.name AS equipment_name,
        e.serial_number,
        ac.user_name,
        ac.department,
        ac.quantity,
        ac.checkout_timestamp
       FROM active_checkouts ac
       JOIN equipment e ON ac.equipment_id = e.id
       WHERE ac.equipment_id = $1
       ORDER BY ac.checkout_timestamp DESC`,
      [equipment_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching active checkouts for equipment:", err);
    res.status(500).json({ error: "Failed to fetch active checkouts for equipment" });
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