import express from "express";
import pool from "../db.js"; // pg Pool instance
// @ts-ignore
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";

const router = express.Router();

// 🔥 EMAIL CONFIGURATION
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

//  HELPER FUNCTION: Generate unique email and password based on requested role
const generateUserCredentials = async (client: any, requestedRole?: string) => {
  let emailNumber = 1;
  let generatedEmail;
  let isUnique = false;

  // Determine email prefix based on requested role
  let emailPrefix = 'user'; // default fallback
  
  if (requestedRole) {
    const role = requestedRole.toLowerCase().trim();
    
    switch (role) {
      case 'admin':
      case 'administrator':
        emailPrefix = 'admin';
        break;
      case 'personnel':
      case 'staff':
      case 'employee':
        emailPrefix = 'personnel';
        break;
      case 'user':
      case 'member':
        emailPrefix = 'user';
        break;
      case 'manager':
        emailPrefix = 'manager';
        break;
      case 'supervisor':
        emailPrefix = 'supervisor';
        break;
      default:
        // For any other role, use the role name itself (sanitized)
        emailPrefix = role.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    }
  }

  console.log(`🎯 Generating email for role: ${requestedRole} -> prefix: ${emailPrefix}`);

  // Keep incrementing until we find a unique email
  while (!isUnique) {
    generatedEmail = `${emailPrefix}${emailNumber}@soko.com`;
    
    // Check if email exists in any table
    const tables = ['pending_users', 'approved_users', 'rejected_users', 'suspended_users', 'blocked_users'];
    let exists = false;
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT id FROM ${table} WHERE generated_email = $1`,
        [generatedEmail]
      );
      if (result.rows.length > 0) {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      isUnique = true;
      console.log(`✅ Found unique email: ${generatedEmail}`);
    } else {
      emailNumber++;
      console.log(`🔄 Email ${generatedEmail} exists, trying ${emailPrefix}${emailNumber}@soko.com`);
    }
  }

  // Generate secure password
  const password = crypto.randomBytes(8).toString('hex').slice(0, 12); // 12 char password
  
  return {
    email: generatedEmail,
    password: password
  };
};

// 🔥 HELPER FUNCTION: Send welcome email with credentials
const sendWelcomeEmail = async (userEmail: string, userName: string, generatedEmail: string, password: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SOKO Admin" <admin@soko.com>',
    to: userEmail,
    subject: "🎉 Welcome to SOKO - Your Account Has Been Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to SOKO!</h1>
          <p style="color: #e8e8e8; margin: 10px 0 0 0; font-size: 16px;">Your account has been approved</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${userName}</strong>,
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Great news! Your SOKO account has been approved by our admin team. You can now access your account using the credentials below:
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📧 Your Login Credentials:</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; color: #e83e8c;">${generatedEmail}</code></p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; color: #e83e8c;">${password}</code></p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>🔒 Security Tip:</strong> Please change your password after your first login for better security.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.LOGIN_URL || 'https://app.soko.com/login'}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.<br>
            <strong>SOKO Team</strong> 💙
          </p>
        </div>
      </div>
    `,
    text: `
Welcome to SOKO!

Hello ${userName},

Your SOKO account has been approved! Here are your login credentials:

Email: ${generatedEmail}
Password: ${password}

Please login at: ${process.env.LOGIN_URL || 'https://app.soko.com/login'}

For security, please change your password after your first login.

Best regards,
SOKO Team
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${userEmail}:`, error);
    return false;
  }
};

//
// Get all pending users but shape data for frontend
router.get("/requests", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pending_users ORDER BY created_at DESC"
    );

    // 🔥 Transform to frontend shape with ALL required fields
    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || null,
      status: row.status || "pending",
      submitted_at: row.created_at,
      action_date: row.approved_at || null, // Add action_date mapping
      admin_notes: row.rejection_reason || row.admin_notes || null, // Add admin_notes
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      rejection_reason: row.rejection_reason || null,
      created_at: row.created_at
    }));

    console.log("📋 Formatted data sample:", formatted[0]); // Debug log

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching pending users:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

//
// 🔥 NEW: Get all approved users
//
router.get("/approved", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM approved_users ORDER BY approved_at DESC"
    );

    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || null,
      status: row.status || "approved",
      submitted_at: row.original_request_date,
      action_date: row.approved_at,
      admin_notes: row.admin_notes || null,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching approved users:", error);
    res.status(500).json({ error: "Failed to fetch approved users" });
  }
});

//
//  NEW: Get all rejected users
//
router.get("/rejected", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rejected_users ORDER BY rejected_at DESC"
    );

    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || null,
      status: row.status || "rejected",
      submitted_at: row.original_request_date,
      action_date: row.rejected_at,
      admin_notes: row.admin_notes || row.rejection_reason || null,
      rejected_by: row.rejected_by,
      rejected_at: row.rejected_at,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching rejected users:", error);
    res.status(500).json({ error: "Failed to fetch rejected users" });
  }
});

//
//  NEW: Get all suspended users
//
router.get("/suspended", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM suspended_users ORDER BY suspended_at DESC"
    );

    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || null,
      status: row.status || "suspended",
      submitted_at: row.original_request_date,
      action_date: row.suspended_at,
      admin_notes: row.admin_notes || null,
      suspended_by: row.suspended_by,
      suspended_at: row.suspended_at,
      created_at: row.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching suspended users:", error);
    res.status(500).json({ error: "Failed to fetch suspended users" });
  }
});

//
// 0 NEW: Get all blocked users
//
router.get("/blocked", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM blocked_users ORDER BY blocked_at DESC"
    );

    const formatted = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      requested_role: row.requested_role || null,
      status: row.status || "blocked",
      submitted_at: row.original_request_date,
      action_date: row.blocked_at,
      admin_notes: row.admin_notes || null,
      blocked_by: row.blocked_by,
      blocked_at: row.blocked_at,
      created_at: row.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching blocked users:", error);
    res.status(500).json({ error: "Failed to fetch blocked users" });
  }
});

//
// 🔥 HELPER FUNCTION: Find user in any table and return the user data with source table
//
const findUserInAnyTable = async (client: any, userId: string) => {
  const tables = [
    { name: 'pending_users', status: 'pending' },
    { name: 'approved_users', status: 'approved' },
    { name: 'rejected_users', status: 'rejected' },
    { name: 'suspended_users', status: 'suspended' },
    { name: 'blocked_users', status: 'blocked' }
  ];

  for (const table of tables) {
    const result = await client.query(
      `SELECT * FROM ${table.name} WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length > 0) {
      return {
        user: result.rows[0],
        sourceTable: table.name,
        currentStatus: table.status
      };
    }
  }
  
  return null;
};

//
// 🔥 UPDATED: Approve user - Works from any table + Generate credentials + Send email
router.post("/approve-user/:id", async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  console.log(`🔍 Attempting to approve user ID: ${id}`);
  console.log(`📝 Admin notes: ${admin_notes}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find user in any table
    const userData = await findUserInAnyTable(client, id);
    if (!userData) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found in any table" });
    }

    const { user, sourceTable, currentStatus } = userData;

    // If already approved, just update admin notes (don't generate new credentials)
    if (currentStatus === 'approved') {
      const updateResult = await client.query(
        `UPDATE approved_users SET admin_notes = $1 WHERE id = $2 RETURNING *`,
        [admin_notes || user.admin_notes, id]
      );
      
      await client.query("COMMIT");
      return res.json({ 
        message: "User already approved, updated admin notes", 
        user: updateResult.rows[0] 
      });
    }

    // 🔥 Generate unique credentials for new approval (pass the role)
    const credentials = await generateUserCredentials(client, user.requested_role);
    
    // 🔥 CRITICAL FIX: Hash the generated password before storing
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    
    console.log(`🎯 Generated credentials for ${user.name}:`, {
      email: credentials.email,
      password: '****', // Don't log actual password
      passwordLength: credentials.password.length,
      hashedLength: hashedPassword.length
    });

    // Insert into approved_users table with HASHED generated password
    const insertResult = await client.query(
      `INSERT INTO approved_users (
        name, email, phone, department, requested_role, status, 
        admin_notes, approved_at, original_request_date, created_at,
        generated_email, generated_password
      )
       VALUES ($1, $2, $3, $4, $5, 'approved', $6, NOW(), $7, NOW(), $8, $9)
       RETURNING *`,
      [
        user.name, 
        user.email, 
        user.phone, 
        user.department,
        user.requested_role,
        admin_notes || "Approved by admin",
        user.original_request_date || user.created_at,
        credentials.email,
        hashedPassword // 🔥 Store HASHED password
      ]
    );

    // Remove from source table
    await client.query(`DELETE FROM ${sourceTable} WHERE id = $1`, [id]);

    await client.query("COMMIT");

    // 🔥 Send welcome email with ORIGINAL plain text password (async, don't block response)
    setImmediate(async () => {
      const emailSent = await sendWelcomeEmail(
        user.email, 
        user.name, 
        credentials.email as string,
        credentials.password // Send original plain text password in email
      );
      
      if (emailSent) {
        console.log(`✅ Welcome email sent to ${user.name} at ${user.email}`);
      } else {
        console.log(`❌ Failed to send welcome email to ${user.name}`);
      }
    });

    res.json({ 
      message: `User moved from ${currentStatus} to approved`, 
      user: {
        ...insertResult.rows[0],
        generated_password: '****' // Don't expose password in response
      },
      credentials_sent: true,
      generated_email: credentials.email,
      debug: {
        originalPasswordLength: credentials.password.length,
        hashedPasswordLength: hashedPassword.length
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error approving user:", err);
    res.status(500).json({ error: "Failed to approve user" });
  } finally {
    client.release();
  }
});

//
// 🔥 UNIVERSAL: Reject user - Works from any table
//
router.post("/reject-user/:id", async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  console.log(`🔍 Attempting to reject user ID: ${id}`);
  console.log(`📝 Admin notes: ${admin_notes}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find user in any table
    const userData = await findUserInAnyTable(client, id);
    if (!userData) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found in any table" });
    }

    const { user, sourceTable, currentStatus } = userData;

    // If already rejected, just update admin notes
    if (currentStatus === 'rejected') {
      const updateResult = await client.query(
        `UPDATE rejected_users SET admin_notes = $1, rejection_reason = $1 WHERE id = $2 RETURNING *`,
        [admin_notes || user.admin_notes, id]
      );
      
      await client.query("COMMIT");
      return res.json({ 
        message: "User already rejected, updated admin notes", 
        user: updateResult.rows[0] 
      });
    }

    // Insert into rejected_users table
    const insertResult = await client.query(
      `INSERT INTO rejected_users (
        name, email, phone, department, requested_role, status, 
        admin_notes, rejection_reason, rejected_at, original_request_date, created_at
      )
       VALUES ($1, $2, $3, $4, $5, 'rejected', $6, $6, NOW(), $7, NOW())
       RETURNING *`,
      [
        user.name, 
        user.email, 
        user.phone, 
        user.department,
        user.requested_role,
        admin_notes || "Rejected by admin",
        user.original_request_date || user.created_at
      ]
    );

    // Remove from source table
    await client.query(`DELETE FROM ${sourceTable} WHERE id = $1`, [id]);

    await client.query("COMMIT");
    res.json({ 
      message: `User moved from ${currentStatus} to rejected`, 
      user: insertResult.rows[0] 
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error rejecting user:", err);
    res.status(500).json({ error: "Failed to reject user" });
  } finally {
    client.release();
  }
});

//
// 🔥 UNIVERSAL: Suspend user - Works from any table
//
router.post("/suspend-user/:id", async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  console.log(`🔍 Attempting to suspend user ID: ${id}`);
  console.log(`📝 Admin notes: ${admin_notes}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find user in any table
    const userData = await findUserInAnyTable(client, id);
    if (!userData) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found in any table" });
    }

    const { user, sourceTable, currentStatus } = userData;

    // If already suspended, just update admin notes
    if (currentStatus === 'suspended') {
      const updateResult = await client.query(
        `UPDATE suspended_users SET admin_notes = $1 WHERE id = $2 RETURNING *`,
        [admin_notes || user.admin_notes, id]
      );
      
      await client.query("COMMIT");
      return res.json({ 
        message: "User already suspended, updated admin notes", 
        user: updateResult.rows[0] 
      });
    }

    // Insert into suspended_users table
    const insertResult = await client.query(
      `INSERT INTO suspended_users (
        name, email, phone, department, requested_role, status, 
        admin_notes, suspended_at, original_request_date, created_at
      )
       VALUES ($1, $2, $3, $4, $5, 'suspended', $6, NOW(), $7, NOW())
       RETURNING *`,
      [
        user.name, 
        user.email, 
        user.phone, 
        user.department,
        user.requested_role,
        admin_notes || "Suspended by admin",
        user.original_request_date || user.created_at
      ]
    );

    // Remove from source table
    await client.query(`DELETE FROM ${sourceTable} WHERE id = $1`, [id]);

    await client.query("COMMIT");
    res.json({ 
      message: `User moved from ${currentStatus} to suspended`, 
      user: insertResult.rows[0] 
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error suspending user:", err);
    res.status(500).json({ error: "Failed to suspend user" });
  } finally {
    client.release();
  }
});

//
// 🔥 UNIVERSAL: Block user - Works from any table
//
router.post("/block-user/:id", async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  console.log(`🔍 Attempting to block user ID: ${id}`);
  console.log(`📝 Admin notes: ${admin_notes}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find user in any table
    const userData = await findUserInAnyTable(client, id);
    if (!userData) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found in any table" });
    }

    const { user, sourceTable, currentStatus } = userData;

    // If already blocked, just update admin notes
    if (currentStatus === 'blocked') {
      const updateResult = await client.query(
        `UPDATE blocked_users SET admin_notes = $1 WHERE id = $2 RETURNING *`,
        [admin_notes || user.admin_notes, id]
      );
      
      await client.query("COMMIT");
      return res.json({ 
        message: "User already blocked, updated admin notes", 
        user: updateResult.rows[0] 
      });
    }

    // Insert into blocked_users table
    const insertResult = await client.query(
      `INSERT INTO blocked_users (
        name, email, phone, department, requested_role, status, 
        admin_notes, blocked_at, original_request_date, created_at
      )
       VALUES ($1, $2, $3, $4, $5, 'blocked', $6, NOW(), $7, NOW())
       RETURNING *`,
      [
        user.name, 
        user.email, 
        user.phone, 
        user.department,
        user.requested_role,
        admin_notes || "Blocked by admin",
        user.original_request_date || user.created_at
      ]
    );

    // Remove from source table
    await client.query(`DELETE FROM ${sourceTable} WHERE id = $1`, [id]);

    await client.query("COMMIT");
    res.json({ 
      message: `User moved from ${currentStatus} to blocked`, 
      user: insertResult.rows[0] 
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error blocking user:", err);
    res.status(500).json({ error: "Failed to block user" });
  } finally {
    client.release();
  }
});

export default router;