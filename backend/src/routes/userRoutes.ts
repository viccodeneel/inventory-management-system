import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = (multer as any)({
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(
      `SELECT id, name, generated_email, requested_role, profile_picture, notification_Preferences, theme, language
       FROM approved_users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update user profile
router.put('/update', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user.id;
    const { name, current_password, new_password, profile_picture, notification_Preferences, theme, language } = req.body;

    await client.query('BEGIN');

    // Verify user exists
    const userResult = await client.query(
      `SELECT generated_password FROM approved_users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password if provided
    let passwordUpdate = '';
    const queryParams = [name, profile_picture, notification_Preferences, theme, language, userId];

    if (new_password) {
      if (!current_password) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      const isMatch = await bcrypt.compare(current_password, userResult.rows[0].generated_password);
      if (!isMatch) {
        await client.query('ROLLBACK');
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      passwordUpdate = ', generated_password = $7';
      queryParams.push(hashedPassword);
    }

    // Update user data
    await client.query(
      `UPDATE approved_users
       SET name = $1,
           profile_picture = $2,
           notification_Preferences = $3,
           theme = $4,
           language = $5
           ${passwordUpdate}
       WHERE id = $6`,
      queryParams
    );

    await client.query('COMMIT');
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    client.release();
  }
});

// Upload profile picture
router.post('/upload-picture', authenticateToken, upload.single('picture'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
res.json({ url: fileUrl });

  } catch (err) {
    console.error('Error uploading picture:', err);
    res.status(500).json({ error: 'Failed to upload picture' });
  }
});

export default router;