import "./utils/response-extend";   // keep for Response.sendError() runtime definition
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";
import { db } from "./db/client";
import userRouter from "./routes/user.routes";
import teamRouter from "./routes/team.routes";
import clockRouter from "./routes/clock.routes";
import reportRouter from "./routes/report.routes";
import passwordRouter from "./routes/password.route";
import leavePeriodsRouter from "./routes/leave_period.route";
import { transporter } from "./services/mail.service";
// import nocache from "nocache";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const ALLOWED_ORIGINS = [process.env.WEBSITE_URL, process.env.ADMIN_WEBSITE_URL].filter((it) => it);

const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin || ALLOWED_ORIGINS.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin \"${requestOrigin}\" not allowed`));
    }
  },
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// prevent default caching mechanism
// app.set('etag', false)
// app.use(['/user', '/user/login'], nocache())

// Routers
app.use(userRouter);
app.use(teamRouter);
app.use(clockRouter);
app.use(reportRouter);
app.use(passwordRouter);
app.use(leavePeriodsRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// JSON swagger
app.use("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Test Route for DB connection + Mail transporter
app.get("/health", async (req: Request, res: Response) => {
  let database_ok = false;

  try { await db.execute("SELECT 1"); database_ok = true; }
  catch (err) { console.log(err); }

  let mail_ok = transporter != undefined;

  res.status(database_ok && mail_ok ? 200 : 500).json({
    database: database_ok ? "connected" : "disconnected",
    mail: mail_ok ? "available" : "not available"
  })
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
