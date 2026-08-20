const swaggerJSDoc = require("swagger-jsdoc");
const { APP_URL } = require("./config/env");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NicheLink Backend API",
      version: "1.0.0",
      description: "Production-ready API documentation for the NicheLink backend.",
    },
    servers: [
      {
        url: APP_URL,
        description: "Primary application server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            details: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            token: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            uptime: { type: "number" },
            version: { type: "string" },
            memory: {
              type: "object",
              properties: {
                rss: { type: "number" },
                heapTotal: { type: "number" },
                heapUsed: { type: "number" },
                external: { type: "number" },
              },
            },
            database: {
              type: "object",
              properties: {
                status: { type: "string" },
              },
            },
          },
        },
      },
      parameters: {
        pageParam: {
          name: "page",
          in: "query",
          description: "Page number for pagination",
          schema: { type: "integer", default: 1 },
        },
        limitParam: {
          name: "limit",
          in: "query",
          description: "Page size for pagination",
          schema: { type: "integer", default: 20 },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication and session management" },
      { name: "Users", description: "User profile and account endpoints" },
      { name: "Communities", description: "Community membership and management" },
      { name: "Posts", description: "Post creation, likes, and feeds" },
      { name: "Messaging", description: "Conversations and messaging" },
      { name: "Notifications", description: "User notification APIs" },
      { name: "Jobs", description: "Job board operations" },
      { name: "Projects", description: "Project and task management" },
      { name: "Search", description: "Search and suggestions" },
      { name: "Uploads", description: "File and media upload endpoints" },
      { name: "Email", description: "Email OTP and preferences" },
      { name: "Health", description: "Application health and readiness" },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["name", "username", "email", "password"],
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate a user and return tokens",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            200: { description: "Authentication successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Authenticated user retrieved", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, user: { $ref: "#/components/schemas/User" } } } } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Get application health status",
          responses: {
            200: { description: "Health check status", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          },
        },
      },
      "/ready": {
        get: {
          tags: ["Health"],
          summary: "Get application readiness status",
          responses: {
            200: { description: "Readiness status", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          },
        },
      },
      "/live": {
        get: {
          tags: ["Health"],
          summary: "Get application liveness status",
          responses: {
            200: { description: "Liveness status", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJSDoc(options);
