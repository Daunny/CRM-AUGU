# CRM AUGU - API Specification

## 📡 API 개요
- **Base URL**: `https://api.crm-augu.com/v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **API Version**: 1.0.0

---

## 1. API Standards

### 1.1 RESTful Conventions
```
GET    /resources          # List all resources
GET    /resources/:id      # Get specific resource
POST   /resources          # Create new resource
PUT    /resources/:id      # Update entire resource
PATCH  /resources/:id      # Update partial resource
DELETE /resources/:id      # Delete resource
```

### 1.2 Response Format
```typescript
// Success Response
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2025-08-13T10:00:00Z",
    "version": "1.0.0"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-13T10:00:00Z",
    "request_id": "req_abc123"
  }
}

// Paginated Response
{
  "success": true,
  "data": T[],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {...}
}
```

### 1.3 HTTP Status Codes
```typescript
const STATUS_CODES = {
  // Success
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  
  // Client Errors
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  
  // Server Errors
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable"
};
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Endpoints

#### POST /auth/register
```typescript
// Request
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Sales",
  "phone": "010-1234-5678"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SALES_REP",
      "createdAt": "2025-08-13T10:00:00Z"
    }
  }
}
```

#### POST /auth/login
```typescript
// Request
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SALES_REP"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900  // 15 minutes
  }
}
```

#### POST /auth/refresh
```typescript
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /auth/logout
```typescript
// Request
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

// Response (200 OK)
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Customer Management API

### 3.1 Customer Endpoints

#### GET /customers
```typescript
// Query Parameters
{
  page?: number;           // Default: 1
  pageSize?: number;       // Default: 20, Max: 100
  search?: string;         // Search in name, email
  status?: CustomerStatus; // PROSPECT | ACTIVE | INACTIVE | CHURNED
  tier?: CustomerTier;     // VIP | GOLD | SILVER | BRONZE
  industryId?: string;
  accountManagerId?: string;
  sortBy?: string;         // name | createdAt | revenue
  sortOrder?: 'asc' | 'desc';
}

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "cust_abc123",
      "companyName": "삼성전자",
      "businessNumber": "124-81-00998",
      "industry": {
        "id": "ind_tech",
        "name": "Technology"
      },
      "size": "ENTERPRISE",
      "tier": "VIP",
      "accountManager": {
        "id": "usr_def456",
        "name": "김영희"
      },
      "annualRevenue": 500000000,
      "status": "ACTIVE",
      "createdAt": "2025-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 248,
    "totalPages": 13
  }
}
```

#### GET /customers/:id
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "cust_abc123",
    "companyName": "삼성전자",
    "businessNumber": "124-81-00998",
    "representative": "이재용",
    "industry": {
      "id": "ind_tech",
      "name": "Technology"
    },
    "size": "ENTERPRISE",
    "tier": "VIP",
    "type": "B2B",
    "accountManager": {
      "id": "usr_def456",
      "name": "김영희",
      "email": "kim@crm.com"
    },
    "status": "ACTIVE",
    "lifecycleStage": "CUSTOMER",
    "annualRevenue": 500000000,
    "employeeCount": 267000,
    "creditLimit": 1000000000,
    "paymentTerms": 30,
    "address": {
      "street": "삼성로 129",
      "city": "수원시",
      "state": "경기도",
      "postalCode": "16677",
      "country": "대한민국"
    },
    "phone": "031-200-1114",
    "email": "contact@samsung.com",
    "website": "https://www.samsung.com",
    "tags": ["전자", "반도체", "VIP"],
    "customFields": {
      "preferredContact": "email",
      "fiscalYearEnd": "12-31"
    },
    "statistics": {
      "totalProjects": 45,
      "activeProjects": 3,
      "totalRevenue": 2500000000,
      "avgProjectValue": 55555556,
      "lastProjectDate": "2025-07-15",
      "satisfaction": 4.8
    },
    "createdAt": "2025-01-15T09:00:00Z",
    "updatedAt": "2025-08-10T14:30:00Z"
  }
}
```

#### POST /customers
```typescript
// Request
{
  "companyName": "LG전자",
  "businessNumber": "107-86-14075",
  "representative": "조주완",
  "industry": "ind_tech",
  "size": "ENTERPRISE",
  "address": {
    "street": "LG로 222",
    "city": "서울시",
    "state": "서울",
    "postalCode": "07336"
  },
  "phone": "02-3777-1114",
  "email": "contact@lge.com",
  "website": "https://www.lge.co.kr"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "cust_xyz789",
    "companyName": "LG전자",
    // ... full customer object
  }
}
```

#### PUT /customers/:id
```typescript
// Request
{
  "companyName": "LG전자",
  "tier": "GOLD",
  "status": "ACTIVE",
  // ... all fields
}

// Response (200 OK)
{
  "success": true,
  "data": {
    // ... updated customer object
  }
}
```

#### DELETE /customers/:id
```typescript
// Response (204 No Content)
// No body
```

### 3.2 Contact Endpoints

#### GET /customers/:customerId/contacts
```typescript
// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "cont_abc123",
      "customerId": "cust_abc123",
      "firstName": "김",
      "lastName": "철수",
      "email": "kim.cs@samsung.com",
      "phone": "010-1234-5678",
      "mobile": "010-1234-5678",
      "position": "구매팀장",
      "department": "구매팀",
      "isPrimary": true,
      "isActive": true,
      "lastContactedAt": "2025-08-01T10:00:00Z"
    }
  ]
}
```

#### POST /customers/:customerId/contacts
```typescript
// Request
{
  "firstName": "이",
  "lastName": "영희",
  "email": "lee.yh@samsung.com",
  "phone": "010-9876-5432",
  "position": "HR팀장",
  "department": "인사팀",
  "isPrimary": false
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "cont_def456",
    // ... full contact object
  }
}
```

---

## 4. Opportunity Management API

### 4.1 Opportunity Endpoints

#### GET /opportunities
```typescript
// Query Parameters
{
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: OpportunityStage;
  customerId?: string;
  accountManagerId?: string;
  minAmount?: number;
  maxAmount?: number;
  expectedCloseDateFrom?: string;
  expectedCloseDateTo?: string;
  probability?: number;
  sortBy?: 'amount' | 'probability' | 'expectedCloseDate';
}

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "opp_abc123",
      "title": "삼성전자 리더십 교육 프로그램",
      "customer": {
        "id": "cust_abc123",
        "name": "삼성전자"
      },
      "stage": "PROPOSAL",
      "probability": 75,
      "amount": 150000000,
      "expectedAmount": 112500000,
      "expectedCloseDate": "2025-09-30",
      "accountManager": {
        "id": "usr_def456",
        "name": "김영희"
      },
      "daysInStage": 5,
      "totalAge": 30
    }
  ],
  "pagination": {...}
}
```

#### GET /opportunities/:id
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "opp_abc123",
    "title": "삼성전자 리더십 교육 프로그램",
    "description": "임원 대상 리더십 역량 강화 프로그램",
    "type": "NEW_BUSINESS",
    "customer": {
      "id": "cust_abc123",
      "name": "삼성전자",
      "tier": "VIP"
    },
    "contacts": [
      {
        "id": "cont_abc123",
        "name": "김철수",
        "position": "HR팀장",
        "role": "DECISION_MAKER"
      }
    ],
    "stage": "PROPOSAL",
    "stageHistory": [
      {
        "stage": "QUALIFYING",
        "enteredAt": "2025-08-01T09:00:00Z",
        "exitedAt": "2025-08-05T14:00:00Z",
        "duration": 4
      },
      {
        "stage": "NEEDS_ANALYSIS",
        "enteredAt": "2025-08-05T14:00:00Z",
        "exitedAt": "2025-08-12T10:00:00Z",
        "duration": 7
      }
    ],
    "probability": 75,
    "amount": 150000000,
    "expectedAmount": 112500000,
    "expectedCloseDate": "2025-09-30",
    "competitors": [
      {
        "name": "멀티캠퍼스",
        "strengths": ["Price", "Location"],
        "weaknesses": ["Quality", "Experience"]
      }
    ],
    "source": "REFERRAL",
    "campaign": null,
    "teamMembers": [
      {
        "id": "usr_def456",
        "name": "김영희",
        "role": "ACCOUNT_MANAGER"
      },
      {
        "id": "usr_ghi789",
        "name": "박지성",
        "role": "SOLUTION_ARCHITECT"
      }
    ],
    "activities": [
      {
        "id": "act_123",
        "type": "MEETING",
        "subject": "니즈 분석 미팅",
        "date": "2025-08-08T14:00:00Z",
        "outcome": "요구사항 확정"
      }
    ],
    "documents": [
      {
        "id": "doc_456",
        "name": "제안서_v2.pdf",
        "type": "PROPOSAL",
        "uploadedAt": "2025-08-12T16:00:00Z"
      }
    ],
    "createdAt": "2025-08-01T09:00:00Z",
    "updatedAt": "2025-08-13T10:00:00Z"
  }
}
```

#### POST /opportunities
```typescript
// Request
{
  "title": "현대자동차 영업 스킬 교육",
  "description": "영업팀 역량 강화 프로그램",
  "customerId": "cust_def456",
  "contactIds": ["cont_ghi789"],
  "type": "NEW_BUSINESS",
  "amount": 80000000,
  "expectedCloseDate": "2025-10-31",
  "source": "CAMPAIGN"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "opp_xyz789",
    // ... full opportunity object
  }
}
```

#### PATCH /opportunities/:id/stage
```typescript
// Request
{
  "stage": "NEGOTIATION",
  "notes": "가격 협상 진행중"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "opp_abc123",
    "stage": "NEGOTIATION",
    "probability": 90,
    // ... updated opportunity
  }
}
```

### 4.2 Pipeline Analytics

#### GET /opportunities/pipeline
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "stages": [
      {
        "stage": "QUALIFYING",
        "count": 25,
        "value": 500000000,
        "weightedValue": 50000000,
        "opportunities": [...]
      },
      {
        "stage": "NEEDS_ANALYSIS",
        "count": 15,
        "value": 350000000,
        "weightedValue": 87500000,
        "opportunities": [...]
      }
    ],
    "summary": {
      "totalCount": 55,
      "totalValue": 1250000000,
      "totalWeightedValue": 687500000,
      "avgDealSize": 22727272,
      "avgProbability": 55
    },
    "conversion": {
      "QUALIFYING_to_NEEDS": 0.75,
      "NEEDS_to_PROPOSAL": 0.65,
      "PROPOSAL_to_NEGOTIATION": 0.55,
      "NEGOTIATION_to_WON": 0.85,
      "overall": 0.32
    }
  }
}
```

---

## 5. Project Management API

### 5.1 Project Endpoints

#### GET /projects
```typescript
// Query Parameters
{
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;  // PLANNING | IN_PROGRESS | ON_HOLD | COMPLETED
  customerId?: string;
  pmId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "proj_abc123",
      "code": "PRJ-2025-001",
      "name": "삼성전자 리더십 교육",
      "customer": {
        "id": "cust_abc123",
        "name": "삼성전자"
      },
      "status": "IN_PROGRESS",
      "progress": 45,
      "health": "GREEN",
      "startDate": "2025-09-01",
      "endDate": "2025-09-30",
      "budget": 150000000,
      "actualCost": 67500000,
      "pm": {
        "id": "usr_abc123",
        "name": "이민호"
      }
    }
  ],
  "pagination": {...}
}
```

#### GET /projects/:id
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "code": "PRJ-2025-001",
    "name": "삼성전자 리더십 교육",
    "description": "임원 리더십 역량 강화",
    "type": "LEADERSHIP",
    "customer": {
      "id": "cust_abc123",
      "name": "삼성전자"
    },
    "contract": {
      "id": "cont_abc123",
      "number": "CTR-2025-001",
      "value": 150000000
    },
    "schedule": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-30",
      "actualStartDate": "2025-09-01",
      "duration": 30,
      "workingDays": 22
    },
    "financial": {
      "budget": 150000000,
      "actualCost": 67500000,
      "revenue": 150000000,
      "margin": 82500000,
      "marginPercent": 55,
      "invoiced": 75000000,
      "paid": 0
    },
    "status": "IN_PROGRESS",
    "phase": "EXECUTION",
    "progress": 45,
    "health": "GREEN",
    "team": [
      {
        "id": "usr_abc123",
        "name": "이민호",
        "role": "PROJECT_MANAGER",
        "allocation": 100
      },
      {
        "id": "usr_def456",
        "name": "김영희",
        "role": "ACCOUNT_MANAGER",
        "allocation": 30
      }
    ],
    "instructors": [
      {
        "id": "inst_abc123",
        "name": "박교수",
        "sessions": 5,
        "dates": ["2025-09-05", "2025-09-10"],
        "status": "CONFIRMED"
      }
    ],
    "milestones": [
      {
        "id": "ms_001",
        "name": "킥오프 미팅",
        "date": "2025-09-01",
        "status": "COMPLETED"
      },
      {
        "id": "ms_002",
        "name": "1차 교육",
        "date": "2025-09-10",
        "status": "IN_PROGRESS"
      }
    ],
    "deliverables": [
      {
        "id": "del_001",
        "name": "교육 교재",
        "type": "DOCUMENT",
        "status": "DELIVERED",
        "deliveredAt": "2025-09-01"
      }
    ],
    "risks": [
      {
        "id": "risk_001",
        "description": "강사 일정 변경 가능성",
        "probability": "MEDIUM",
        "impact": "HIGH",
        "mitigation": "대체 강사 확보",
        "status": "MONITORING"
      }
    ],
    "metrics": {
      "spi": 0.95,  // Schedule Performance Index
      "cpi": 1.10,  // Cost Performance Index
      "eac": 136363636,  // Estimate at Completion
      "etc": 68863636,   // Estimate to Complete
      "vac": 13636364    // Variance at Completion
    },
    "createdAt": "2025-08-15T09:00:00Z",
    "updatedAt": "2025-08-13T10:00:00Z"
  }
}
```

#### POST /projects
```typescript
// Request
{
  "name": "현대자동차 영업 교육",
  "code": "PRJ-2025-002",
  "customerId": "cust_def456",
  "contractId": "cont_def456",
  "type": "SALES",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "budget": 80000000,
  "pmId": "usr_ghi789"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "proj_xyz789",
    // ... full project object
  }
}
```

### 5.2 Resource Management

#### GET /projects/:id/resources
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "team": [
      {
        "id": "usr_abc123",
        "name": "이민호",
        "role": "PROJECT_MANAGER",
        "allocation": 100,
        "startDate": "2025-09-01",
        "endDate": "2025-09-30",
        "totalHours": 176,
        "actualHours": 80
      }
    ],
    "instructors": [
      {
        "id": "inst_abc123",
        "name": "박교수",
        "specialty": ["Leadership", "Communication"],
        "sessions": [
          {
            "date": "2025-09-05",
            "time": "09:00-18:00",
            "topic": "리더십 기초",
            "location": "삼성 연수원",
            "status": "CONFIRMED"
          }
        ],
        "totalHours": 40,
        "rate": 500000,
        "totalCost": 20000000
      }
    ],
    "utilization": {
      "planned": 85,
      "actual": 78,
      "variance": -7
    }
  }
}
```

#### POST /projects/:id/resources/assign
```typescript
// Request
{
  "type": "INSTRUCTOR",
  "resourceId": "inst_def456",
  "sessions": [
    {
      "date": "2025-09-15",
      "time": "09:00-18:00",
      "topic": "팀 빌딩"
    }
  ]
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "assignment": {
      "id": "asn_abc123",
      "resourceId": "inst_def456",
      "confirmed": false,
      "sessions": [...]
    }
  }
}
```

---

## 6. Meeting Management API

### 6.1 Meeting Endpoints

#### GET /meetings
```typescript
// Query Parameters
{
  page?: number;
  pageSize?: number;
  target?: 'CUSTOMER' | 'INTERNAL';
  type?: MeetingType;
  customerId?: string;
  projectId?: string;
  organizerId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasFollowUp?: boolean;
  sortBy?: 'date' | 'importance' | 'roi';
}

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "meet_abc123",
      "title": "삼성전자 리더십 교육 제안 미팅",
      "target": "CUSTOMER",
      "type": "PROPOSAL",
      "customer": {
        "id": "cust_abc123",
        "name": "삼성전자"
      },
      "date": "2025-08-20T14:00:00Z",
      "duration": 90,
      "location": "삼성전자 본사",
      "organizer": {
        "id": "usr_def456",
        "name": "김영희"
      },
      "status": "SCHEDULED",
      "importance": "HIGH",
      "hasMinutes": false,
      "hasFollowUp": true
    }
  ],
  "pagination": {...}
}
```

#### GET /meetings/:id
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "meet_abc123",
    "title": "삼성전자 리더십 교육 제안 미팅",
    "target": "CUSTOMER",
    "type": "PROPOSAL",
    "customer": {
      "id": "cust_abc123",
      "name": "삼성전자",
      "contacts": [
        {
          "id": "cont_abc123",
          "name": "김철수",
          "position": "HR팀장",
          "role": "DECISION_MAKER"
        }
      ]
    },
    "relatedOpportunity": {
      "id": "opp_abc123",
      "title": "리더십 교육 프로그램",
      "stage": "PROPOSAL"
    },
    "schedule": {
      "date": "2025-08-20",
      "startTime": "14:00",
      "endTime": "15:30",
      "duration": 90,
      "timezone": "Asia/Seoul"
    },
    "location": {
      "type": "ONSITE",
      "address": "서울시 서초구 삼성로 129",
      "room": "20층 대회의실",
      "onlineLink": null
    },
    "participants": {
      "internal": [
        {
          "id": "usr_def456",
          "name": "김영희",
          "role": "ACCOUNT_MANAGER",
          "attendance": "CONFIRMED"
        },
        {
          "id": "usr_ghi789",
          "name": "박지성",
          "role": "SOLUTION_ARCHITECT",
          "attendance": "CONFIRMED"
        }
      ],
      "external": [
        {
          "id": "cont_abc123",
          "name": "김철수",
          "company": "삼성전자",
          "position": "HR팀장",
          "attendance": "CONFIRMED"
        }
      ]
    },
    "agenda": [
      {
        "topic": "회사 소개",
        "duration": 10,
        "presenter": "김영희"
      },
      {
        "topic": "교육 프로그램 제안",
        "duration": 40,
        "presenter": "박지성"
      },
      {
        "topic": "ROI 및 기대효과",
        "duration": 20,
        "presenter": "김영희"
      },
      {
        "topic": "Q&A",
        "duration": 20
      }
    ],
    "preparation": {
      "documents": [
        {
          "id": "doc_prop123",
          "name": "제안서_v2.pdf",
          "type": "PROPOSAL"
        }
      ],
      "checklist": [
        {
          "item": "제안서 최종 검토",
          "assignee": "김영희",
          "completed": true
        },
        {
          "item": "ROI 계산서 준비",
          "assignee": "박지성",
          "completed": true
        }
      ]
    },
    "proposalDetails": {
      "products": [
        {
          "id": "prod_lead001",
          "name": "리더십 에센셜",
          "category": "LEADERSHIP",
          "duration": "3일",
          "price": 50000000
        },
        {
          "id": "prod_comm002",
          "name": "소통 리더십",
          "category": "COMMUNICATION",
          "duration": "2일",
          "price": 30000000
        }
      ],
      "totalValue": 80000000,
      "roi": {
        "quantitative": {
          "expectedSavings": 150000000,
          "period": "1년",
          "roiPercentage": 187.5
        },
        "qualitative": [
          "리더십 역량 향상",
          "조직문화 개선",
          "직원 만족도 증가"
        ]
      }
    },
    "status": "SCHEDULED",
    "importance": "HIGH",
    "createdAt": "2025-08-15T09:00:00Z",
    "updatedAt": "2025-08-18T14:00:00Z"
  }
}
```

#### POST /meetings
```typescript
// Request
{
  "title": "LG전자 초기 상담 미팅",
  "target": "CUSTOMER",
  "type": "INITIAL",
  "customerId": "cust_def456",
  "contactIds": ["cont_def456"],
  "date": "2025-08-25",
  "startTime": "10:00",
  "duration": 60,
  "location": {
    "type": "ONLINE",
    "onlineLink": "https://zoom.us/j/123456789"
  },
  "agenda": [
    {
      "topic": "비즈니스 니즈 파악",
      "duration": 30
    },
    {
      "topic": "교육 솔루션 소개",
      "duration": 20
    }
  ],
  "objectives": [
    "HRD 니즈 파악",
    "의사결정 프로세스 이해",
    "예산 규모 확인"
  ]
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "meet_xyz789",
    // ... full meeting object
  }
}
```

#### PUT /meetings/:id
```typescript
// Request
{
  "title": "LG전자 초기 상담 미팅",
  "status": "COMPLETED",
  // ... all updatable fields
}

// Response (200 OK)
{
  "success": true,
  "data": {
    // ... updated meeting object
  }
}
```

#### POST /meetings/:id/minutes
```typescript
// Request
{
  "summary": "LG전자 HRD 니즈 확인 및 솔루션 제안",
  "keyPoints": [
    "연간 교육 예산 5억원 규모",
    "리더십, 영업, CS 교육 니즈 확인",
    "9월 중 RFP 예정"
  ],
  "decisions": [
    "상세 제안서 8/30까지 제출",
    "벤치마킹 사례 추가 요청"
  ],
  "actionItems": [
    {
      "task": "상세 제안서 작성",
      "assignee": "김영희",
      "dueDate": "2025-08-30"
    },
    {
      "task": "벤치마킹 자료 준비",
      "assignee": "박지성",
      "dueDate": "2025-08-28"
    }
  ],
  "customerReaction": {
    "overall": "POSITIVE",
    "concerns": [
      "강사 퀄리티",
      "일정 조율 가능성"
    ],
    "interests": [
      "맞춤형 커리큘럼",
      "실습 중심 교육"
    ]
  },
  "competitorMentioned": [
    {
      "name": "멀티캠퍼스",
      "context": "기존 교육 업체"
    }
  ],
  "nextSteps": "제안서 제출 후 PT 일정 협의",
  "attachments": [
    {
      "id": "att_123",
      "name": "미팅노트_20250825.pdf"
    }
  ]
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "min_abc123",
    "meetingId": "meet_xyz789",
    // ... full minutes object
  }
}
```

#### GET /meetings/:id/minutes
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "min_abc123",
    "meetingId": "meet_xyz789",
    "summary": "LG전자 HRD 니즈 확인 및 솔루션 제안",
    // ... full minutes object
  }
}
```

### 6.2 Meeting Analytics

#### GET /meetings/analytics
```typescript
// Query Parameters
{
  period?: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'type' | 'customer' | 'organizer';
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "summary": {
      "total": 145,
      "customer": 98,
      "internal": 47,
      "completed": 120,
      "scheduled": 25
    },
    "byType": {
      "INITIAL": 35,
      "PROPOSAL": 28,
      "OPERATION": 45,
      "FOLLOWUP": 37
    },
    "effectiveness": {
      "conversionRate": {
        "initialToProposal": 0.65,
        "proposalToContract": 0.45
      },
      "averageDuration": {
        "INITIAL": 60,
        "PROPOSAL": 90,
        "OPERATION": 45,
        "FOLLOWUP": 30
      },
      "followUpRate": 0.75
    },
    "roi": {
      "meetingsToRevenue": {
        "ratio": 1250000,  // Revenue per meeting
        "trend": 15.5      // % increase
      },
      "topPerformers": [
        {
          "organizer": "김영희",
          "meetings": 25,
          "revenue": 45000000,
          "efficiency": 1800000
        }
      ]
    },
    "trends": {
      "weekly": [
        {
          "week": "2025-W33",
          "count": 12,
          "customerMeetings": 8,
          "conversionValue": 25000000
        }
      ]
    }
  }
}
```

#### GET /meetings/calendar
```typescript
// Query Parameters
{
  view?: 'day' | 'week' | 'month';
  date?: string;
  userId?: string;
  teamId?: string;
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-08-19",
      "end": "2025-08-25"
    },
    "meetings": [
      {
        "id": "meet_abc123",
        "title": "삼성전자 제안 미팅",
        "date": "2025-08-20",
        "time": "14:00-15:30",
        "type": "PROPOSAL",
        "customer": "삼성전자",
        "location": "본사",
        "organizer": "김영희",
        "color": "#A78BFA"  // Based on type
      }
    ],
    "availability": {
      "busySlots": [
        {
          "date": "2025-08-20",
          "slots": ["14:00-15:30", "16:00-17:00"]
        }
      ]
    }
  }
}
```

### 6.3 Meeting Templates

#### GET /meetings/templates
```typescript
// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "tmpl_initial",
      "name": "초기 상담 미팅",
      "type": "INITIAL",
      "defaultDuration": 60,
      "defaultAgenda": [
        {
          "topic": "인사 및 회사 소개",
          "duration": 10
        },
        {
          "topic": "비즈니스 니즈 파악",
          "duration": 25
        },
        {
          "topic": "솔루션 개요 소개",
          "duration": 20
        },
        {
          "topic": "Q&A 및 다음 단계",
          "duration": 5
        }
      ],
      "requiredDocuments": ["회사소개서", "솔루션브로셔"],
      "checklist": [
        "고객 정보 사전 조사",
        "경쟁사 분석",
        "제안 자료 준비"
      ]
    }
  ]
}
```

#### POST /meetings/from-template
```typescript
// Request
{
  "templateId": "tmpl_initial",
  "customerId": "cust_abc123",
  "date": "2025-08-30",
  "startTime": "14:00",
  "customizations": {
    "title": "SK텔레콤 초기 미팅",
    "duration": 90
  }
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "meet_new123",
    // ... created meeting from template
  }
}
```

---

## 7. Common Endpoints

### 7.1 Search

#### GET /search
```typescript
// Query Parameters
{
  q: string;           // Search query
  types?: string[];    // ['customer', 'opportunity', 'project']
  limit?: number;      // Max results per type
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust_abc123",
        "companyName": "삼성전자",
        "type": "customer",
        "url": "/customers/cust_abc123"
      }
    ],
    "opportunities": [...],
    "projects": [...],
    "contacts": [...]
  }
}
```

### 7.2 Activities

#### GET /activities
```typescript
// Query Parameters
{
  entityType?: 'customer' | 'opportunity' | 'project';
  entityId?: string;
  userId?: string;
  type?: ActivityType;
  dateFrom?: string;
  dateTo?: string;
}

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "act_abc123",
      "type": "MEETING",
      "subject": "계약 협상 미팅",
      "description": "최종 조건 협의",
      "entityType": "opportunity",
      "entityId": "opp_abc123",
      "entityName": "삼성전자 리더십 교육",
      "participants": [
        {
          "id": "usr_abc123",
          "name": "김영희",
          "type": "INTERNAL"
        },
        {
          "id": "cont_abc123",
          "name": "김철수",
          "type": "EXTERNAL"
        }
      ],
      "startTime": "2025-08-13T14:00:00Z",
      "endTime": "2025-08-13T15:30:00Z",
      "outcome": "계약 조건 합의",
      "nextAction": "계약서 작성",
      "createdBy": {
        "id": "usr_abc123",
        "name": "김영희"
      },
      "createdAt": "2025-08-13T16:00:00Z"
    }
  ]
}
```

### 7.3 Dashboard

#### GET /dashboard/summary
```typescript
// Response (200 OK)
{
  "success": true,
  "data": {
    "kpis": {
      "revenue": {
        "current": 2500000000,
        "target": 3000000000,
        "achievement": 83.3,
        "trend": 12.5
      },
      "customers": {
        "total": 248,
        "new": 8,
        "churned": 2,
        "growth": 2.5
      },
      "opportunities": {
        "total": 55,
        "value": 1250000000,
        "avgSize": 22727272,
        "winRate": 32
      },
      "projects": {
        "active": 15,
        "completed": 3,
        "onTime": 80,
        "health": {
          "green": 10,
          "yellow": 4,
          "red": 1
        }
      }
    },
    "charts": {
      "revenueByMonth": [...],
      "pipelineByStage": [...],
      "projectsByStatus": [...],
      "topCustomers": [...]
    },
    "activities": {
      "today": 12,
      "week": 45,
      "overdue": 3
    },
    "alerts": [
      {
        "type": "WARNING",
        "message": "3 opportunities need attention",
        "link": "/opportunities?filter=at-risk"
      }
    ]
  }
}
```

---

## 8. Webhooks

### 8.1 Webhook Events
```typescript
const WEBHOOK_EVENTS = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "opportunity.created",
  "opportunity.stage_changed",
  "opportunity.won",
  "opportunity.lost",
  "project.started",
  "project.completed",
  "invoice.created",
  "payment.received"
];

// Webhook Payload
{
  "event": "opportunity.stage_changed",
  "timestamp": "2025-08-13T10:00:00Z",
  "data": {
    "opportunity": {
      "id": "opp_abc123",
      "title": "삼성전자 리더십 교육",
      "previousStage": "PROPOSAL",
      "currentStage": "NEGOTIATION",
      "changedBy": "usr_abc123"
    }
  },
  "signature": "sha256=..."  // HMAC signature
}
```

### 8.2 Webhook Management

#### POST /webhooks
```typescript
// Request
{
  "url": "https://example.com/webhook",
  "events": ["opportunity.won", "project.completed"],
  "secret": "webhook_secret_key"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "url": "https://example.com/webhook",
    "events": ["opportunity.won", "project.completed"],
    "status": "ACTIVE",
    "createdAt": "2025-08-13T10:00:00Z"
  }
}
```

---

## 9. Rate Limiting & Quotas

### 9.1 Rate Limits
```typescript
const RATE_LIMITS = {
  authenticated: {
    requests: 1000,      // per hour
    burst: 100          // per minute
  },
  unauthenticated: {
    requests: 100,       // per hour
    burst: 10           // per minute
  }
};

// Rate Limit Headers
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "995",
  "X-RateLimit-Reset": "1755064800"
}

// Rate Limit Exceeded Response (429)
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 3600
  }
}
```

### 9.2 API Quotas
```typescript
const API_QUOTAS = {
  plan: {
    starter: {
      requests: 10000,     // per month
      storage: 10,         // GB
      users: 10
    },
    professional: {
      requests: 100000,
      storage: 100,
      users: 50
    },
    enterprise: {
      requests: "Unlimited",
      storage: 1000,
      users: "Unlimited"
    }
  }
};
```

---

## 10. Error Codes

### 10.1 Error Code Reference
```typescript
const ERROR_CODES = {
  // Authentication Errors (AUTH_*)
  AUTH_INVALID_CREDENTIALS: "Invalid email or password",
  AUTH_TOKEN_EXPIRED: "Access token has expired",
  AUTH_TOKEN_INVALID: "Invalid access token",
  AUTH_REFRESH_TOKEN_INVALID: "Invalid refresh token",
  AUTH_INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  
  // Validation Errors (VAL_*)
  VAL_REQUIRED_FIELD: "Required field missing",
  VAL_INVALID_FORMAT: "Invalid format",
  VAL_INVALID_RANGE: "Value out of range",
  VAL_DUPLICATE_ENTRY: "Duplicate entry exists",
  
  // Business Logic Errors (BIZ_*)
  BIZ_INVALID_STATE_TRANSITION: "Invalid state transition",
  BIZ_QUOTA_EXCEEDED: "Quota exceeded",
  BIZ_RESOURCE_LOCKED: "Resource is locked",
  BIZ_DEPENDENCY_EXISTS: "Cannot delete due to dependencies",
  
  // System Errors (SYS_*)
  SYS_INTERNAL_ERROR: "Internal server error",
  SYS_SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  SYS_DATABASE_ERROR: "Database operation failed",
  SYS_EXTERNAL_SERVICE_ERROR: "External service error"
};
```

---

## 11. SDK Examples

### 11.1 JavaScript/TypeScript SDK
```typescript
import { CrmClient } from '@crm-augu/sdk';

// Initialize client
const client = new CrmClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.crm-augu.com/v1'
});

// Authentication
const { accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

client.setAccessToken(accessToken);

// Customer operations
const customers = await client.customers.list({
  page: 1,
  pageSize: 20,
  status: 'ACTIVE'
});

const customer = await client.customers.create({
  companyName: 'New Company',
  businessNumber: '123-45-67890'
});

// Opportunity operations
const opportunity = await client.opportunities.create({
  title: 'New Deal',
  customerId: customer.id,
  amount: 100000000
});

await client.opportunities.updateStage(opportunity.id, 'PROPOSAL');

// Real-time updates
client.subscribe('opportunity.stage_changed', (event) => {
  console.log('Opportunity stage changed:', event);
});
```

### 11.2 Python SDK
```python
from crm_augu import CrmClient

# Initialize client
client = CrmClient(
    api_key='your_api_key',
    base_url='https://api.crm-augu.com/v1'
)

# Authentication
auth_response = client.auth.login(
    email='user@example.com',
    password='password'
)

client.set_access_token(auth_response['accessToken'])

# Customer operations
customers = client.customers.list(
    page=1,
    page_size=20,
    status='ACTIVE'
)

customer = client.customers.create({
    'companyName': 'New Company',
    'businessNumber': '123-45-67890'
})

# Async operations
import asyncio

async def main():
    async with client.async_session() as session:
        tasks = [
            session.customers.get(id) 
            for id in customer_ids
        ]
        results = await asyncio.gather(*tasks)
    return results
```

---

## 📋 API Development Checklist

### Phase 2 API Implementation
- [ ] Authentication & Authorization APIs
- [ ] Customer Management APIs
- [ ] Contact Management APIs
- [ ] Opportunity Management APIs
- [ ] Project Management APIs
- [ ] Financial Management APIs
- [ ] Analytics & Dashboard APIs
- [ ] Webhook System
- [ ] Search & Filter APIs
- [ ] File Upload APIs

### API Documentation
- [ ] OpenAPI/Swagger Specification
- [ ] Postman Collection
- [ ] API Reference Documentation
- [ ] SDK Documentation
- [ ] Integration Guides

### Testing
- [ ] Unit Tests for Each Endpoint
- [ ] Integration Tests
- [ ] Load Testing
- [ ] Security Testing
- [ ] API Contract Tests

---

*이 API 명세서를 검토하고 필요한 수정사항을 반영해 주세요.*