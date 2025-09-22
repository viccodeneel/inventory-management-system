import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

// Helper function to generate JWT
const generateToken = (userId: number, userEmail: string, userName: string, userRole: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  return jwt.sign(
    { id: userId, email: userEmail, name: userName, role: userRole },
    secret as jwt.Secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "1h" }
  );
};

// Register - Submit to pending_users table for approval
router.post("/register", async (req, res) => {
  console.log("🔵 Registration attempt started");
  console.log("📝 Request body:", { ...req.body });

  const { name, email, phone, department, requestedRole } = req.body;

 // Input validation
  if (!name || !email || !phone || !department) {
    console.log("❌ Validation failed: Missing required fields");
    return res.status(400).json({ 
      message: "All fields are required (name, email, phone, department)",
      received: { 
        name: !!name, 
        email: !!email, 
        phone: !!phone, 
        department: !!department
      }
    });
  }

  try {
    console.log("🔍 Checking if user already exists...");
    
    // Check both pending_users and users tables
    const pendingUserExists = await pool.query(
      "SELECT * FROM pending_users WHERE email = $1",
      [email]
    );
    
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    if (pendingUserExists.rows.length > 0) {
      return res.status(400).json({ message: "Registration already pending approval" });
    }
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    console.log("🔒 Generating temporary password...");
    // Generate a temporary password for all pending users
     const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    console.log("✅ Temporary password generated and hashed");

    // ✅ Role assignment logic
const allowedRoles = ["admin", "personnel", "user"];
    let finalRole = "user"; // Default role

    if (requestedRole) {
      const normalizedRole = requestedRole.toLowerCase().trim();
      if (allowedRoles.includes(normalizedRole)) {
        finalRole = normalizedRole;
      }
    }
console.log("🎭 Final assigned role:", finalRole);

    console.log("💾 Inserting user into pending_users table...");

    // ✅ FIXED: Add status field and ensure all required fields are present
    const result = await pool.query(
      `INSERT INTO pending_users 
       (name, email, phone, department, password, requested_role, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING id, name, email, phone, department, requested_role, status, created_at`,
      [name, email, phone, department, hashedPassword, finalRole, 'pending']
    );

    console.log("✅ User inserted successfully:", result.rows[0]);

    const responseData = {
      message: "Registration submitted successfully. Please wait for admin approval.",
      pendingUser: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        department: result.rows[0].department,
        requested_role: result.rows[0].requested_role,
        status: result.rows[0].status,
        created_at: result.rows[0].created_at
      }
    };

    console.log("📤 Sending success response:", responseData);

    res.status(201).json(responseData);
    
    console.log("✅ Registration submitted successfully");

  } catch (err) {
    console.error("❌ Registration error details:", {
      name: err instanceof Error ? err.name : 'Unknown Error',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      code: (err as any).code
    });

    let errorMessage = "Server error";
    let statusCode = 500;

    if ((err as { code?: string }).code === '23505') { // Unique constraint violation
      errorMessage = "Email already exists";
      statusCode = 400;
    } else if ((err as { code?: string }).code === '23502') { // Not null constraint violation
      errorMessage = "Missing required fields";
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : String(err)) : undefined
    });
  }
});

// Login - Only approved users from users table can login
// Login - Users from both users table and approved_users table can login
router.post("/login", async (req, res) => {
  console.log("🔵 Login attempt started");
  console.log("📝 Request body:", { ...req.body, password: "***" });

  const { email, password } = req.body;

  if (!email || !password) {
    console.log("❌ Login validation failed: Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    let user = null;
    let userSource = null;

    // First, check the users table
    console.log("🔍 Looking up user in users table...");
    console.log(`📧 Searching for email: "${email}"`);
    
    const usersResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log(`📊 Users table query returned ${usersResult.rows.length} rows`);
    
    if (usersResult.rows.length > 0) {
      user = usersResult.rows[0];
      userSource = 'users';
      console.log(`✅ User found in users table:`, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password
      });
    } else {
      // If not found in users table, check approved_users table with generated_email
      console.log("🔍 User not found in users table, checking approved_users table...");
      
      const approvedUsersResult = await pool.query("SELECT * FROM approved_users WHERE generated_email = $1", [email]);
      console.log(`📊 Approved_users table query returned ${approvedUsersResult.rows.length} rows`);
      
      if (approvedUsersResult.rows.length > 0) {
        user = approvedUsersResult.rows[0];
        userSource = 'approved_users';
        console.log(`✅ User found in approved_users table:`, {
          id: user.id,
          generated_email: user.generated_email,
          name: user.name,
          requested_role: user.requested_role,
          hasGeneratedPassword: !!user.generated_password
        });
      } else {
        // Let's also check what emails exist in both tables for debugging
        console.log("🔍 DEBUG: Checking all emails in both tables...");
        const allUsers = await pool.query("SELECT email FROM users");
        const allApprovedUsers = await pool.query("SELECT generated_email FROM approved_users");
        
        console.log("📋 Emails in users table:", allUsers.rows.map(row => row.email));
        console.log("📋 Generated emails in approved_users table:", allApprovedUsers.rows.map(row => row.generated_email));
      }
    }

    if (!user) {
      console.log("❌ No user found with provided email in either table");
      return res.status(400).json({ message: "Invalid email or password, or account not approved" });
    }

    console.log(`🔒 Verifying password for user from ${userSource} table...`);
    console.log(`🔐 Password provided length: ${password.length}`);
    
    // Use appropriate password field based on source table
    const storedPassword = userSource === 'users' ? user.password : user.generated_password;
    console.log(`🔐 Stored password hash exists: ${!!storedPassword}`);
    console.log(`🔐 Stored password hash length: ${storedPassword ? storedPassword.length : 'N/A'}`);
    console.log(`🔐 Using password field: ${userSource === 'users' ? 'password' : 'generated_password'}`);
    
    const validPassword = await bcrypt.compare(password, storedPassword);
    console.log(`🔐 Password comparison result: ${validPassword}`);

    if (!validPassword) {
      console.log("❌ Invalid password");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Determine the user role based on which table they're from
    const userRole = userSource === 'users' ? user.role : user.requested_role;
    
    console.log(`👤 User role determined: ${userRole} (from ${userSource} table)`);

    console.log("🔑 Generating JWT token...");
    const token = generateToken(
      user.id,
      userSource === 'users' ? user.email : user.generated_email,
      user.name,
      userRole
    );

    // Build response data - handle different table structures
    const responseData = {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: userSource === 'users' ? user.email : user.generated_email,
        phone: user.phone || null,
        department: user.department || null,
        role: userRole,
        source: userSource // Optional: to know which table the user came from
      },
      token,
    };

    console.log(`📤 Sending login success response for ${userRole} user`);
    res.json(responseData);
    console.log("✅ Login completed successfully");

  } catch (err) {
    console.error("❌ Login error details:", {
      name: err instanceof Error ? err.name : 'Unknown Error',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
    res.status(500).json({ message: "Server error" });
  }
});

// Admin route to get all pending users
router.get("/pending-users", async (req, res) => {
  console.log("🔵 Fetching pending users");
  
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, department, requested_role, created_at FROM pending_users ORDER BY created_at DESC"
    );
    
    console.log(`📊 Found ${result.rows.length} pending users`);
    
    res.json({
      message: "Pending users retrieved successfully",
      pendingUsers: result.rows
    });
    
  } catch (err) {
    console.error("❌ Error fetching pending users:", err);
    res.status(500).json({ message: "Failed to fetch pending users" });
  }
});

// Admin route to approve pending user
router.post("/approve-user/:pendingUserId", async (req, res) => {
  console.log("🔵 Approving pending user");
  const { pendingUserId } = req.params;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log(`🔍 Looking up pending user ${pendingUserId}`);
      const pendingUserResult = await client.query(
        "SELECT * FROM pending_users WHERE id = $1", 
        [pendingUserId]
      );
      
      if (pendingUserResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log("❌ Pending user not found");
        return res.status(404).json({ message: "Pending user not found" });
      }
      
      const pendingUser = pendingUserResult.rows[0];
      console.log("✅ Pending user found:", { ...pendingUser, password: "***" });
      
      console.log("💾 Moving user to users table...");
      // When approving, admins can decide the actual role
      // For now, we'll use the requested role, but this could be modified by admin UI
      const finalRole = pendingUser.requested_role === 'admin' ? 'user' : 'user'; // Default to user for security
      
      const approvedUser = await client.query(
        "INSERT INTO users (name, email, phone, department, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, department, role, created_at",
        [pendingUser.name, pendingUser.email, pendingUser.phone, pendingUser.department, pendingUser.password, finalRole]
      );
      
      console.log("🗑️ Removing from pending_users table...");
      await client.query("DELETE FROM pending_users WHERE id = $1", [pendingUserId]);
      
      await client.query('COMMIT');
      console.log("✅ User approved successfully");
      
      res.json({ 
        message: "User approved and moved to active users",
        user: approvedUser.rows[0]
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error("❌ Error approving user:", err);
    
    let errorMessage = "Failed to approve user";
    if ((err as { code?: string }).code === '23505') {
      errorMessage = "Email already exists in users table";
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// Admin route to reject pending user
router.delete("/reject-user/:pendingUserId", async (req, res) => {
  console.log("🔵 Rejecting pending user");
  const { pendingUserId } = req.params;
  
  try {
    const result = await pool.query("DELETE FROM pending_users WHERE id = $1", [pendingUserId]);
    
    if (result.rowCount === 0) {
      console.log("❌ Pending user not found");
      return res.status(404).json({ message: "Pending user not found" });
    }
    
    console.log("✅ Pending user rejected and removed");
    res.json({ message: "Pending user rejected and removed" });
    
  } catch (err) {
    console.error("❌ Error rejecting user:", err);
    res.status(500).json({ message: "Failed to reject user" });
  }
});

// Admin route to create admin accounts directly
router.post("/create-admin", async (req, res) => {
  console.log("🔵 Creating admin account");
  console.log("📝 Request body:", { ...req.body, password: "***" });

  const { name, email, phone, department, password } = req.body;

  if (!name || !email || !phone || !department || !password) {
    console.log("❌ Validation failed: Missing required fields");
    return res.status(400).json({ 
      message: "All fields are required (name, email, phone, department, password)" 
    });
  }

  try {
    console.log("🔍 Checking if admin email already exists...");
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userExists.rows.length > 0) {
      console.log("❌ Admin email already exists");
      return res.status(400).json({ message: "Email already registered" });
    }

    console.log("🔒 Hashing admin password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("💾 Creating admin account...");
    const result = await pool.query(
      "INSERT INTO users (name, email, phone, department, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, department, role, created_at", 
      [name, email, phone, department, hashedPassword, 'admin']
    );

    console.log("✅ Admin account created successfully");

    res.status(201).json({ 
      message: "Admin account created successfully",
      admin: result.rows[0]
    });
    
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    
    let errorMessage = "Failed to create admin account";
    if ((err as { code?: string }).code === '23505') {
      errorMessage = "Email already exists";
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

export default router;