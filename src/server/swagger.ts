import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PySync Real Estate API',
      version: '1.0.0',
      description: 'API documentation for the PySync Real Estate Management System',
      contact: {
        name: 'Developer',
        email: 'support@pysync.local',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            builderName: { type: 'string' },
            projectType: { type: 'string' },
            type: { type: 'string' },
            configuration: { type: 'string' },
            possessionStatus: { type: 'string' },
            price: { type: 'number' },
            location: { type: 'string' },
            area: { type: 'string' },
            bathrooms: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ResaleProperty: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            societyName: { type: 'string' },
            location: { type: 'string' },
            builderName: { type: 'string' },
            propertyType: { type: 'string' },
            price: { type: 'number' },
            bhk: { type: 'string' },
            sizeSqft: { type: 'number' },
            status: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            username: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./server.ts', './src/server/controllers/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('Swagger documentation available at http://localhost:3000/api-docs');
};
