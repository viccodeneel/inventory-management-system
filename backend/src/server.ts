import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import createEquipmentRequestsRoutes from './routes/equipmentRequestsRoutes.js';

dotenv.config(); // This must be at the top!

const app = express();


app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api", createEquipmentRequestsRoutes());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔧 JWT_SECRET is ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
});