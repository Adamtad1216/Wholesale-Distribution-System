import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../utils/env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wholesale Distribution System API',
      version: '1.0.0',
      description: 'API documentation for the Wholesale Distribution System',
      contact: {
        name: 'Development Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Sales Requests', description: 'Sales request operations' },
      { name: 'Quotations', description: 'Quotation management' },
      { name: 'Sales Orders', description: 'Sales order operations' },
      { name: 'Sales Returns', description: 'Sales return operations' },
      { name: 'Vehicles', description: 'Vehicle management' },
      { name: 'Deliveries', description: 'Delivery operations' },
      { name: 'Delivery Proof', description: 'Delivery proof management' },
      { name: 'Notifications', description: 'Notification operations' },
      { name: 'Reporting', description: 'Reporting and analytics' },
      { name: 'AI', description: 'AI assistant and recommendations' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Error message' },
          },
          required: ['status', 'message'],
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          required: ['status', 'message', 'errors'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {},
          },
          required: ['status', 'data'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
          required: ['page', 'limit', 'total', 'totalPages'],
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'array',
              items: {},
            },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
          required: ['status', 'data', 'meta'],
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            isActive: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            person: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string' },
                middleName: { type: 'string', nullable: true },
                lastName: { type: 'string' },
                phone: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email', nullable: true },
              },
            },
            userRoles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      permissions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            module: { type: 'string' },
                            action: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.js'],
};

export const specs = swaggerJsdoc(swaggerOptions);
