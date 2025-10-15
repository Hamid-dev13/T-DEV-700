import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";
import { db } from "./db/client";
import userRouter from "./routes/user.routes";
import teamRouter from "./routes/team.routes";
import clockRouter from "./routes/clock.routes";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.WEBSITE_URL!,
  credentials: true,
}));
app.use(express.json());
// 1) Désactive l'ETag par défaut d'Express
app.set('etag', false)

// 2) No-cache sur les endpoints sensibles (session, login, logout, data protégées)
const noCache = (req:Request, res:Response, next:NextFunction) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Vary': 'Cookie'  // ⚠️ crucial si tu dépends des cookies
  })
  next()
}

app.use(['/user', '/me', '/user/login', '/user/logout', '/auth/login', '/auth/logout'], noCache)

// Routers
app.use(userRouter);
app.use(teamRouter);
app.use(clockRouter);

// Route hello world
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// JSON de la spec OpenAPI (optionnel, pour télécharger la spec)
app.use("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
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
