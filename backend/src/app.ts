// index.ts (or app.ts)
import express from "express";
import path from "path";
import authRoutes from "./routes/authRoutes.js"; // Adjust path as needed

const app = express();

// Middleware
app.use(express.json());

// Serve API routes
app.use("/api", authRoutes); // Mount authRoutes at /api

// Serve static files (e.g., React build)
app.use(express.static(path.join(__dirname, "public"))); // Adjust path to your build folder

// Catch-all route for SPA (must come AFTER API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Adjust path as needed
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});