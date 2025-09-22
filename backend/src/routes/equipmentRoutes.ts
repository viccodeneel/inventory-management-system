// routes/equipmentRoutes.ts
import { Router, Request, Response } from "express";
import pool from "../db.js"; // adjust path to db.ts

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
        ec.name AS category,
        l.name AS location,
        ci.username AS assigned_to
      FROM equipment e
      LEFT JOIN equipment_categories ec ON e.category_id = ec.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN check_in_out ci ON e.assigned_to = ci.id
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
  try {
    const {
      name,
      serial_number,
      model,
      brand,
      category_id,
      location_id,
      status,
      condition
    } = req.body;

    if (!name || !category_id || !location_id) {
      return res.status(400).json({ error: "Missing required fields: name, category_id, location_id" });
    }

    const result = await pool.query(
      `INSERT INTO equipment 
        (name, serial_number, model, brand, category_id, location_id, status, condition, created_at, updated_at)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        name,
        serial_number || null,
        model || null,
        brand || null,
        category_id,
        location_id,
        status || "Available",
        condition || "Good"
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding equipment:", err);
    res.status(500).json({ error: "Failed to add equipment" });
  }
});

// Add these routes to your equipmentRoutes.ts file

// ✅ UPDATE equipment (PUT)
router.put("/:id", async (req: Request, res: Response) => {
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
      purchase_date,
      warranty_expiry,
      notes
    } = req.body;

    if (!name || !category_id || !location_id) {
      return res.status(400).json({ error: "Missing required fields: name, category_id, location_id" });
    }

    const result = await pool.query(
      `UPDATE equipment 
       SET name = $1, serial_number = $2, model = $3, brand = $4, 
           category_id = $5, location_id = $6, status = $7, condition = $8,
           purchase_date = $9, warranty_expiry = $10, notes = $11, updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name,
        serial_number || null,
        model || null,
        brand || null,
        category_id,
        location_id,
        status || "available",
        condition || "good",
        purchase_date || null,
        warranty_expiry || null,
        notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    console.log("✅ Updated equipment:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating equipment:", err);
    res.status(500).json({ error: "Failed to update equipment" });
  }
});

// ✅ DELETE equipment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM equipment WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    console.log("✅ Deleted equipment:", result.rows[0]);
    res.json({ message: "Equipment deleted successfully", equipment: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting equipment:", err);
    res.status(500).json({ error: "Failed to delete equipment" });
  }
});

// ✅ UPDATE equipment status only (PATCH)
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status value
    const validStatuses = ['available', 'in_use', 'maintenance', 'out_of_service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const result = await pool.query(
      `UPDATE equipment 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    console.log("✅ Updated equipment status:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating equipment status:", err);
    res.status(500).json({ error: "Failed to update equipment status" });
  }
});

// ✅ GET single equipment by ID (optional - for future use)
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
        ci.username AS assigned_to,
        e.created_at,
        e.updated_at
      FROM equipment e
      LEFT JOIN equipment_categories ec ON e.category_id = ec.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN check_in_out ci ON e.assigned_to = ci.id
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

export default router;
