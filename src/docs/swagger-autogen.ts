import swaggerAutogen from "swagger-autogen";
import path from "path";
import fs from "fs";
import env from "../configs/variables";

const doc = {
  info: {
    title: env.APP_NAME,
    description: "API for " + env.APP_NAME,
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
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = path.join(__dirname, "swagger.json");
const endpointsFiles = [path.join(__dirname, "../modules/routes/v1/index.ts")];

swaggerAutogen({
  openapi: "3.0.0",
})(outputFile, endpointsFiles, doc).then(() => {
  try {
    const swaggerContent = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    for (const pathKey in swaggerContent.paths) {
      // Normalize path separators to forward slashes
      const normalizedPath = pathKey.replace(/\\/g, "/");
      const segments = normalizedPath.split("/").filter(Boolean);

      if (segments.length > 0) {
        let tag = segments[0];
        // Capitalize and format tag
        tag = tag.charAt(0).toUpperCase() + tag.slice(1);

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

    fs.writeFileSync(outputFile, JSON.stringify(swaggerContent, null, 2));
    console.log("Swagger generated and categorized successfully.");
  } catch (error) {
    console.error("Error post-processing swagger output:", error);
  }
});
