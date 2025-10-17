import { Router, Request, Response } from "express";
import pool from "../db.js";

const router = Router();

// ✅ GET equipment stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'available')::int AS available,
        COUNT(*) FILTER (WHERE status = 'in_use')::int AS in_use,
        COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance
      FROM equipment;
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching equipment stats:", err);
    res.status(500).json({ error: "Failed to fetch equipment stats" });
  }
});

// ✅ GET system alerts (placeholder for now)
router.get("/alerts", async (req: Request, res: Response) => {
  res.json([]);
});

// ✅ GET equipment list
router.get("/list", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.serial_number,
        e.name,
        e.model,
        e.brand,
        e.status,
        e.condition,
        e.quantity,
        e.available_quantity,
        ec.name AS category,
        l.name AS location,
        e.assigned_to
      FROM equipment e
      LEFT JOIN equipment_categories ec ON e.category_id = ec.id
      LEFT JOIN locations l ON e.location_id = l.id
      ORDER BY e.id DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching equipment list:", err);
    res.status(500).json({ error: "Failed to fetch equipment list" });
  }
});

// ✅ Add new equipment
router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      name,
      serial_number,
      model,
      brand,
      category_id,
      location_id,
      status,
      condition,
      quantity = 1
    } = req.body;

    if (!name || !category_id || !location_id) {
      return res.status(400).json({ error: "Missing required fields: name, category_id, location_id" });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await client.query('BEGIN');

    // Resolve category_id if string
    let resolvedCategoryId = category_id;
    if (isNaN(Number(category_id))) {
      const categoryResult = await client.query(
        `SELECT id FROM equipment_categories WHERE LOWER(name) = LOWER($1)`,
        [category_id]
      );
      if (categoryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid category name: ${category_id}` });
      }
      resolvedCategoryId = categoryResult.rows[0].id;
    }

    // Resolve location_id if string
    let resolvedLocationId = location_id;
    if (isNaN(Number(location_id))) {
      const locationResult = await client.query(
        `SELECT id FROM locations WHERE LOWER(name) = LOWER($1)`,
        [location_id]
      );
      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid location name: ${location_id}` });
      }
      resolvedLocationId = locationResult.rows[0].id;
    }

    // Insert with available_quantity = quantity
    const result = await client.query(
      `INSERT INTO equipment 
        (name, serial_number, model, brand, category_id, location_id, status, condition, quantity, available_quantity, created_at, updated_at)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NOW(), NOW())
       RETURNING *`,
      [
        name,
        serial_number || null,
        model || null,
        brand || null,
        resolvedCategoryId,
        resolvedLocationId,
        status || "available",
        condition || "good",
        quantity,
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error adding equipment:", err);
    res.status(500).json({ error: "Failed to add equipment" });
  } finally {
    client.release();
  }
});

// ✅ UPDATE equipment (PUT)
router.put("/:id", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      serial_number,
      model,
      brand,
      category_id,
      location_id,
      status,
      condition,
      quantity = 1,
      purchase_date,
      warranty_expiry,
      notes,
      assigned_to
    } = req.body;

    if (!name || !category_id || !location_id) {
      return res.status(400).json({ error: "Missing required fields: name, category_id, location_id" });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await client.query('BEGIN');

    // Resolve category_id if string
    let resolvedCategoryId = category_id;
    if (isNaN(Number(category_id))) {
      const categoryResult = await client.query(
        `SELECT id FROM equipment_categories WHERE LOWER(name) = LOWER($1)`,
        [category_id]
      );
      if (categoryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid category name: ${category_id}` });
      }
      resolvedCategoryId = categoryResult.rows[0].id;
    }

    // Resolve location_id if string
    let resolvedLocationId = location_id;
    if (isNaN(Number(location_id))) {
      const locationResult = await client.query(
        `SELECT id FROM locations WHERE LOWER(name) = LOWER($1)`,
        [location_id]
      );
      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid location name: ${location_id}` });
      }
      resolvedLocationId = locationResult.rows[0].id;
    }

    // Update, but do not change available_quantity here (managed by checkouts)
    const result = await client.query(
      `UPDATE equipment 
       SET name = $1, serial_number = $2, model = $3, brand = $4, 
           category_id = $5, location_id = $6, status = $7, condition = $8,
           purchase_date = $9, warranty_expiry = $10, notes = $11, 
           assigned_to = $12, quantity = $13, updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        name,
        serial_number || null,
        model || null,
        brand || null,
        resolvedCategoryId,
        resolvedLocationId,
        status || "available",
        condition || "good",
        purchase_date || null,
        warranty_expiry || null,
        notes || null,
        assigned_to || null,
        quantity,
        id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    // Optional: Validate available_quantity <= new quantity
    if (result.rows[0].available_quantity > quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "New total quantity cannot be less than current available quantity" });
    }

    await client.query('COMMIT');
    console.log("✅ Updated equipment:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error updating equipment:", err);
    res.status(500).json({ error: "Failed to update equipment" });
  } finally {
    client.release();
  }
});

// ✅ DELETE equipment
router.delete("/:id", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');
    const result = await client.query(
      `DELETE FROM equipment WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    await client.query('COMMIT');
    console.log("✅ Deleted equipment:", result.rows[0]);
    res.json({ message: "Equipment deleted successfully", equipment: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error deleting equipment:", err);
    res.status(500).json({ error: "Failed to delete equipment" });
  } finally {
    client.release();
  }
});

// ✅ UPDATE equipment status only (PATCH)
router.patch("/:id/status", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, category_id, location_id, assigned_to , quantity = 1 } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status value
    const validStatuses = ['available', 'in_use', 'maintenance', 'out_of_service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    await client.query('BEGIN');

    // Resolve category_id if provided and string
    let resolvedCategoryId = category_id;
    if (category_id && isNaN(Number(category_id))) {
      const categoryResult = await client.query(
        `SELECT id FROM equipment_categories WHERE LOWER(name) = LOWER($1)`,
        [category_id]
      );
      if (categoryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid category name: ${category_id}` });
      }
      resolvedCategoryId = categoryResult.rows[0].id;
    }

    // Resolve location_id if provided and string
    let resolvedLocationId = location_id;
    if (location_id && isNaN(Number(location_id))) {
      const locationResult = await client.query(
        `SELECT id FROM locations WHERE LOWER(name) = LOWER($1)`,
        [location_id]
      );
      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid location name: ${location_id}` });
      }
      resolvedLocationId = locationResult.rows[0].id;
    }

    // Prepare query based on status
    let query = '';
    let queryParams: any[] = [status, id];
    if (status === 'available') {
      query = `UPDATE equipment 
               SET status = $1, assigned_to = NULL, updated_at = NOW()
               WHERE id = $2
               RETURNING *`;
    } else {
      query = `UPDATE equipment 
               SET status = $1, 
                   category_id = COALESCE($3, category_id), 
                   location_id = COALESCE($4, location_id),
                   assigned_to = COALESCE($5, assigned_to),
                   quantity = COALESCE($6, quantity),
                   updated_at = NOW()
               WHERE id = $2
               RETURNING *`;
      queryParams = [
        status,
        id,
        resolvedCategoryId || null,
        resolvedLocationId || null,
        assigned_to || null,
        req.body.quantity || 1
      ];
    }

    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Equipment not found" });
    }

    // Log activity to checkouts table
    if (status === 'in_use' || status === 'available') {
      await client.query(
        `INSERT INTO checkouts (equipment_id, action, user_name, timestamp, quantity)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [
          id,
          status === 'in_use' ? 'check_out' : 'check_in',
          assigned_to || 'Unknown',
          quantity
        ]
      );
    }

    await client.query('COMMIT');
    console.log("✅ Updated equipment status:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error updating equipment status:", err);
    res.status(500).json({ error: "Failed to update equipment status" });
  } finally {
    client.release();
  }
});

// ✅ GET single equipment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        e.id,
        e.serial_number,
        e.name,
        e.model,
        e.brand,
        e.status,
        e.condition,
        e.purchase_date,
        e.warranty_expiry,
        e.notes,
        e.category_id,
        e.location_id,
        ec.name AS category,
        l.name AS location,
        e.assigned_to,
        e.quantity,
        e.available_quantity,
        e.created_at,
        e.updated_at
      FROM equipment e
      LEFT JOIN equipment_categories ec ON e.category_id = ec.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment" });
  }
});

// ✅ GET recent checkouts
router.get("/checkouts/recent", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await pool.query(
      `SELECT 
         c.id,
         c.equipment_id,
         e.name AS equipment_name,
         e.serial_number AS equipment_serial,
         c.action,
         c.user_name,
         c.department,
         c.timestamp,
         c.quantity
       FROM checkouts c
       JOIN equipment e ON c.equipment_id = e.id
       ORDER BY c.timestamp DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching checkouts:", err);
    res.status(500).json({ error: "Failed to fetch checkouts" });
  }
});

export default router;