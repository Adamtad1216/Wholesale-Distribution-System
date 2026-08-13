import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';
import { env } from './utils/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, closing server gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
      process.exit(0);
    } catch (error) {
      logger.error({ error: error.message }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;