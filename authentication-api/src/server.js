
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import connectDB from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api", authRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();