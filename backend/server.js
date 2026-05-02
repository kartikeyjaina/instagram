import { createApp } from './src/app.js';
import { connectToDatabase } from './src/config/db.config.js';
import { env } from './src/config/env.config.js';

const start = async () => {
  await connectToDatabase(env.MONGO_URI);
  const { httpServer } = createApp();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
