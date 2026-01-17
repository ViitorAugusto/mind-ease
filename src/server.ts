import { buildApp } from "./app";
import { config } from "./shared/config";
import prisma from "./shared/db/prisma";

async function start() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected");

    const fastify = await buildApp();

    await fastify.listen({
      port: config.port,
      host: "0.0.0.0",
    });

    console.log(`✓ Server listening on port ${config.port}`);
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

start();
