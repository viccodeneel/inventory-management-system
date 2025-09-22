import { Router, Request, Response } from "express";
import pool from "../db.js";

const router = Router();

// GET all equipment categories
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, created_at, updated_at 
      FROM equipment_categories 
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching equipment categories:", err);
    res.status(500).json({ error: "Failed to fetch equipment categories" });
  }
});

export default router;