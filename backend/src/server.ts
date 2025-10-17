import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import createEquipmentRequestsRoutes from './routes/equipmentRequestsRoutes.js';
import checkoutRoutes from "./routes/checkoutRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userAdminRoutes from "./routes/userAdminRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // This must be at the top!

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
// Using process.cwd() to get the project root directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/equipment/requests", createEquipmentRequestsRoutes());
app.use("/api/checkout", checkoutRoutes);
app.use("/api/users/admin", userAdminRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔧 JWT_SECRET is ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
});