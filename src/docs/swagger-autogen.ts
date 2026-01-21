import swaggerAutogen from "swagger-autogen";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import env from "../configs/variables";

const doc = {
  info: {
    title: env.APP_NAME,
    description: "API for " + env.APP_NAME,
    version: "1.0.0",
  },
  host: env.BACKEND_IP + ":" + env.PORT,
  schemes: ["http"],
  basePath: "/api/v1",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter your bearer token in the format 'Bearer <token>'",
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = path.resolve(__dirname, "swagger.json");
const endpointsPath = path.resolve(__dirname, "../modules/routes/v1/index.ts");
const endpointsFiles = [endpointsPath.replace(/\\/g, "/")];

console.log("📍 Output file:", outputFile);
console.log("📍 Endpoints files:", endpointsFiles);

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(() => {
    try {
      if (!fs.existsSync(outputFile)) {
        throw new Error(`Swagger file not generated at ${outputFile}`);
      }

      const swaggerContent = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

      console.log("🔍 Paths found:", Object.keys(swaggerContent.paths || {}));
      console.log(
        "🔍 Total paths:",
        Object.keys(swaggerContent.paths || {}).length,
      );

      for (const pathKey in swaggerContent.paths) {
        const normalizedPath = pathKey.replace(/\\/g, "/");
        const segments = normalizedPath.split("/").filter(Boolean);

        if (segments.length > 0) {
          let tag = segments[0];

          if (tag.toLowerCase() === "api" && segments.length > 1) {
            tag = segments[1];
          }
          if (tag.toLowerCase().match(/^v\d+$/) && segments.length > 2) {
            tag = segments[2];
          }

          tag = tag
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          for (const method in swaggerContent.paths[pathKey]) {
            const operation = swaggerContent.paths[pathKey][method];

            if (!operation.tags) {
              operation.tags = [];
            }

            if (!operation.tags.includes(tag)) {
              operation.tags.push(tag);
            }
          }
        }
      }

      fs.writeFileSync(
        outputFile,
        JSON.stringify(swaggerContent, null, 2),
        "utf-8",
      );
      console.log("✅ Swagger generated and categorized successfully.");
      console.log(`📄 Output: ${outputFile}`);

      const pathCount = Object.keys(swaggerContent.paths || {}).length;
      if (pathCount === 0) {
        console.warn("⚠️  WARNING: No paths were found!");
        console.warn("This might be a Windows path resolution issue.");
      }
    } catch (error) {
      console.error("❌ Error post-processing swagger output:", error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Error generating swagger:", error);
    process.exit(1);
  });
