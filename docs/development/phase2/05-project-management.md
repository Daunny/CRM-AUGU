# Project Management Module 구현

## 구현 일자
2025-01-14

## 개요
CRM AUGU Phase 2의 마지막 모듈인 Project Management 시스템을 구현했습니다. 이 모듈은 프로젝트 생명주기 전체를 관리하며, 마일스톤, 리스크, 예산, 리소스, 딜리버러블 관리 기능을 포함합니다.

## 구현 내역

### 1. 데이터베이스 스키마

#### 새로운 모델 추가
```prisma
// 마일스톤 관리
model Milestone {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  name        String
  description String?
  dueDate     DateTime  @map("due_date")
  status      MilestoneStatus @default(PENDING)
  progress    Int       @default(0)
  priority    Priority  @default(MEDIUM)
  completedAt DateTime? @map("completed_at")
  // ... relations
}

// 마일스톤 의존성
model MilestoneDependency {
  id              String   @id @default(uuid())
  milestoneId     String   @map("milestone_id")
  dependsOnId     String   @map("depends_on_id")
  lagDays         Int      @default(0)
}

// 프로젝트 딜리버러블
model ProjectDeliverable {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  milestoneId String?   @map("milestone_id")
  name        String
  type        DeliverableType
  status      DeliverableStatus @default(PENDING)
  dueDate     DateTime? @map("due_date")
  deliveredAt DateTime? @map("delivered_at")
}

// 프로젝트 리스크
model ProjectRisk {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  title       String
  category    RiskCategory
  probability RiskLevel
  impact      RiskLevel
  score       Int?
  mitigation  String?
  status      RiskStatus @default(IDENTIFIED)
}

// 프로젝트 예산
model ProjectBudget {
  id            String    @id @default(uuid())
  projectId     String    @map("project_id")
  category      BudgetCategory
  plannedAmount Float     @map("planned_amount")
  actualAmount  Float     @default(0) @map("actual_amount")
}

// 프로젝트 리소스
model ProjectResource {
  id           String    @id @default(uuid())
  projectId    String    @map("project_id")
  resourceType ResourceType @map("resource_type")
  name         String
  quantity     Int       @default(1)
  status       ResourceStatus @default(AVAILABLE)
}
```

#### 새로운 Enum 추가
- MilestoneStatus: PENDING, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
- DeliverableType: REPORT, PRESENTATION, TRAINING_MATERIAL, ASSESSMENT, CERTIFICATE, CONTRACT, OTHER
- DeliverableStatus: PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, DELIVERED
- RiskCategory: SCHEDULE, BUDGET, RESOURCE, TECHNICAL, QUALITY, EXTERNAL, ORGANIZATIONAL
- RiskLevel: VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
- RiskStatus: IDENTIFIED, ANALYZING, MITIGATING, RESOLVED, ACCEPTED
- BudgetCategory: LABOR, MATERIAL, EQUIPMENT, TRAVEL, VENUE, CATERING, MARKETING, OTHER
- ResourceType: HUMAN, EQUIPMENT, FACILITY, MATERIAL, SOFTWARE, OTHER
- ResourceStatus: AVAILABLE, ALLOCATED, IN_USE, MAINTENANCE, UNAVAILABLE

### 2. 서비스 레이어

#### project.service.ts 업데이트
```typescript
// 프로젝트 생성 (트랜잭션 사용)
async createProject(input: CreateProjectDto, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 프로젝트 코드 자동 생성
    // 프로젝트 생성
    // 프로젝트 매니저 멤버로 추가
    // 초기 마일스톤 생성
    // 기회를 WON으로 업데이트
    // 알림 발송
  });
}

// 마일스톤 관리
async createMilestone(projectId: string, input: CreateMilestoneDto, userId: string)
async updateMilestone(id: string, input: UpdateMilestoneDto, userId: string)
async deleteMilestone(id: string)

// 리스크 관리
async createProjectRisk(projectId: string, input: CreateProjectRiskDto)
async updateProjectRisk(id: string, input: any)

// 예산 관리
async createProjectBudget(projectId: string, input: CreateProjectBudgetDto)
async updateProjectBudget(id: string, input: any)

// 리소스 관리
async allocateResource(projectId: string, input: CreateProjectResourceDto)
async updateResourceAllocation(id: string, input: any)
async releaseResource(id: string)

// 딜리버러블 관리
async createDeliverable(projectId: string, input: CreateProjectDeliverableDto)
async updateDeliverable(id: string, input: any)
```

#### 헬퍼 메서드
```typescript
// 리스크 점수 계산
private calculateRiskScore(probability: string, impact: string): number

// 프로젝트 헬스 업데이트
private async updateProjectHealth(projectId: string, health: string)

// 프로젝트 진행률 업데이트
private async updateProjectProgress(projectId: string)

// 마일스톤 진행률 업데이트
private async updateMilestoneProgress(milestoneId: string)

// 예산 초과 체크
private async checkBudgetOverrun(projectId: string)
```

### 3. API 엔드포인트

#### 프로젝트 관리
- POST /api/projects - 프로젝트 생성
- GET /api/projects - 프로젝트 목록 조회
- GET /api/projects/:id - 프로젝트 상세 조회
- PUT /api/projects/:id - 프로젝트 수정
- DELETE /api/projects/:id - 프로젝트 삭제

#### 마일스톤 관리
- POST /api/projects/:projectId/milestones - 마일스톤 생성
- PUT /api/projects/milestones/:id - 마일스톤 수정
- DELETE /api/projects/milestones/:id - 마일스톤 삭제

#### 리스크 관리
- POST /api/projects/:projectId/risks - 리스크 생성
- PUT /api/projects/risks/:id - 리스크 수정

#### 예산 관리
- POST /api/projects/:projectId/budgets - 예산 항목 생성
- PUT /api/projects/budgets/:id - 예산 항목 수정

#### 리소스 관리
- POST /api/projects/:projectId/resources - 리소스 할당
- PUT /api/projects/resources/:id - 리소스 할당 수정
- DELETE /api/projects/resources/:id - 리소스 해제

#### 딜리버러블 관리
- POST /api/projects/:projectId/deliverables - 딜리버러블 생성
- PUT /api/projects/deliverables/:id - 딜리버러블 수정

#### 프로젝트 멤버 관리
- POST /api/projects/members - 멤버 추가
- GET /api/projects/:projectId/members - 멤버 목록
- DELETE /api/projects/:projectId/members/:userId - 멤버 제거

#### 교육 세션 관리
- POST /api/projects/sessions - 세션 생성
- GET /api/projects/:projectId/sessions - 세션 목록
- PUT /api/projects/sessions/:id - 세션 수정

#### 교육 클래스 관리
- POST /api/projects/classes - 클래스 생성
- GET /api/projects/sessions/:sessionId/classes - 클래스 목록
- PUT /api/projects/classes/:id - 클래스 수정

### 4. 주요 기능

#### 1. 프로젝트 생애주기 관리
- 프로젝트 단계별 관리 (INITIATION → PLANNING → EXECUTION → MONITORING → CLOSING)
- 프로젝트 헬스 모니터링 (GREEN, YELLOW, RED)
- 자동 진행률 계산 (마일스톤 + 태스크 기반)

#### 2. 마일스톤 및 의존성 관리
- 마일스톤 간 의존성 설정
- Lag days 설정 지원
- 마일스톤 진행률 자동 계산
- Critical Path 계산 기능

#### 3. 리스크 관리
- 리스크 매트릭스 (Probability × Impact)
- 리스크 점수 자동 계산
- 리스크 상태 추적 (IDENTIFIED → ANALYZING → MITIGATING → RESOLVED)
- 고위험 리스크 시 프로젝트 헬스 자동 업데이트

#### 4. 예산 관리
- 카테고리별 예산 관리
- 계획 vs 실제 비용 추적
- 예산 초과 자동 감지 및 알림
- 예산 초과 시 프로젝트 헬스 자동 업데이트

#### 5. 리소스 관리
- 리소스 타입별 관리 (인력, 장비, 시설, 자재, 소프트웨어 등)
- 리소스 할당 및 해제
- 리소스 상태 추적
- 리소스 활용도 계산

#### 6. 딜리버러블 관리
- 마일스톤과 연결된 딜리버러블
- 딜리버러블 상태 추적
- 딜리버러블 완료 시 마일스톤 진행률 자동 업데이트

### 5. 비즈니스 로직

#### 프로젝트 진행률 계산
```typescript
const overallProgress = Math.round(
  (milestoneProgress * 0.6) + (taskProgress * 0.4)
);
```

#### 리스크 점수 계산
```typescript
riskScore = probability(1-5) × impact(1-5)
// High Risk: score >= 15
// Medium Risk: score 8-14
// Low Risk: score < 8
```

#### 예산 초과 감지
```typescript
if (actualCost > budget) {
  const overrunPercent = ((actualCost - budget) / budget) * 100;
  health = overrunPercent > 20 ? 'RED' : 'YELLOW';
}
```

### 6. 캐싱 전략
- 프로젝트 목록: 5분 캐싱
- 프로젝트 상세: 캐시 무효화 on update
- 대시보드 데이터: 2분 캐싱

### 7. 알림 시스템
- 프로젝트 할당 알림
- 예산 초과 알림
- 마일스톤 만료 알림
- 리스크 에스컬레이션 알림

## 테스트 시나리오

### 1. 프로젝트 생성 및 관리
```bash
# 프로젝트 생성
POST /api/projects
{
  "name": "신입사원 온보딩 프로그램",
  "companyId": "company-id",
  "type": "ONBOARDING",
  "startDate": "2025-02-01",
  "endDate": "2025-03-31",
  "budget": 10000000,
  "milestones": [
    {
      "name": "커리큘럼 개발",
      "dueDate": "2025-02-15"
    },
    {
      "name": "강사 섭외",
      "dueDate": "2025-02-20"
    }
  ]
}
```

### 2. 리스크 관리
```bash
# 리스크 등록
POST /api/projects/:projectId/risks
{
  "title": "강사 일정 조율 실패",
  "category": "RESOURCE",
  "probability": "MEDIUM",
  "impact": "HIGH",
  "mitigation": "대체 강사 풀 확보"
}
```

### 3. 예산 관리
```bash
# 예산 항목 추가
POST /api/projects/:projectId/budgets
{
  "category": "LABOR",
  "description": "강사료",
  "plannedAmount": 5000000,
  "actualAmount": 0
}
```

## 파일 구조
```
backend/
├── prisma/
│   └── schema.prisma (업데이트)
├── src/
│   ├── services/
│   │   └── project.service.ts (업데이트)
│   ├── controllers/
│   │   └── project.controller.ts (업데이트)
│   ├── routes/
│   │   └── project.routes.ts (업데이트)
│   └── types/
│       └── project.types.ts (신규)
```

## 개선 필요사항
1. 프로젝트 템플릿 기능
2. 간트 차트 데이터 생성
3. 프로젝트 복사 기능
4. 일괄 리소스 할당
5. 리스크 대응 계획 자동화
6. 예산 예측 기능
7. 프로젝트 포트폴리오 분석

## 다음 단계
- Phase 3: Advanced Features
  - 대시보드 및 리포트
  - 실시간 알림
  - 파일 업로드
  - 이메일 연동