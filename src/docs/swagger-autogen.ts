import swaggerAutogen from "swagger-autogen";
import path from "path";

const doc = {
  info: {
    title: "Live Notary API",
    description: "API for Live Notary",
  },
  host: "localhost:3000",
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
const endpointsFiles = ["../modules/routes/v1/index.ts"];

swaggerAutogen({
  openapi: "3.0.0",
})(outputFile, endpointsFiles, doc);
