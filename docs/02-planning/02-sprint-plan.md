# 🏃 스프린트별 상세 실행 계획

## 📅 Sprint 1: Foundation Setup (Week 1-2)

### 🎯 Sprint Goal
인증 시스템과 기본 인프라를 구축하여 안전한 애플리케이션 기반 마련

### 📋 User Stories

#### Backend Stories
```typescript
// US-001: 사용자 인증
"As a user, I want to log in securely
so that I can access my CRM data"
- Acceptance Criteria:
  ✓ Email/Password 로그인
  ✓ JWT 토큰 발급
  ✓ 토큰 만료 시 자동 갱신
  - Story Points: 5

// US-002: API 보안
"As a developer, I want secured API endpoints
so that data is protected"
- Acceptance Criteria:
  ✓ JWT 검증 미들웨어
  ✓ 역할 기반 접근 제어
  ✓ Rate limiting
  - Story Points: 3
```

#### Frontend Stories
```typescript
// US-003: 로그인 페이지
"As a user, I want a clean login interface
so that I can easily access the system"
- Acceptance Criteria:
  ✓ 로그인 폼 UI
  ✓ 유효성 검사
  ✓ 에러 메시지 표시
  - Story Points: 3

// US-004: 기본 레이아웃
"As a user, I want consistent navigation
so that I can easily move between features"
- Acceptance Criteria:
  ✓ Header with user menu
  ✓ Sidebar navigation
  ✓ Responsive design
  - Story Points: 5
```

### 🔨 Technical Tasks

#### Day 1-3: Backend Authentication
```bash
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT 검증
│   │   └── rbac.middleware.ts      # 역할 기반 접근 제어
│   ├── controllers/
│   │   └── auth.controller.ts      # 로그인/로그아웃
│   ├── services/
│   │   └── auth.service.ts         # 인증 비즈니스 로직
│   └── routes/
│       └── auth.routes.ts          # 인증 라우트
```

#### Day 4-5: API Structure
```typescript
// 1. Error Handler 구현
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// 2. Response Formatter
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 3. Request Validator
const validateRequest = (schema: Joi.Schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    // ...
  };
};
```

#### Day 6-8: Frontend Foundation
```bash
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   └── services/
│       └── auth.service.ts
```

#### Day 9-10: Integration & Testing
- [ ] API 통합 테스트
- [ ] 로그인 플로우 E2E 테스트
- [ ] 보안 취약점 검사
- [ ] 성능 벤치마크

### 📊 Sprint Metrics
- **Velocity Target**: 16 points
- **Actual Velocity**: TBD
- **Bug Count**: 0
- **Tech Debt Created**: Minimal

---

## 📅 Sprint 2: Customer Management Core (Week 3-4)

### 🎯 Sprint Goal
고객 정보를 효과적으로 관리할 수 있는 CRUD 기능 구현

### 📋 User Stories

```typescript
// US-005: 고객 목록 조회
"As a sales rep, I want to see all customers
so that I can manage relationships"
- Story Points: 3

// US-006: 고객 상세 정보
"As a sales rep, I want to view customer details
so that I can understand their needs"
- Story Points: 3

// US-007: 고객 등록
"As a sales rep, I want to add new customers
so that I can track new opportunities"
- Story Points: 5

// US-008: 고객 정보 수정
"As a sales rep, I want to update customer info
so that data stays current"
- Story Points: 3
```

### 🔨 Daily Tasks

#### Day 1-2: Database & API Setup
```typescript
// Prisma Schema Update
model Customer {
  id              String   @id @default(uuid())
  companyName     String
  industry        String?
  size            CompanySize?
  status          CustomerStatus
  accountManagerId String?
  // ...
}

// Repository Pattern
class CustomerRepository {
  async findAll(filters: CustomerFilter);
  async findById(id: string);
  async create(data: CreateCustomerDto);
  async update(id: string, data: UpdateCustomerDto);
  async delete(id: string);
}
```

#### Day 3-5: Backend CRUD Implementation
```typescript
// Customer Controller
@Controller('/api/customers')
export class CustomerController {
  @Get('/')
  async getCustomers(@Query() filters: CustomerFilter);
  
  @Get('/:id')
  async getCustomer(@Param('id') id: string);
  
  @Post('/')
  @Validate(createCustomerSchema)
  async createCustomer(@Body() data: CreateCustomerDto);
  
  @Put('/:id')
  @Validate(updateCustomerSchema)
  async updateCustomer(@Param('id') id: string, @Body() data);
  
  @Delete('/:id')
  async deleteCustomer(@Param('id') id: string);
}
```

#### Day 6-8: Frontend Customer List
```tsx
// CustomerList Component
const CustomerList = () => {
  const { data, loading, error } = useQuery('customers');
  
  return (
    <DataTable
      columns={customerColumns}
      data={data}
      onRowClick={handleRowClick}
      searchable
      sortable
      paginated
    />
  );
};
```

#### Day 9-10: Frontend Forms & Integration
```tsx
// CustomerForm Component
const CustomerForm = ({ customer, onSubmit }) => {
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(customerSchema)
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField {...register('companyName')} />
      <Select {...register('industry')} />
      <Select {...register('size')} />
      {/* More fields */}
    </form>
  );
};
```

---

## 📅 Sprint 3: Contact & Activity Management (Week 5)

### 🎯 Sprint Goal
고객별 연락처 관리 및 활동 추적 기능 구현

### 📋 User Stories
- US-009: 연락처 관리 (5 points)
- US-010: 활동 기록 (5 points)
- US-011: 활동 타임라인 (3 points)
- US-012: 노트 시스템 (3 points)

### 🔨 Implementation Focus

#### Contact Management
```typescript
// Contact Model
interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

// Nested CRUD under Customer
/api/customers/:customerId/contacts
```

#### Activity Tracking
```typescript
// Activity Types
enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE'
}

// Activity Timeline Component
<Timeline>
  {activities.map(activity => (
    <TimelineItem
      icon={getActivityIcon(activity.type)}
      title={activity.subject}
      timestamp={activity.createdAt}
      content={activity.description}
    />
  ))}
</Timeline>
```

---

## 📅 Sprint 4-5: Sales Pipeline (Week 6-8)

### 🎯 Sprint Goal
영업 기회 관리 및 파이프라인 시각화

### 📋 Key Features

#### Opportunity Management
```typescript
// Opportunity Stages
const PIPELINE_STAGES = [
  { id: 'LEAD', name: '리드', color: '#gray' },
  { id: 'QUALIFIED', name: '검증', color: '#blue' },
  { id: 'PROPOSAL', name: '제안', color: '#yellow' },
  { id: 'NEGOTIATION', name: '협상', color: '#orange' },
  { id: 'CLOSED_WON', name: '성공', color: '#green' },
  { id: 'CLOSED_LOST', name: '실패', color: '#red' }
];
```

#### Kanban Board Implementation
```tsx
// Pipeline Kanban Component
const PipelineBoard = () => {
  const [opportunities, setOpportunities] = useState([]);
  
  const handleDragEnd = (result) => {
    // Update opportunity stage
    updateOpportunityStage(
      result.draggableId,
      result.destination.droppableId
    );
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {PIPELINE_STAGES.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            opportunities={filterByStage(opportunities, stage.id)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
```

---

## 📅 Sprint 6-7: Project Management (Week 9-10)

### 🎯 Sprint Goal
프로젝트 실행 관리 및 태스크 추적

### 📋 Key Features

#### Project Dashboard
```typescript
// Project Status Overview
interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  averageProgress: number;
  onTimeDelivery: number;
}
```

#### Task Management
```tsx
// Task Board Component
const TaskBoard = ({ projectId }) => {
  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  
  return (
    <Board>
      {columns.map(status => (
        <Column key={status} title={status}>
          <TaskList 
            tasks={tasks.filter(t => t.status === status)}
            onTaskMove={handleTaskMove}
          />
        </Column>
      ))}
    </Board>
  );
};
```

---

## 📅 Sprint 8: Analytics & Dashboard (Week 11-12)

### 🎯 Sprint Goal
비즈니스 인사이트를 제공하는 대시보드 구축

### 📋 Dashboard Widgets

```typescript
// KPI Widgets
const dashboardWidgets = [
  {
    id: 'revenue',
    type: 'metric',
    title: '월 매출',
    query: 'SELECT SUM(amount) FROM opportunities WHERE...'
  },
  {
    id: 'conversion',
    type: 'funnel',
    title: '전환율',
    stages: ['Lead', 'Qualified', 'Proposal', 'Closed']
  },
  {
    id: 'pipeline',
    type: 'chart',
    title: '파이프라인 가치',
    chartType: 'bar'
  },
  {
    id: 'activities',
    type: 'timeline',
    title: '최근 활동',
    limit: 10
  }
];
```

### 📊 Chart Implementation
```tsx
// Dashboard Component
const Dashboard = () => {
  const [dateRange, setDateRange] = useState('month');
  const [widgets, setWidgets] = useState(defaultWidgets);
  
  return (
    <DashboardGrid>
      {widgets.map(widget => (
        <WidgetCard key={widget.id}>
          <WidgetRenderer
            type={widget.type}
            config={widget.config}
            dateRange={dateRange}
          />
        </WidgetCard>
      ))}
    </DashboardGrid>
  );
};
```

---

## 🎯 Sprint Retrospective Template

### What Went Well? 😊
- [ ] 기능 구현 완료
- [ ] 코드 품질 유지
- [ ] 팀 협업 원활

### What Could Be Improved? 🤔
- [ ] 예상보다 긴 구현 시간
- [ ] 테스트 커버리지 부족
- [ ] 문서화 지연

### Action Items 📝
- [ ] 다음 스프린트 속도 조정
- [ ] 자동화 테스트 추가
- [ ] 코드 리뷰 프로세스 개선

---

## 📈 Velocity Tracking

| Sprint | Planned | Completed | Velocity |
|--------|---------|-----------|----------|
| 1 | 16 | TBD | TBD |
| 2 | 14 | TBD | TBD |
| 3 | 16 | TBD | TBD |
| 4 | 18 | TBD | TBD |
| 5 | 18 | TBD | TBD |
| 6 | 20 | TBD | TBD |
| 7 | 20 | TBD | TBD |
| 8 | 16 | TBD | TBD |

---

**"Each sprint delivers working software that provides immediate value"**