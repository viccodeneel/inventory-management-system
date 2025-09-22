import { Router, Request, Response } from "express";
import pool from "../db.js";

const router = Router();

// GET all locations
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, address, description, created_at, updated_at 
      FROM locations 
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

export default router;