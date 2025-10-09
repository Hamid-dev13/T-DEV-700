import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { db } from "./db/client";
import userRouter from "./routes/user.routes";
import teamRouter from "./routes/team.routes";
import clockRouter from "./routes/clock.routes";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // L'URL admin
  credentials: true, // Permet l'envoi de cookies
}));
app.use(express.json());

// Routers
app.use(userRouter);
app.use(teamRouter);
app.use(clockRouter);

// Route hello world
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

// Route de test de la connexion DB
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Test simple de connexion
    await db.execute("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", database: "disconnected", error: error });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
