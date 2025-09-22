import { Router, Request, Response } from "express";
import pool from "../db.js";

// ====================
// Types and Interfaces
// ====================
interface EquipmentRequest {
  id: number;
  user_id?: number;
  user_name: string;
  user_email?: string;
  equipment_id: number;
  equipment_name: string;
  equipment_model: string;
  equipment_brand: string;
  equipment_category: string;
  equipment_serial_number: string;
  equipment_location: string;
  request_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: "pending" | "approved" | "rejected" | "returned";
  priority?: string;
  purpose?: string;
  notes?: string;
  approval_code?: string;
  approved_date?: string;
  approved_by?: string;
  approved_by_user_id?: number;
  approval_notes?: string;
  rejection_reason?: string;
  rejected_date?: string;
  rejected_by?: string;
  rejected_by_user_id?: number;
  return_condition?: string;
  return_notes?: string;
  created_at: string;
  updated_at: string;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// ====================
// Router setup
// ====================
const router = Router();

// Generate random approval code
const generateApprovalCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Handle DB errors
const handleDatabaseError = (
  error: any,
  res: Response,
  operation: string = "database operation"
) => {
  console.error(`Database error during ${operation}:`, error);
  return res.status(500).json({
    success: false,
    message: `Database error during ${operation}`,
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
  } as ApiResponse);
};

// ====================
// Routes
// ====================
const createEquipmentRequestsRoutes = () => {
  // -------------------------
  // Get all equipment requests (Admin)
  // -------------------------
  router.get("/admin/equipment-requests", async (req: Request, res: Response) => {
    try {
      const result = await pool.query<EquipmentRequest>(`
        SELECT 
          pr.*,
          pr.user_name,
          pr.equipment_name,
          pr.equipment_model,
          pr.equipment_brand,
          pr.equipment_category,
          pr.equipment_serial_number as serial_number,
          pr.equipment_location
        FROM pending_requests pr
        ORDER BY pr.created_at DESC
      `);

      res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching equipment requests");
    }
  });

  // -------------------------
  // Create new equipment request (User)
  // -------------------------
  router.post(
    "/pending-requests",
    async (req: Request, res: Response) => {
      try {
        const {
          equipment_id,
          equipment_name,
          equipment_model,
          equipment_brand,
          equipment_category,
          equipment_serial_number,
          equipment_location,
          request_date,
          expected_return_date,
          user_name,
          status = 'pending',
          priority = "medium",
          purpose,
          notes,
        } = req.body;

        if (!equipment_id || !expected_return_date || !user_name) {
          return res.status(400).json({
            success: false,
            message: "Equipment ID, expected return date, and user name are required",
          } as ApiResponse);
        }

        // Check equipment availability
        const equipment = await pool.query(
          `SELECT * FROM equipment WHERE id = $1 AND status = 'available'`,
          [equipment_id]
        );

        if (equipment.rowCount === 0) {
          return res.status(400).json({
            success: false,
            message: "Equipment not found or not available",
          } as ApiResponse);
        }

        // Insert request into pending_requests table
        const result = await pool.query(
          `
          INSERT INTO pending_requests (
            equipment_id, equipment_name, equipment_model, equipment_brand, 
            equipment_category, equipment_serial_number, equipment_location,
            user_name, request_date, expected_return_date, status, notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING *
        `,
          [
            equipment_id,
            equipment_name,
            equipment_model,
            equipment_brand,
            equipment_category,
            equipment_serial_number,
            equipment_location,
            user_name,
            request_date || new Date().toISOString(),
            expected_return_date,
            status,
            notes
          ]
        );

        res.status(201).json({
          success: true,
          message: "Equipment request submitted successfully",
          data: result.rows[0],
        } as ApiResponse);
      } catch (error) {
        return handleDatabaseError(error, res, "creating equipment request");
      }
    }
  );

  // -------------------------
  // Get equipment requests by user
  // -------------------------
  router.get(
    "/equipment-requests/user/:userName",
    async (req: Request, res: Response) => {
      try {
        const { userName } = req.params;

        const result = await pool.query<EquipmentRequest>(
          `
          SELECT 
            pr.*,
            pr.equipment_name,
            pr.equipment_serial_number as serial_number
          FROM pending_requests pr
          WHERE pr.user_name = $1
          ORDER BY pr.created_at DESC
        `,
          [userName]
        );

        res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
      } catch (error) {
        return handleDatabaseError(error, res, "fetching user equipment requests");
      }
    }
  );

  // -------------------------
  // Approve equipment request (Admin)
  // -------------------------
  router.put(
    "/admin/equipment-requests/:id/approve",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { approval_code, approved_by, approval_notes } = req.body;
        const finalApprovalCode = approval_code || generateApprovalCode();

        if (!approved_by) {
          return res.status(400).json({
            success: false,
            message: "Approved by field is required",
          } as ApiResponse);
        }

        const existing = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1 AND status = 'pending'`,
          [id]
        );

        if (existing.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Request not found or not in pending status",
          } as ApiResponse);
        }

        // Update the request status to approved
        await pool.query(
          `
          UPDATE pending_requests
          SET status = 'approved',
              approval_code = $1,
              approved_date = NOW(),
              approved_by = $2,
              approval_notes = $3,
              updated_at = NOW()
          WHERE id = $4
        `,
          [finalApprovalCode, approved_by, approval_notes, id]
        );

        // Update equipment status to checked_out
        await pool.query(
          `UPDATE equipment SET status = 'checked_out' WHERE id = $1`,
          [existing.rows[0].equipment_id]
        );

        // Get the updated request
        const updated = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: "Request approved successfully",
          data: updated.rows[0],
        } as ApiResponse<EquipmentRequest>);
      } catch (error) {
        return handleDatabaseError(error, res, "approving equipment request");
      }
    }
  );

  // -------------------------
  // Reject equipment request (Admin)
  // -------------------------
  router.put(
    "/admin/equipment-requests/:id/reject",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { rejection_reason, rejected_by } = req.body;

        if (!rejection_reason || !rejected_by) {
          return res.status(400).json({
            success: false,
            message: "Rejection reason and rejected by are required",
          } as ApiResponse);
        }

        const existing = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1 AND status = 'pending'`,
          [id]
        );

        if (existing.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Request not found or not in pending status",
          } as ApiResponse);
        }

        // Update the request status to rejected
        await pool.query(
          `
          UPDATE pending_requests
          SET status = 'rejected',
              rejection_reason = $1,
              rejected_date = NOW(),
              rejected_by = $2,
              updated_at = NOW()
          WHERE id = $3
        `,
          [rejection_reason, rejected_by, id]
        );

        // Get the updated request
        const updated = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: "Request rejected successfully",
          data: updated.rows[0],
        } as ApiResponse<EquipmentRequest>);
      } catch (error) {
        return handleDatabaseError(error, res, "rejecting equipment request");
      }
    }
  );

  // -------------------------
  // Mark equipment as returned (Admin)
  // -------------------------
  router.put(
    "/admin/equipment-requests/:id/return",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { return_condition, return_notes } = req.body;

        const existing = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1 AND status = 'approved'`,
          [id]
        );

        if (existing.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Request not found or not in approved status",
          } as ApiResponse);
        }

        // Update the request status to returned
        await pool.query(
          `
          UPDATE pending_requests
          SET status = 'returned',
              actual_return_date = NOW(),
              return_condition = $1,
              return_notes = $2,
              updated_at = NOW()
          WHERE id = $3
        `,
          [return_condition, return_notes, id]
        );

        // Update equipment status based on return condition
        const equipmentStatus =
          return_condition === "damaged" ? "maintenance" : "available";
        await pool.query(`UPDATE equipment SET status = $1 WHERE id = $2`, [
          equipmentStatus,
          existing.rows[0].equipment_id,
        ]);

        // Get the updated request
        const updated = await pool.query<EquipmentRequest>(
          `SELECT * FROM pending_requests WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: "Equipment returned successfully",
          data: updated.rows[0],
        } as ApiResponse<EquipmentRequest>);
      } catch (error) {
        return handleDatabaseError(error, res, "marking equipment as returned");
      }
    }
  );

  // -------------------------
  // Get equipment request statistics (Admin)
  // -------------------------
  router.get("/admin/equipment-requests/stats", async (req: Request, res: Response) => {
    try {
      const stats = await pool.query<RequestStats>(
        `
        SELECT 
          COUNT(*)::int as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::int as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::int as rejected,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END)::int as returned
        FROM pending_requests
      `
      );

      res.json({ success: true, data: stats.rows[0] } as ApiResponse<RequestStats>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching request statistics");
    }
  });

  return router;
};

export default createEquipmentRequestsRoutes;