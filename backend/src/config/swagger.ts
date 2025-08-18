import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM AUGU API Documentation',
      version: '1.0.0',
      description: `
# CRM AUGU REST API

Enterprise-grade CRM platform for HRD business management, featuring comprehensive customer lifecycle management, sales pipeline automation, and project execution tracking.

## Authentication

All API endpoints (except auth endpoints) require authentication using JWT Bearer tokens.

### Getting a Token
1. Login via \`POST /api/auth/login\` with email and password
2. Receive access token (15 min) and refresh token (7 days)
3. Include token in Authorization header: \`Bearer {token}\`

### Token Refresh
When access token expires, use \`POST /api/auth/refresh\` with refresh token to get new access token.

## Rate Limiting

Different endpoints have different rate limits:
- **Auth endpoints**: 5 requests per 15 minutes
- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute
- **Heavy analytics**: 10 requests per 5 minutes
- **Write operations**: 10 requests per minute

## Response Format

All responses follow this format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-19T10:30:00Z",
    "requestId": "uuid"
  }
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`

## Pagination

List endpoints support pagination:
- \`page\`: Page number (default: 1)
- \`size\`: Items per page (default: 20, max: 100)
- \`sort\`: Sort field and direction (e.g., \`createdAt:desc\`)

## Roles

Three user roles with different permissions:
- **ADMIN**: Full system access
- **MANAGER**: Department/team management
- **OPERATOR**: Basic operations
      `,
      contact: {
        name: 'CRM AUGU Support',
        email: 'support@crm-augu.com',
        url: 'https://crm-augu.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://crm-augu.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.crm-augu.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                requestId: {
                  type: 'string',
                  format: 'uuid',
                },
              },
            },
          },
        },
        PaginationParams: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number',
            },
            size: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Items per page',
            },
            sort: {
              type: 'string',
              example: 'createdAt:desc',
              description: 'Sort field and direction',
            },
          },
        },
        Company: {
          type: 'object',
          required: ['name', 'industry'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            name: {
              type: 'string',
              example: 'Acme Corporation',
            },
            industry: {
              type: 'string',
              example: 'Technology',
            },
            size: {
              type: 'string',
              enum: ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
              example: 'MEDIUM',
            },
            website: {
              type: 'string',
              format: 'uri',
              example: 'https://acme.com',
            },
            taxId: {
              type: 'string',
              example: '123-45-6789',
            },
            annualRevenue: {
              type: 'number',
              example: 5000000,
            },
            employeeCount: {
              type: 'integer',
              example: 250,
            },
            branches: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CompanyBranch',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
          },
        },
        CompanyBranch: {
          type: 'object',
          required: ['name', 'address', 'city', 'country'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            name: {
              type: 'string',
              example: 'Main Office',
            },
            address: {
              type: 'string',
              example: '123 Business St',
            },
            city: {
              type: 'string',
              example: 'Seoul',
            },
            state: {
              type: 'string',
              example: 'Seoul',
            },
            country: {
              type: 'string',
              example: 'South Korea',
            },
            postalCode: {
              type: 'string',
              example: '06234',
            },
            phone: {
              type: 'string',
              example: '+82-2-1234-5678',
            },
            isHeadquarters: {
              type: 'boolean',
              default: false,
            },
          },
        },
        Lead: {
          type: 'object',
          required: ['companyId', 'title', 'source', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            companyId: {
              type: 'string',
              format: 'uuid',
            },
            contactId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Enterprise CRM Solution',
            },
            source: {
              type: 'string',
              enum: ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL', 'SOCIAL_MEDIA', 'TRADE_SHOW', 'OTHER'],
              example: 'WEBSITE',
            },
            status: {
              type: 'string',
              enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'],
              example: 'NEW',
            },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              example: 75,
            },
            estimatedValue: {
              type: 'number',
              example: 100000,
            },
            description: {
              type: 'string',
              example: 'Looking for comprehensive CRM solution',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
            },
            convertedToOpportunityId: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            convertedAt: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
          },
        },
        Opportunity: {
          type: 'object',
          required: ['name', 'companyId', 'stage', 'amount'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            name: {
              type: 'string',
              example: 'Enterprise CRM Implementation',
            },
            companyId: {
              type: 'string',
              format: 'uuid',
            },
            contactId: {
              type: 'string',
              format: 'uuid',
            },
            stage: {
              type: 'string',
              enum: ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'],
              example: 'PROPOSAL',
            },
            amount: {
              type: 'number',
              example: 120000,
            },
            probability: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              example: 60,
            },
            expectedCloseDate: {
              type: 'string',
              format: 'date',
              example: '2024-03-31',
            },
            actualCloseDate: {
              type: 'string',
              format: 'date',
              readOnly: true,
            },
            lossReason: {
              type: 'string',
              example: 'Budget constraints',
            },
            nextAction: {
              type: 'string',
              example: 'Send formal proposal',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        Proposal: {
          type: 'object',
          required: ['opportunityId', 'title', 'validUntil'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            proposalNumber: {
              type: 'string',
              readOnly: true,
              example: 'PRO-2024-0001',
            },
            opportunityId: {
              type: 'string',
              format: 'uuid',
            },
            templateId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Enterprise CRM Solution Proposal',
            },
            version: {
              type: 'integer',
              readOnly: true,
              example: 1,
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
              example: 'DRAFT',
              readOnly: true,
            },
            validUntil: {
              type: 'string',
              format: 'date',
              example: '2024-12-31',
            },
            subtotal: {
              type: 'number',
              readOnly: true,
              example: 85000,
            },
            totalDiscount: {
              type: 'number',
              readOnly: true,
              example: 5500,
            },
            totalTax: {
              type: 'number',
              readOnly: true,
              example: 7950,
            },
            total: {
              type: 'number',
              readOnly: true,
              example: 87450,
            },
            terms: {
              type: 'string',
              example: 'Net 30 days',
            },
            paymentTerms: {
              type: 'string',
              example: '50% upfront, 50% on completion',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProposalItem',
              },
            },
          },
        },
        ProposalItem: {
          type: 'object',
          required: ['description', 'quantity', 'unitPrice'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            description: {
              type: 'string',
              example: 'CRM Software License (100 users)',
            },
            quantity: {
              type: 'number',
              minimum: 0,
              example: 100,
            },
            unitPrice: {
              type: 'number',
              minimum: 0,
              example: 500,
            },
            discountPercent: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 10,
            },
            taxPercent: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 10,
            },
            lineTotal: {
              type: 'number',
              readOnly: true,
              example: 45000,
            },
          },
        },
        Task: {
          type: 'object',
          required: ['title', 'type', 'priority', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
            },
            title: {
              type: 'string',
              example: 'Prepare quarterly report',
            },
            description: {
              type: 'string',
              example: 'Compile and analyze Q4 sales data',
            },
            type: {
              type: 'string',
              enum: ['TASK', 'MILESTONE', 'DELIVERABLE'],
              example: 'TASK',
            },
            priority: {
              type: 'string',
              enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
              example: 'HIGH',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'],
              example: 'TODO',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
            },
            parentTaskId: {
              type: 'string',
              format: 'uuid',
            },
            isRecurring: {
              type: 'boolean',
              default: false,
            },
            recurrencePattern: {
              type: 'string',
              enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
              example: 'WEEKLY',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Validation error: Invalid email format',
                code: 'VALIDATION_ERROR',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Companies',
        description: 'Customer company management',
      },
      {
        name: 'Leads',
        description: 'Lead tracking and conversion',
      },
      {
        name: 'Opportunities',
        description: 'Sales opportunity management',
      },
      {
        name: 'Proposals',
        description: 'Proposal creation and approval',
      },
      {
        name: 'Tasks',
        description: 'Task and activity management',
      },
      {
        name: 'Sales Pipeline',
        description: 'Pipeline analytics and metrics',
      },
      {
        name: 'Dashboard',
        description: 'Dashboard widgets and KPIs',
      },
      {
        name: 'Reports',
        description: 'Report generation and scheduling',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;