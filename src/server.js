import app from "./app.js";
import env from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import logger from "./utils/logger.js";

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
