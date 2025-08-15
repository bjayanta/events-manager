import express, { Application, NextFunction, Request, Response } from "express";
import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: string | number = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI: string =
  process.env.MONGODB_URI || "mongodb://localhost:27017/eventsDB";

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err: Error) => console.error("MongoDB connection error:", err));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
