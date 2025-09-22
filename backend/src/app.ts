// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/", (_, res) => res.send("Server is up ✅"));

// mount auth routes
app.use("/api/auth", authRoutes);

export default app;
