import express from "express";
import cors from "cors";
import env from "./config/env.config.js";
import apiRoutes from "./routes/index.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Kodnexus Smart Invoice API is running" });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
