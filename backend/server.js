import http from "http";
import { createApp } from "./src/app.js";
import { connectToDatabase } from "./src/config/db.config.js";
import { env } from "./src/config/env.config.js";
import { initializeSocket } from "./src/socket/index.js";

const start = async () => {
  await connectToDatabase(env.MONGO_URI);

  const app = createApp();
  const httpServer = http.createServer(app);

  initializeSocket(httpServer, app);

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
