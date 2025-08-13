# CRM AUGU - Information Architecture & UI/UX Design

## 📐 문서 정보
- **버전**: 1.0.0
- **작성일**: 2025-08-13
- **목적**: Phase 2 UI/UX 설계 가이드
- **상태**: Draft (검토 필요)

---

## 1. Information Architecture (IA)

### 1.1 사이트맵 구조
```
CRM AUGU
├── 🏠 Dashboard
│   ├── Executive Dashboard
│   ├── Sales Dashboard
│   ├── Project Dashboard
│   └── Personal Dashboard
│
├── 🎯 영업 (Sales)
│   ├── Leads
│   │   ├── Lead List
│   │   ├── Lead Detail
│   │   ├── Lead Import
│   │   └── Lead Scoring
│   │
│   ├── 고객사 (Customers)
│   │   ├── Customer List
│   │   ├── Customer 360° View
│   │   ├── Contact Management
│   │   └── Communication History
│   │
│   └── 기회 (Opportunities)
│       ├── Pipeline View (Kanban)
│       ├── List View
│       ├── Opportunity Detail
│       ├── Proposals
│       └── Forecast
│
├── 📊 프로젝트 (Projects)
│   ├── Project List
│   ├── Project Board
│   ├── Project Detail
│   │   ├── Overview
│   │   ├── Tasks
│   │   ├── Team
│   │   ├── Timeline (Gantt)
│   │   ├── Documents
│   │   └── Budget
│   ├── Resource Planning
│   └── Instructor Management
│
├── 💰 재무 (Finance)
│   ├── Contracts
│   ├── Invoices
│   ├── Payments
│   ├── Expenses
│   └── Reports
│
├── 📈 분석 (Analytics)
│   ├── Sales Analytics
│   ├── Project Analytics
│   ├── Financial Analytics
│   ├── Custom Reports
│   └── Export Center
│
├── ⚙️ 설정 (Settings)
│   ├── Company Settings
│   ├── User Management
│   ├── Roles & Permissions
│   ├── Workflow Automation
│   ├── Email Templates
│   └── Integrations
│
└── 👤 Profile
    ├── My Profile
    ├── Preferences
    ├── Notifications
    └── Activity Log
```

### 1.2 Navigation Hierarchy

#### Primary Navigation (Top Bar)
```typescript
const primaryNav = [
  { label: 'Dashboard', icon: 'home', path: '/dashboard' },
  { label: '영업', icon: 'target', path: '/sales' },
  { label: '프로젝트', icon: 'folder', path: '/projects' },
  { label: '재무', icon: 'dollar', path: '/finance' },
  { label: '분석', icon: 'chart', path: '/analytics' }
];
```

#### Secondary Navigation (Sidebar)
```typescript
const secondaryNav = {
  sales: [
    { label: 'Leads', path: '/sales/leads', badge: 'NEW' },
    { label: '고객사', path: '/sales/customers' },
    { label: '영업기회', path: '/sales/opportunities' },
    { label: '제안서', path: '/sales/proposals' }
  ],
  // Context-sensitive based on primary selection
};
```

#### Quick Actions (Floating Action Button)
```typescript
const quickActions = [
  { label: '새 Lead', icon: 'plus', action: 'CREATE_LEAD' },
  { label: '새 고객사', icon: 'building', action: 'CREATE_CUSTOMER' },
  { label: '새 기회', icon: 'star', action: 'CREATE_OPPORTUNITY' },
  { label: '빠른 메모', icon: 'note', action: 'QUICK_NOTE' }
];
```

---

## 2. UI Design System

### 2.1 Design Principles
```typescript
const DESIGN_PRINCIPLES = {
  clarity: {
    description: "명확한 정보 전달",
    guidelines: [
      "중요 정보 우선 표시",
      "명확한 레이블과 설명",
      "일관된 용어 사용"
    ]
  },
  
  efficiency: {
    description: "효율적인 작업 수행",
    guidelines: [
      "3클릭 이내 목표 도달",
      "자주 사용하는 기능 빠른 접근",
      "키보드 단축키 지원"
    ]
  },
  
  consistency: {
    description: "일관된 사용 경험",
    guidelines: [
      "통일된 디자인 패턴",
      "예측 가능한 인터랙션",
      "플랫폼 간 일관성"
    ]
  },
  
  feedback: {
    description: "즉각적인 피드백",
    guidelines: [
      "모든 액션에 대한 반응",
      "진행 상태 표시",
      "명확한 에러 메시지"
    ]
  }
};
```

### 2.2 Color System
```scss
// Brand Colors
$primary: #2563EB;      // Blue 600 - 주요 액션
$secondary: #7C3AED;    // Purple 600 - 보조 액션
$success: #16A34A;      // Green 600 - 성공
$warning: #D97706;      // Amber 600 - 경고
$danger: #DC2626;       // Red 600 - 위험
$info: #0891B2;         // Cyan 600 - 정보

// Neutral Colors
$gray: {
  50: #F9FAFB,
  100: #F3F4F6,
  200: #E5E7EB,
  300: #D1D5DB,
  400: #9CA3AF,
  500: #6B7280,
  600: #4B5563,
  700: #374151,
  800: #1F2937,
  900: #111827
};

// Semantic Colors
$background: {
  primary: #FFFFFF,
  secondary: #F9FAFB,
  tertiary: #F3F4F6
};

$text: {
  primary: #111827,
  secondary: #4B5563,
  tertiary: #9CA3AF,
  inverse: #FFFFFF
};

// Status Colors for Pipeline
$pipeline: {
  qualifying: #94A3B8,    // Slate
  needs: #60A5FA,        // Blue
  proposal: #A78BFA,     // Purple
  negotiation: #FBBF24,  // Amber
  won: #34D399,          // Green
  lost: #F87171          // Red
};
```

### 2.3 Typography
```scss
// Font Family
$font-family: {
  sans: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace"
};

// Font Sizes
$font-size: {
  xs: 12px,    // 0.75rem - 캡션, 레이블
  sm: 14px,    // 0.875rem - 보조 텍스트
  base: 16px,  // 1rem - 본문
  lg: 18px,    // 1.125rem - 부제목
  xl: 20px,    // 1.25rem - 제목 3
  '2xl': 24px, // 1.5rem - 제목 2
  '3xl': 30px, // 1.875rem - 제목 1
  '4xl': 36px  // 2.25rem - 대제목
};

// Font Weight
$font-weight: {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};

// Line Height
$line-height: {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75
};
```

### 2.4 Spacing System
```scss
// 8px Grid System
$spacing: {
  0: 0,
  1: 4px,   // 0.25rem
  2: 8px,   // 0.5rem
  3: 12px,  // 0.75rem
  4: 16px,  // 1rem
  5: 20px,  // 1.25rem
  6: 24px,  // 1.5rem
  8: 32px,  // 2rem
  10: 40px, // 2.5rem
  12: 48px, // 3rem
  16: 64px, // 4rem
  20: 80px, // 5rem
  24: 96px  // 6rem
};

// Container Widths
$container: {
  xs: 480px,
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  '2xl': 1536px
};
```

---

## 3. Component Library

### 3.1 Core Components

#### Data Display Components
```typescript
// Table Component
interface TableProps {
  columns: Column[];
  data: any[];
  sorting?: boolean;
  filtering?: boolean;
  pagination?: boolean;
  selection?: 'single' | 'multiple';
  actions?: Action[];
  density?: 'compact' | 'normal' | 'comfortable';
}

// Card Component
interface CardProps {
  title?: string;
  subtitle?: string;
  avatar?: string;
  media?: string;
  content: ReactNode;
  actions?: Action[];
  variant?: 'elevated' | 'outlined' | 'filled';
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: ColorVariant;
}
```

#### Form Components
```typescript
// Smart Form Field
interface FormFieldProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'file';
  required?: boolean;
  validation?: ValidationRule[];
  help?: string;
  placeholder?: string;
  autoComplete?: boolean;
}

// Search Component
interface SearchProps {
  placeholder?: string;
  filters?: Filter[];
  suggestions?: boolean;
  recent?: string[];
  onSearch: (query: string, filters?: Filter[]) => void;
}
```

### 3.2 Business Components

#### Customer 360 View Component
```tsx
const Customer360View = () => (
  <div className="customer-360">
    <Header>
      <Avatar size="large" />
      <Title />
      <Badge status={customer.tier} />
      <Actions />
    </Header>
    
    <TabContainer>
      <Tab label="Overview">
        <Grid cols={3}>
          <StatCard label="연간 매출" value="5억원" trend="up" />
          <StatCard label="프로젝트" value="12건" />
          <StatCard label="건강도" value="85%" color="success" />
        </Grid>
        <RecentActivities />
      </Tab>
      
      <Tab label="Contacts">
        <ContactList editable />
      </Tab>
      
      <Tab label="Opportunities">
        <OpportunityPipeline customerId={id} />
      </Tab>
      
      <Tab label="Projects">
        <ProjectTimeline />
      </Tab>
      
      <Tab label="Finance">
        <RevenueChart />
        <InvoiceList />
      </Tab>
    </TabContainer>
  </div>
);
```

#### Pipeline Kanban Component
```tsx
const PipelineKanban = () => {
  const stages = ['Qualifying', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed'];
  
  return (
    <KanbanBoard>
      {stages.map(stage => (
        <Column key={stage} title={stage}>
          <ColumnHeader>
            <Title>{stage}</Title>
            <Count>{opportunities[stage].length}</Count>
            <Value>₩{formatCurrency(totalValue[stage])}</Value>
          </ColumnHeader>
          
          <Droppable droppableId={stage}>
            {opportunities[stage].map(opp => (
              <Draggable key={opp.id} draggableId={opp.id}>
                <OpportunityCard>
                  <Customer>{opp.customerName}</Customer>
                  <Title>{opp.title}</Title>
                  <Amount>₩{formatCurrency(opp.amount)}</Amount>
                  <Probability>{opp.probability}%</Probability>
                  <Owner avatar={opp.owner.avatar} />
                  <DueDate warning={isOverdue(opp.expectedClose)} />
                </OpportunityCard>
              </Draggable>
            ))}
          </Droppable>
        </Column>
      ))}
    </KanbanBoard>
  );
};
```

---

## 4. Page Layouts

### 4.1 Dashboard Layout
```tsx
const DashboardLayout = () => (
  <Container>
    {/* Header Section */}
    <Header>
      <Greeting>안녕하세요, {user.name}님</Greeting>
      <DateRange />
      <QuickActions />
    </Header>
    
    {/* KPI Section */}
    <Grid cols={4} gap={4}>
      <StatCard label="이번 달 매출" value="2.5억" change={12} />
      <StatCard label="신규 고객" value="8" change={-5} />
      <StatCard label="진행중 프로젝트" value="15" />
      <StatCard label="목표 달성률" value="87%" />
    </Grid>
    
    {/* Main Content */}
    <Grid cols={[2, 1]} gap={6}>
      <Section>
        <SectionTitle>영업 파이프라인</SectionTitle>
        <PipelineFunnel />
      </Section>
      
      <Section>
        <SectionTitle>오늘의 일정</SectionTitle>
        <TodaySchedule />
      </Section>
    </Grid>
    
    {/* Charts Section */}
    <Grid cols={2} gap={6}>
      <RevenueChart period="monthly" />
      <ConversionChart />
    </Grid>
    
    {/* Activity Feed */}
    <Section>
      <SectionTitle>최근 활동</SectionTitle>
      <ActivityFeed limit={10} />
    </Section>
  </Container>
);
```

### 4.2 List Page Layout
```tsx
const ListPageLayout = () => (
  <Container>
    {/* Page Header */}
    <PageHeader>
      <Title>고객사 관리</Title>
      <Actions>
        <Button variant="outlined" icon="download">내보내기</Button>
        <Button variant="outlined" icon="upload">가져오기</Button>
        <Button variant="contained" icon="plus">새 고객사</Button>
      </Actions>
    </PageHeader>
    
    {/* Filters Bar */}
    <FiltersBar>
      <SearchInput placeholder="고객사 검색..." />
      <FilterChips>
        <Chip>활성 고객</Chip>
        <Chip>VIP</Chip>
        <Chip>최근 30일</Chip>
      </FilterChips>
      <ViewToggle options={['list', 'grid', 'card']} />
    </FiltersBar>
    
    {/* Results Summary */}
    <ResultsSummary>
      <Text>총 <Strong>248개</Strong> 고객사</Text>
      <SortDropdown options={sortOptions} />
    </ResultsSummary>
    
    {/* Data Table */}
    <DataTable
      columns={customerColumns}
      data={customers}
      onRowClick={handleRowClick}
      actions={rowActions}
      pagination
      selection="multiple"
    />
  </Container>
);
```

### 4.3 Detail Page Layout
```tsx
const DetailPageLayout = () => (
  <Container>
    {/* Breadcrumb */}
    <Breadcrumb>
      <Link to="/sales">영업</Link>
      <Separator />
      <Link to="/sales/opportunities">기회</Link>
      <Separator />
      <Text>삼성전자 리더십 교육</Text>
    </Breadcrumb>
    
    {/* Page Header */}
    <PageHeader>
      <div>
        <Title>삼성전자 리더십 교육 프로그램</Title>
        <Meta>
          <Badge>Proposal</Badge>
          <Text>예상 금액: ₩150,000,000</Text>
          <Text>확률: 75%</Text>
        </Meta>
      </div>
      <Actions>
        <Button variant="outlined">편집</Button>
        <Button variant="outlined">복제</Button>
        <DropdownMenu>
          <MenuItem>제안서 생성</MenuItem>
          <MenuItem>계약서 생성</MenuItem>
          <MenuItem>프로젝트 전환</MenuItem>
        </DropdownMenu>
      </Actions>
    </PageHeader>
    
    {/* Main Content */}
    <Grid cols={[2, 1]} gap={6}>
      {/* Left Column - Main Info */}
      <div>
        <Card>
          <CardHeader>기본 정보</CardHeader>
          <CardContent>
            <DetailRow label="고객사" value="삼성전자" link />
            <DetailRow label="담당자" value="김철수 부장" />
            <DetailRow label="영업 담당" value="이영희" avatar />
            <DetailRow label="예상 마감일" value="2025-09-30" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>활동 내역</CardHeader>
          <Timeline activities={activities} />
        </Card>
      </div>
      
      {/* Right Column - Sidebar */}
      <div>
        <Card>
          <CardHeader>다음 단계</CardHeader>
          <NextSteps items={nextSteps} />
        </Card>
        
        <Card>
          <CardHeader>관련 문서</CardHeader>
          <DocumentList documents={documents} />
        </Card>
        
        <Card>
          <CardHeader>팀 멤버</CardHeader>
          <TeamMembers members={team} />
        </Card>
      </div>
    </Grid>
  </Container>
);
```

---

## 5. Interaction Patterns

### 5.1 Common Interactions
```typescript
const INTERACTION_PATTERNS = {
  // 데이터 조작
  create: {
    trigger: "Button / FAB / Keyboard shortcut",
    action: "Modal / Slide-in panel / New page",
    feedback: "Success toast / Redirect to detail"
  },
  
  edit: {
    trigger: "Edit button / Double click / F2",
    action: "Inline edit / Modal / Edit page",
    feedback: "Save indicator / Success message"
  },
  
  delete: {
    trigger: "Delete button / Context menu",
    action: "Confirmation dialog",
    feedback: "Success toast / List update"
  },
  
  // 네비게이션
  search: {
    trigger: "Search bar / Cmd+K",
    action: "Instant results / Search page",
    feedback: "Results dropdown / Highlight matches"
  },
  
  filter: {
    trigger: "Filter button / Chips",
    action: "Dropdown / Sidebar / Modal",
    feedback: "Applied filters / Result count"
  },
  
  // 협업
  comment: {
    trigger: "@mention / Comment button",
    action: "Inline comment box",
    feedback: "Real-time update / Notification"
  },
  
  share: {
    trigger: "Share button",
    action: "Share modal with permissions",
    feedback: "Shared indicator / Email sent"
  }
};
```

### 5.2 Keyboard Shortcuts
```typescript
const KEYBOARD_SHORTCUTS = {
  global: {
    'Cmd/Ctrl + K': 'Quick search',
    'Cmd/Ctrl + /': 'Show shortcuts',
    'Cmd/Ctrl + ,': 'Settings',
    'Esc': 'Close modal/panel'
  },
  
  navigation: {
    'G then D': 'Go to Dashboard',
    'G then C': 'Go to Customers',
    'G then O': 'Go to Opportunities',
    'G then P': 'Go to Projects'
  },
  
  actions: {
    'C': 'Create new',
    'E': 'Edit',
    'D': 'Delete',
    'S': 'Save',
    'Cmd/Ctrl + S': 'Save',
    'Cmd/Ctrl + Enter': 'Submit'
  },
  
  list: {
    'J/K': 'Navigate up/down',
    'X': 'Select item',
    'Shift + X': 'Select range',
    'Cmd/Ctrl + A': 'Select all'
  }
};
```

---

## 6. Responsive Design

### 6.1 Breakpoints
```scss
$breakpoints: (
  mobile: 320px,    // Mobile devices
  tablet: 768px,    // Tablets
  laptop: 1024px,   // Small laptops
  desktop: 1440px,  // Desktop
  wide: 1920px      // Wide screens
);

@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

### 6.2 Mobile Adaptations
```typescript
const MOBILE_ADAPTATIONS = {
  navigation: {
    desktop: "Sidebar + Top bar",
    mobile: "Bottom tab bar + Hamburger menu"
  },
  
  tables: {
    desktop: "Full table with all columns",
    mobile: "Card view / Key columns only"
  },
  
  forms: {
    desktop: "Multi-column layout",
    mobile: "Single column / Step-by-step"
  },
  
  modals: {
    desktop: "Centered modal",
    mobile: "Full screen / Bottom sheet"
  },
  
  actions: {
    desktop: "Inline actions",
    mobile: "Swipe actions / Action sheet"
  }
};
```

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Compliance
```typescript
const ACCESSIBILITY_REQUIREMENTS = {
  perceivable: {
    textAlternatives: "All images have alt text",
    colorContrast: "4.5:1 for normal text, 3:1 for large text",
    resize: "Text can be resized up to 200%"
  },
  
  operable: {
    keyboard: "All functionality available via keyboard",
    timing: "Users can extend time limits",
    seizures: "No flashing more than 3 times per second"
  },
  
  understandable: {
    readable: "Language is specified",
    predictable: "Consistent navigation and labeling",
    inputAssistance: "Error messages and suggestions"
  },
  
  robust: {
    compatible: "Works with screen readers",
    valid: "Valid HTML markup",
    statusMessages: "Status updates announced"
  }
};
```

### 7.2 ARIA Implementation
```tsx
// Example: Accessible Data Table
<table role="table" aria-label="고객사 목록">
  <thead>
    <tr role="row">
      <th role="columnheader" aria-sort="ascending">
        회사명
      </th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-selected="false" tabIndex={0}>
      <td role="cell">삼성전자</td>
    </tr>
  </tbody>
</table>

// Example: Accessible Form
<form aria-label="새 고객사 등록">
  <div role="group" aria-labelledby="company-info">
    <h2 id="company-info">회사 정보</h2>
    <label htmlFor="company-name">
      회사명 <span aria-label="필수">*</span>
    </label>
    <input
      id="company-name"
      aria-required="true"
      aria-invalid={errors.companyName}
      aria-describedby="company-name-error"
    />
    {errors.companyName && (
      <span id="company-name-error" role="alert">
        {errors.companyName}
      </span>
    )}
  </div>
</form>
```

---

## 8. Performance Optimization

### 8.1 Loading Strategies
```typescript
const LOADING_STRATEGIES = {
  lazyLoading: {
    images: "Intersection Observer API",
    components: "React.lazy() + Suspense",
    routes: "Dynamic imports"
  },
  
  caching: {
    static: "Browser cache + CDN",
    api: "React Query / SWR",
    offline: "Service Worker + IndexedDB"
  },
  
  optimization: {
    bundleSize: "Code splitting + Tree shaking",
    rendering: "Virtual scrolling for lists",
    animations: "CSS transforms + will-change"
  }
};
```

### 8.2 Performance Metrics
```typescript
const PERFORMANCE_TARGETS = {
  // Core Web Vitals
  LCP: 2.5,  // Largest Contentful Paint (seconds)
  FID: 100,  // First Input Delay (milliseconds)
  CLS: 0.1,  // Cumulative Layout Shift
  
  // Custom Metrics
  TTI: 3.5,  // Time to Interactive (seconds)
  FMP: 2.0,  // First Meaningful Paint (seconds)
  
  // Bundle Size
  initialBundle: 200,  // KB (gzipped)
  lazyChunks: 50,     // KB per chunk
  
  // Runtime Performance
  listRender: 16,     // ms for 100 items
  formValidation: 50, // ms
  search: 200        // ms
};
```

---

## 9. Design Handoff

### 9.1 Design Tokens
```json
{
  "tokens": {
    "color": {
      "primary": {
        "value": "#2563EB",
        "type": "color"
      }
    },
    "spacing": {
      "sm": {
        "value": "8px",
        "type": "spacing"
      }
    },
    "typography": {
      "heading1": {
        "value": {
          "fontFamily": "Pretendard",
          "fontSize": "30px",
          "fontWeight": "700",
          "lineHeight": "1.25"
        },
        "type": "typography"
      }
    }
  }
}
```

### 9.2 Component Specifications
```typescript
// Example: Button Component Spec
const ButtonSpec = {
  variants: ['contained', 'outlined', 'text'],
  sizes: ['small', 'medium', 'large'],
  states: ['default', 'hover', 'active', 'disabled', 'loading'],
  
  properties: {
    small: {
      height: 32,
      padding: '6px 12px',
      fontSize: 14
    },
    medium: {
      height: 40,
      padding: '8px 16px',
      fontSize: 16
    },
    large: {
      height: 48,
      padding: '12px 24px',
      fontSize: 18
    }
  },
  
  animations: {
    hover: 'background-color 200ms ease',
    click: 'scale(0.98) 100ms ease'
  }
};
```

---

## 📋 체크리스트

### Design Review Checklist
- [ ] 모든 주요 사용자 플로우 정의
- [ ] 와이어프레임 작성 완료
- [ ] 디자인 시스템 구축
- [ ] 프로토타입 제작
- [ ] 사용성 테스트 계획
- [ ] 접근성 검토
- [ ] 반응형 디자인 검증
- [ ] 성능 목표 설정

### Development Handoff
- [ ] 디자인 토큰 정의
- [ ] 컴포넌트 명세 작성
- [ ] 애니메이션 가이드
- [ ] 아이콘 세트 준비
- [ ] 에셋 최적화
- [ ] 스타일 가이드 문서화

---

*이 문서를 검토하고 필요한 UI/UX 요구사항을 추가해 주세요.*