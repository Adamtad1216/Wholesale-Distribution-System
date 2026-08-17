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
      { name: 'Authentication', description: 'Customer registration, login, and token management' },
      { name: 'Customers', description: 'Customer management (PERSON and ORGANIZATION)' },
      { name: 'Users', description: 'User management by administrators' },
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
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
          required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
        },
        CustomerSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerCode: { type: 'string' },
            customerType: { type: 'string', enum: ['PERSON', 'ORGANIZATION'] },
            creditLimit: { type: 'number' },
            status: { type: 'string' },
            person: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string' },
                middleName: { type: 'string', nullable: true },
                lastName: { type: 'string' },
                phone: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email', nullable: true },
              },
            },
            organization: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                phone: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email', nullable: true },
              },
            },
            paymentTerms: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                days: { type: 'integer' },
              },
            },
            salesRep: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                employee: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    person: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CustomerDetail: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerCode: { type: 'string' },
            customerType: { type: 'string', enum: ['PERSON', 'ORGANIZATION'] },
            creditLimit: { type: 'number' },
            status: { type: 'string' },
            person: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string' },
                middleName: { type: 'string', nullable: true },
                lastName: { type: 'string' },
                phone: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email', nullable: true },
                address: { type: 'string', nullable: true },
                status: { type: 'string' },
              },
            },
            organization: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                registrationNumber: { type: 'string', nullable: true },
                taxNumber: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email', nullable: true },
                address: { type: 'string', nullable: true },
                status: { type: 'string' },
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      firstName: { type: 'string' },
                      middleName: { type: 'string', nullable: true },
                      lastName: { type: 'string' },
                      phone: { type: 'string', nullable: true },
                      email: { type: 'string', format: 'email', nullable: true },
                      position: { type: 'string', nullable: true },
                      isPrimary: { type: 'boolean' },
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
                    },
                  },
                },
              },
            },
            paymentTerms: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                days: { type: 'integer' },
                description: { type: 'string', nullable: true },
              },
            },
            salesRep: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                territory: { type: 'string', nullable: true },
                employee: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    employeeCode: { type: 'string' },
                    department: { type: 'string', nullable: true },
                    jobTitle: { type: 'string', nullable: true },
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
                  },
                },
              },
            },
            createdBy: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                person: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                  },
                },
              },
            },
            updatedBy: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                person: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerSummary' },
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
        PersonCustomerRequest: {
          type: 'object',
          required: ['customerType', 'person'],
          properties: {
            customerType: { type: 'string', enum: ['PERSON'] },
            customerCode: { type: 'string', example: 'CUS-ABC123' },
            creditLimit: { type: 'number', example: 5000 },
            paymentTermsId: { type: 'string', format: 'uuid' },
            assignedSalesRepId: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'ACTIVE' },
            person: {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { type: 'string', example: 'John' },
                middleName: { type: 'string', example: 'M' },
                lastName: { type: 'string', example: 'Doe' },
                phone: { type: 'string', example: '+251911111111' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
              },
            },
          },
        },
        OrganizationCustomerRequest: {
          type: 'object',
          required: ['customerType', 'organization'],
          properties: {
            customerType: { type: 'string', enum: ['ORGANIZATION'] },
            customerCode: { type: 'string', example: 'CUS-XYZ789' },
            creditLimit: { type: 'number', example: 10000 },
            paymentTermsId: { type: 'string', format: 'uuid' },
            assignedSalesRepId: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'ACTIVE' },
            username: { type: 'string', example: 'acme_admin' },
            password: { type: 'string', example: 'Acme@123!' },
            organization: {
              type: 'object',
              required: ['name', 'contacts'],
              properties: {
                name: { type: 'string', example: 'Acme Corporation' },
                registrationNumber: { type: 'string', example: 'REG-12345' },
                taxNumber: { type: 'string', example: 'TAX-67890' },
                phone: { type: 'string', example: '+251922222222' },
                email: { type: 'string', format: 'email', example: 'info@acme.com' },
                address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
                contacts: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['firstName', 'lastName'],
                    properties: {
                      firstName: { type: 'string', example: 'Clone' },
                      middleName: { type: 'string', example: 'M' },
                      lastName: { type: 'string', example: 'Tech' },
                      phone: { type: 'string', example: '+251933333333' },
                      email: { type: 'string', format: 'email', example: 'clone@example.com' },
                      address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
                      position: { type: 'string', example: 'Manager' },
                      isPrimary: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            },
          },
        },
        PersonRegisterRequest: {
          type: 'object',
          required: ['customerType', 'username', 'password', 'firstName', 'lastName'],
          properties: {
            customerType: { type: 'string', enum: ['PERSON'] },
            username: { type: 'string', example: 'john_doe' },
            password: { type: 'string', example: 'John@123!' },
            firstName: { type: 'string', example: 'John' },
            middleName: { type: 'string', example: 'M' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+251911111111' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
          },
        },
        OrganizationRegisterRequest: {
          type: 'object',
          required: ['customerType', 'username', 'password', 'name', 'contacts'],
          properties: {
            customerType: { type: 'string', enum: ['ORGANIZATION'] },
            username: { type: 'string', example: 'acme_admin' },
            password: { type: 'string', example: 'Acme@123!' },
            name: { type: 'string', example: 'Acme Corporation' },
            registrationNumber: { type: 'string', example: 'REG-12345' },
            taxNumber: { type: 'string', example: 'TAX-67890' },
            phone: { type: 'string', example: '+251922222222' },
            email: { type: 'string', format: 'email', example: 'info@acme.com' },
            address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
            contacts: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['firstName', 'lastName'],
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  middleName: { type: 'string', example: 'M' },
                  lastName: { type: 'string', example: 'Smith' },
                  phone: { type: 'string', example: '+251933333333' },
                  email: { type: 'string', format: 'email', example: 'jane@acme.com' },
                  address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
                  position: { type: 'string', example: 'Manager' },
                  isPrimary: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        CustomerRegistrationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                customer: { $ref: '#/components/schemas/CustomerDetail' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string', example: 'abc123def456...' },
            password: {
              type: 'string',
              example: 'John@1234!',
              description: 'Must contain uppercase, lowercase, number, and special character',
            },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'Admin@123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
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
