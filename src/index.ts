import { setupApplication } from "./composition-root";
import { loadAndValidateConfig } from "./configs/config-loader";

async function bootstrap() {
  console.log("Bootstrapping application...");

  try {
    const config = loadAndValidateConfig();
    const monitor = setupApplication(config);

    await monitor.run();

    console.log("Application run finished successfully.");
  } catch (error) {
    console.error("Application failed during setup or run:", error);
    process.exit(1);
  }
}

console.log("Starting application...");
bootstrap();
