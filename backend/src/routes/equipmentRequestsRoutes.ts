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
  status: "pending" | "approved" | "rejected" | "returned" | "in_use";
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

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
  // Get all rejected equipment requests (Admin)
  router.get("/admin/rejected-requests", async (req: Request, res: Response) => {
    try {
      const result = await pool.query<EquipmentRequest>(`
        SELECT 
          rr.*,
          rr.user_name,
          rr.equipment_name,
          rr.equipment_model,
          rr.equipment_brand,
          rr.equipment_category,
          rr.equipment_serial_number,
          rr.equipment_location,
          rr.request_id AS id,
          rr.requested_date AS request_date,
          rr.rejected_date,
          rr.rejection_reason,
          rr.rejected_by
        FROM rejected_requests rr
        ORDER BY rr.rejected_date DESC
      `);

      res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching rejected requests");
    }
  });

  // Get all pending equipment requests (Admin)
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
          pr.equipment_serial_number,
          pr.equipment_location
        FROM pending_requests pr
        WHERE pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `);

      res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching equipment requests");
    }
  });

  // Get all approved equipment requests (Admin)
  router.get("/admin/approved-requests", async (req: Request, res: Response) => {
    try {
      const result = await pool.query<EquipmentRequest>(`
        SELECT 
          ar.*,
          ar.user_name,
          ar.equipment_name,
          ar.equipment_model,
          ar.equipment_brand,
          ar.equipment_category,
          ar.equipment_serial_number,
          ar.equipment_location
        FROM approved_requests ar
        ORDER BY ar.approved_date DESC
      `);

      res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching approved requests");
    }
  });

  // Get all returned equipment requests (Admin)
  router.get("/admin/returned-requests", async (req: Request, res: Response) => {
    try {
      const result = await pool.query<EquipmentRequest>(`
        SELECT 
          ar.*,
          ar.user_name,
          ar.equipment_name,
          ar.equipment_model,
          ar.equipment_brand,
          ar.equipment_category,
          ar.equipment_serial_number,
          ar.equipment_location
        FROM approved_requests ar
        WHERE ar.status = 'returned'
        ORDER BY ar.actual_return_date DESC
      `);

      res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
    } catch (error) {
      return handleDatabaseError(error, res, "fetching returned requests");
    }
  });

  // Create new equipment request (User)
  router.post("/pending-requests", async (req: Request, res: Response) => {
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
  });

  // Get equipment requests by user (pending)
  router.get(
    "/equipment-requests/user/:userName/pending",
    async (req: Request, res: Response) => {
      try {
        const { userName } = req.params;

        const result = await pool.query<EquipmentRequest>(
          `
          SELECT 
            pr.*,
            pr.equipment_name,
            pr.equipment_serial_number,
            pr.equipment_category,
            pr.request_date,
            pr.expected_return_date,
            pr.status,
            pr.notes
          FROM pending_requests pr
          WHERE pr.user_name = $1 AND pr.status = 'pending'
          ORDER BY pr.created_at DESC
        `,
          [userName]
        );

        res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
      } catch (error) {
        return handleDatabaseError(error, res, "fetching user pending requests");
      }
    }
  );

  // Get equipment requests by user (approved)
  router.get(
    "/equipment-requests/user/:userName/approved",
    async (req: Request, res: Response) => {
      try {
        const { userName } = req.params;

        const result = await pool.query<EquipmentRequest>(
          `
          SELECT 
            ar.*,
            ar.equipment_name,
            ar.equipment_serial_number,
            ar.equipment_category,
            ar.request_date,
            ar.expected_return_date,
            ar.status,
            ar.approval_code
          FROM approved_requests ar
          WHERE ar.user_name = $1 AND ar.status IN ('approved', 'in_use')
          ORDER BY ar.approved_date DESC
        `,
          [userName]
        );

        res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
      } catch (error) {
        return handleDatabaseError(error, res, "fetching user approved requests");
      }
    }
  );

  // Get equipment requests by user (rejected)
  router.get(
    "/equipment-requests/user/:userName/rejected",
    async (req: Request, res: Response) => {
      try {
        const { userName } = req.params;

        const result = await pool.query<EquipmentRequest>(
          `
          SELECT 
            rr.*,
            rr.equipment_name,
            rr.equipment_serial_number,
            rr.equipment_category,
            rr.requested_date AS request_date,
            rr.expected_return_date,
            rr.rejection_reason
          FROM rejected_requests rr
          WHERE rr.user_name = $1
          ORDER BY rr.rejected_date DESC
        `,
          [userName]
        );

        res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
      } catch (error) {
        return handleDatabaseError(error, res, "fetching user rejected requests");
      }
    }
  );

  // Get equipment requests by user (returned)
  router.get(
    "/equipment-requests/user/:userName/returned",
    async (req: Request, res: Response) => {
      try {
        const { userName } = req.params;

        const result = await pool.query<EquipmentRequest>(
          `
          SELECT 
            ar.*,
            ar.equipment_name,
            ar.equipment_serial_number,
            ar.equipment_category,
            ar.request_date,
            ar.expected_return_date,
            ar.status,
            ar.return_notes
          FROM approved_requests ar
          WHERE ar.user_name = $1 AND ar.status = 'returned'
          ORDER BY ar.actual_return_date DESC
        `,
          [userName]
        );

        res.json({ success: true, data: result.rows } as ApiResponse<EquipmentRequest[]>);
      } catch (error) {
        return handleDatabaseError(error, res, "fetching user returned requests");
      }
    }
  );

  // Cancel equipment request (User)
  router.delete(
    "/equipment-requests/:id/cancel",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

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

        await pool.query(
          `DELETE FROM pending_requests WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: "Request canceled successfully",
        } as ApiResponse);
      } catch (error) {
        return handleDatabaseError(error, res, "canceling equipment request");
      }
    }
  );

  // Approve equipment request (Admin)
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

        const request = existing.rows[0];

        // Start a transaction
        await pool.query('BEGIN');

        try {
          // Insert into approved_requests table
          const approvedResult = await pool.query(
            `
            INSERT INTO approved_requests (
              id,
              equipment_id,
              equipment_name,
              equipment_model,
              equipment_brand,
              equipment_category,
              equipment_serial_number,
              equipment_location,
              user_id,
              user_name,
              request_date,
              approved_date,
              expected_return_date,
              approval_code,
              notes,
              status,
              created_at,
              updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, NOW(), $12, $13, $14, 'approved', $15, NOW()
            )
            RETURNING *
            `,
            [
              request.id,
              request.equipment_id,
              request.equipment_name,
              request.equipment_model,
              request.equipment_brand,
              request.equipment_category,
              request.equipment_serial_number,
              request.equipment_location,
              request.user_id,
              request.user_name,
              request.request_date,
              request.expected_return_date,
              finalApprovalCode,
              approval_notes || request.notes,
              request.created_at
            ]
          );

          // Delete from pending_requests
          await pool.query(
            `DELETE FROM pending_requests WHERE id = $1`,
            [id]
          );

          // Update equipment status
          await pool.query(
            `UPDATE equipment 
             SET status = 'in_use', assigned_to = $1, updated_at = NOW() 
             WHERE id = $2`,
            [request.user_id, request.equipment_id]
          );

          // Commit transaction
          await pool.query('COMMIT');

          res.json({
            success: true,
            message: "Request approved successfully",
            data: approvedResult.rows[0],
          } as ApiResponse<EquipmentRequest>);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error('Approval transaction error:', error);
          throw error;
        }
      } catch (error) {
        return handleDatabaseError(error, res, "approving equipment request");
      }
    }
  );

  // Reject equipment request (Admin)
  router.put(
    "/admin/equipment-requests/:id/reject",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { rejection_reason, rejected_by } = req.body;

        if (!rejection_reason || !rejected_by) {
          return res.status(400).json({
            success: false,
            message: "Rejection reason and rejected by fields are required",
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

        const pendingRequest = existing.rows[0];

        // Start transaction
        await pool.query('BEGIN');

        try {
          // Delete from pending_requests
          const result = await pool.query(
            `
            DELETE FROM pending_requests 
            WHERE id = $1
            RETURNING *
          `,
            [id]
          );

          const rejectedRequest = result.rows[0];

          // Insert into rejected_requests
          await pool.query(
            `
            INSERT INTO rejected_requests (
              request_id,
              equipment_id,
              equipment_name,
              equipment_model,
              equipment_brand,
              equipment_category,
              equipment_serial_number,
              equipment_location,
              user_id,
              user_name,
              requested_date,
              rejection_reason,
              rejected_by,
              rejected_date,
              created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, NOW()
            )
            `,
            [
              rejectedRequest.id,
              rejectedRequest.equipment_id,
              rejectedRequest.equipment_name,
              rejectedRequest.equipment_model,
              rejectedRequest.equipment_brand,
              rejectedRequest.equipment_category,
              rejectedRequest.equipment_serial_number,
              rejectedRequest.equipment_location,
              rejectedRequest.user_id,
              rejectedRequest.user_name,
              rejectedRequest.request_date,
              rejection_reason,
              rejected_by,
              new Date().toISOString()
            ]
          );

          // Commit transaction
          await pool.query('COMMIT');

          res.json({
            success: true,
            message: "Request rejected successfully",
            data: rejectedRequest,
          } as ApiResponse<EquipmentRequest>);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error('Rejection transaction error:', error);
          throw error;
        }
      } catch (error) {
        return handleDatabaseError(error, res, "rejecting equipment request");
      }
    }
  );

  // Mark equipment as picked up (Admin)
  router.put(
    "/admin/equipment-requests/:id/pickup",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const existing = await pool.query<EquipmentRequest>(
          `SELECT * FROM approved_requests WHERE id = $1 AND status = 'approved'`,
          [id]
        );

        if (existing.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Request not found or not in approved status",
          } as ApiResponse);
        }

        const request = existing.rows[0];

        // Update status to in_use
        const result = await pool.query(
          `
          UPDATE approved_requests 
          SET status = 'in_use',
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
          [id]
        );

        // Update equipment status
        await pool.query(
          `UPDATE equipment SET status = 'in_use' WHERE id = $1`,
          [request.equipment_id]
        );

        res.json({
          success: true,
          message: "Equipment marked as picked up successfully",
          data: result.rows[0],
        } as ApiResponse<EquipmentRequest>);
      } catch (error) {
        return handleDatabaseError(error, res, "marking equipment as picked up");
      }
    }
  );

  // Mark equipment as returned (Admin)
  router.put(
    "/admin/equipment-requests/:id/return",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { return_condition, return_notes } = req.body;

        const existing = await pool.query<EquipmentRequest>(
          `SELECT * FROM approved_requests WHERE id = $1 AND status = 'in_use'`,
          [id]
        );

        if (existing.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Request not found or not in 'in use' status",
          } as ApiResponse);
        }

        const request = existing.rows[0];

        // Start a transaction
        await pool.query('BEGIN');

        try {
          // Update approved_requests
          const result = await pool.query(
            `
            UPDATE approved_requests 
            SET status = 'returned',
                actual_return_date = NOW(),
                return_condition = $1,
                return_notes = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
          `,
            [return_condition || 'good', return_notes, id]
          );

          const returnedRequest = result.rows[0];

          // Insert into returned_equipments
          await pool.query(
            `
            INSERT INTO returned_equipments (
              request_id,
              equipment_id,
              user_id,
              borrowed_date,
              expected_return_date,
              actual_return_date,
              return_condition,
              return_notes,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `,
            [
              returnedRequest.id,
              returnedRequest.equipment_id,
              returnedRequest.user_id,
              returnedRequest.approved_date || returnedRequest.created_at,
              returnedRequest.expected_return_date,
              returnedRequest.actual_return_date,
              return_condition || 'good',
              return_notes
            ]
          );

          // Update equipment status
          await pool.query(
            `UPDATE equipment SET status = 'available' WHERE id = $1`,
            [returnedRequest.equipment_id]
          );

          // Commit transaction
          await pool.query('COMMIT');

          res.json({
            success: true,
            message: "Equipment marked as returned successfully",
            data: returnedRequest,
          } as ApiResponse<EquipmentRequest>);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error('Return transaction error:', error);
          throw error;
        }
      } catch (error) {
        return handleDatabaseError(error, res, "marking equipment as returned");
      }
    }
  );

  return router;
};

export default createEquipmentRequestsRoutes;