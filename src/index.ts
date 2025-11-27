import app from "./app";
import { env } from "./env";
import { logger } from "./logger";

logger.info("Starting server...");
logger.info(`PORT: ${env.PORT}`);
logger.info(`REDIS_REST_URL: ${env.UPSTASH_REDIS_REST_URL}`);

const port = env.PORT;

export default {
  port,
  fetch: app.fetch,
};
