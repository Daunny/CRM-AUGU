# CRM AUGU - 모듈별 상세 기능 명세서

## 📑 문서 정보
- **버전**: 1.0.0
- **작성일**: 2025-08-13
- **대상**: Phase 2 Development
- **상태**: Draft (검토 필요)

---

## 1. Customer Module (고객 관리) - 3계층 구조

### 1.1 데이터 모델 (3-Tier Hierarchy)
```typescript
// Level 1: 회사 (Company)
interface Company {
  // 기본 정보
  id: string;
  companyName: string;              // 회사명
  businessNumber: string;           // 사업자번호
  representative: string;           // 대표자명
  headquartersAddress: Address;     // 본사 주소
  
  // 분류 정보
  industry: Industry;               // 산업 분류
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'BRONZE';
  type: 'B2B' | 'B2C' | 'B2G';     // 고객 유형
  
  // 관리 정보
  accountManagerId: string;         // 담당자
  status: CustomerStatus;           // 상태
  lifecycleStage: LifecycleStage;  // 생명주기
  
  // 비즈니스 정보
  annualRevenue?: number;           // 연간 거래액
  employeeCount?: number;           // 직원 수
  creditLimit?: number;             // 신용 한도
  paymentTerms?: number;            // 결제 조건 (일)
  
  // 연락처 정보
  address: Address;                 // 주소
  phone: string;                    // 대표 전화
  email: string;                    // 대표 이메일
  website?: string;                 // 웹사이트
  
  // 메타 정보
  tags: string[];                   // 태그
  customFields: Record<string, any>; // 사용자 정의 필드
  
  // 시스템 정보
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Level 2: 사업장 (Branch/Division)
interface Branch {
  id: string;
  companyId: string;                // 소속 회사
  branchName: string;               // 사업장명
  branchType: 'HEADQUARTERS' | 'BRANCH' | 'FACTORY' | 'LAB' | 'OFFICE';
  branchCode: string;               // 사업장 코드
  
  // 사업장 정보
  address: Address;                 // 사업장 주소
  phone: string;                    // 대표 전화
  fax?: string;                     // 팩스
  email: string;                    // 대표 이메일
  
  // 관리 정보
  branchManager: string;            // 사업장 책임자
  employeeCount: number;            // 직원 수
  businessScope: string[];          // 사업 영역
  annualRevenue?: number;           // 사업장 연매출
  
  // 시스템 정보
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Level 3: 담당자 (Contact)
interface Contact {
  id: string;
  branchId: string;                 // 소속 사업장
  companyId: string;                // 소속 회사 (for quick reference)
  
  // 개인 정보
  firstName: string;
  lastName: string;
  fullName: string;                 // 전체 이름
  
  // 직무 정보
  position: string;                 // 직책
  department: string;               // 부서
  role: ContactRole;                // 의사결정 역할
  
  // 연락처
  email: string;
  phone: string;                    // 사무실 전화
  mobile?: string;                  // 휴대폰
  
  // 관계 정보
  isPrimary: boolean;               // 주요 담당자 여부
  influence: 'HIGH' | 'MEDIUM' | 'LOW';  // 영향력
  relationship: 'CHAMPION' | 'SUPPORTIVE' | 'NEUTRAL' | 'DETRACTOR';
  
  // 활동 정보
  lastContactedAt?: Date;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'MEETING';
  notes?: string;
  
  // 시스템 정보
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum CustomerStatus {
  PROSPECT = "잠재고객",
  ACTIVE = "활성",
  INACTIVE = "비활성",
  CHURNED = "이탈"
}

enum LifecycleStage {
  LEAD = "리드",
  QUALIFIED = "검증됨",
  OPPORTUNITY = "기회",
  CUSTOMER = "고객",
  EVANGELIST = "홍보대사"
}
```

### 1.2 핵심 기능

#### 1.2.1 고객 등록 및 관리
```typescript
class CustomerService {
  // 고객 생성 with 사업자번호 검증
  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    // 1. 사업자번호 검증 (국세청 API)
    const isValid = await this.validateBusinessNumber(data.businessNumber);
    if (!isValid) throw new ValidationError('Invalid business number');
    
    // 2. 중복 체크
    const existing = await this.checkDuplicate(data.businessNumber);
    if (existing) throw new ConflictError('Customer already exists');
    
    // 3. 자동 분류 (산업, 규모)
    const classification = await this.autoClassify(data);
    
    // 4. 담당자 자동 배정
    const manager = await this.assignManager(classification);
    
    // 5. 고객 생성
    return await this.repository.create({
      ...data,
      ...classification,
      accountManagerId: manager.id,
      tier: this.calculateInitialTier(data),
      status: CustomerStatus.PROSPECT
    });
  }
  
  // 고객 등급 자동 계산
  calculateCustomerTier(customer: Customer): CustomerTier {
    const score = {
      revenue: this.scoreRevenue(customer.annualRevenue),
      frequency: this.scoreFrequency(customer.projectCount),
      recency: this.scoreRecency(customer.lastProjectDate),
      payment: this.scorePayment(customer.paymentHistory),
      satisfaction: this.scoreSatisfaction(customer.npsScore)
    };
    
    const total = Object.values(score).reduce((a, b) => a + b, 0);
    
    if (total >= 90) return 'VIP';
    if (total >= 70) return 'GOLD';
    if (total >= 50) return 'SILVER';
    return 'BRONZE';
  }
}
```

#### 1.2.2 360도 고객 뷰
```typescript
interface Customer360View {
  // 기본 정보
  profile: CustomerProfile;
  
  // 관계 정보
  contacts: Contact[];              // 담당자들
  opportunities: Opportunity[];     // 영업 기회
  projects: Project[];              // 프로젝트
  contracts: Contract[];            // 계약
  
  // 커뮤니케이션
  interactions: Interaction[];      // 모든 상호작용
  emails: EmailThread[];           // 이메일 스레드
  meetings: Meeting[];             // 미팅 기록
  calls: CallLog[];                // 통화 기록
  
  // 재무 정보
  invoices: Invoice[];             // 청구서
  payments: Payment[];             // 결제 내역
  creditInfo: CreditInfo;          // 신용 정보
  
  // 분석 정보
  healthScore: number;             // 건강도 점수
  churnRisk: ChurnRisk;          // 이탈 위험도
  ltv: number;                    // 생애 가치
  satisfaction: SatisfactionScore; // 만족도
  
  // 타임라인
  timeline: TimelineEvent[];       // 모든 이벤트 시간순
}
```

### 1.3 자동화 규칙

#### 1.3.1 고객 건강도 모니터링
```typescript
interface CustomerHealthScore {
  score: number;  // 0-100
  
  factors: {
    engagement: {
      weight: 0.3;
      score: number;
      signals: {
        loginFrequency: number;
        featureUsage: number;
        supportTickets: number;
      };
    };
    
    satisfaction: {
      weight: 0.25;
      score: number;
      signals: {
        npsScore: number;
        csatScore: number;
        reviewRating: number;
      };
    };
    
    financial: {
      weight: 0.25;
      score: number;
      signals: {
        paymentTimeliness: number;
        contractRenewal: number;
        upsellSuccess: number;
      };
    };
    
    relationship: {
      weight: 0.2;
      score: number;
      signals: {
        championPresence: boolean;
        executiveMeetings: number;
        referrals: number;
      };
    };
  };
  
  alerts: {
    level: 'CRITICAL' | 'WARNING' | 'NORMAL';
    actions: string[];
  };
}
```

---

## 2. Opportunity Module (영업 기회 관리)

### 2.1 데이터 모델
```typescript
interface Opportunity {
  // 기본 정보
  id: string;
  title: string;
  description: string;
  type: 'NEW_BUSINESS' | 'UPSELL' | 'RENEWAL';
  
  // 관계 정보
  customerId: string;
  contactIds: string[];
  accountManagerId: string;
  
  // 영업 정보
  stage: OpportunityStage;
  probability: number;              // 성공 확률 (%)
  amount: number;                   // 예상 금액
  expectedAmount: number;           // 가중 금액 (amount * probability)
  expectedCloseDate: Date;          // 예상 마감일
  actualCloseDate?: Date;          // 실제 마감일
  
  // 경쟁 정보
  competitors: Competitor[];
  winLossReason?: string;
  
  // 제안 정보
  proposalId?: string;
  quotationId?: string;
  contractId?: string;
  
  // 추적 정보
  source: LeadSource;              // 기회 출처
  campaign?: string;               // 캠페인
  tags: string[];
  
  // 협업 정보
  teamMembers: TeamMember[];       // 참여 팀원
  activities: Activity[];          // 활동 내역
  notes: Note[];                   // 메모
  
  // 메타 정보
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

interface OpportunityStageCriteria {
  QUALIFYING: {
    required: ['budget_confirmed', 'decision_maker_identified'];
    duration: 7;  // days
  };
  NEEDS_ANALYSIS: {
    required: ['requirements_documented', 'solution_mapped'];
    duration: 14;
  };
  PROPOSAL: {
    required: ['proposal_sent', 'presentation_completed'];
    duration: 7;
  };
  NEGOTIATION: {
    required: ['terms_agreed', 'contract_drafted'];
    duration: 14;
  };
}
```

### 2.2 핵심 기능

#### 2.2.1 영업 파이프라인 관리
```typescript
class OpportunityPipeline {
  // 파이프라인 현황
  async getPipelineStatus(): Promise<PipelineStatus> {
    return {
      stages: {
        qualifying: {
          count: 25,
          value: 500000000,
          avgAge: 5,  // days
          conversion: 0.75
        },
        needsAnalysis: {
          count: 15,
          value: 350000000,
          avgAge: 12,
          conversion: 0.65
        },
        proposal: {
          count: 10,
          value: 250000000,
          avgAge: 8,
          conversion: 0.55
        },
        negotiation: {
          count: 5,
          value: 150000000,
          avgAge: 10,
          conversion: 0.85
        }
      },
      
      metrics: {
        totalOpportunities: 55,
        totalValue: 1250000000,
        weightedValue: 687500000,
        avgDealSize: 22727272,
        avgSalesCycle: 35,
        winRate: 0.32
      },
      
      forecast: {
        thisMonth: 150000000,
        thisQuarter: 450000000,
        thisYear: 1800000000,
        confidence: 0.75
      }
    };
  }
  
  // 단계 이동 검증
  async moveStage(
    opportunityId: string, 
    newStage: OpportunityStage
  ): Promise<void> {
    const opportunity = await this.get(opportunityId);
    
    // 1. 단계 순서 검증
    if (!this.isValidTransition(opportunity.stage, newStage)) {
      throw new ValidationError('Invalid stage transition');
    }
    
    // 2. 필수 조건 검증
    const criteria = this.getStageCriteria(newStage);
    const missing = this.checkCriteria(opportunity, criteria);
    
    if (missing.length > 0) {
      throw new ValidationError(`Missing criteria: ${missing.join(', ')}`);
    }
    
    // 3. 확률 자동 조정
    opportunity.probability = this.getDefaultProbability(newStage);
    
    // 4. 알림 발송
    await this.notifyStageChange(opportunity, newStage);
    
    // 5. 업데이트
    await this.update(opportunityId, { 
      stage: newStage,
      probability: opportunity.probability
    });
  }
}
```

#### 2.2.2 AI 기반 영업 예측
```typescript
class OpportunityPrediction {
  // 성공 확률 예측
  async predictWinProbability(opportunity: Opportunity): Promise<PredictionResult> {
    const features = {
      // 고객 특성
      customerTier: this.encodeCustomerTier(opportunity.customer),
      customerHistory: this.getCustomerHistory(opportunity.customerId),
      industryWinRate: this.getIndustryWinRate(opportunity.customer.industry),
      
      // 거래 특성
      dealSize: opportunity.amount,
      dealComplexity: this.calculateComplexity(opportunity),
      competitionLevel: opportunity.competitors.length,
      
      // 영업 활동
      engagementScore: this.calculateEngagement(opportunity.activities),
      responseTime: this.avgResponseTime(opportunity.interactions),
      stakeholderCount: opportunity.contactIds.length,
      
      // 시간 요소
      ageInStage: this.daysInCurrentStage(opportunity),
      totalAge: this.totalDays(opportunity),
      urgency: this.calculateUrgency(opportunity.expectedCloseDate)
    };
    
    const prediction = await this.mlModel.predict(features);
    
    return {
      probability: prediction.probability,
      confidence: prediction.confidence,
      factors: prediction.importantFactors,
      recommendations: this.generateRecommendations(prediction),
      riskFactors: this.identifyRisks(prediction)
    };
  }
  
  // 최적 다음 액션 추천
  async recommendNextAction(opportunity: Opportunity): Promise<ActionRecommendation[]> {
    const context = await this.analyzeContext(opportunity);
    
    return [
      {
        action: 'EXECUTIVE_MEETING',
        priority: 'HIGH',
        reason: 'No executive engagement in last 30 days',
        impact: '+15% win probability',
        template: this.getTemplate('executive_meeting_request')
      },
      {
        action: 'COMPETITIVE_ANALYSIS',
        priority: 'MEDIUM',
        reason: 'Competitor mentioned in last call',
        impact: 'Risk mitigation',
        template: this.getTemplate('competitive_battlecard')
      }
    ];
  }
}
```

### 2.3 자동화 워크플로

#### 2.3.1 영업 프로세스 자동화
```typescript
class OpportunityAutomation {
  workflows = {
    // 리드 스코어 기반 자동 생성
    leadConversion: {
      trigger: 'LEAD_SCORE >= 80',
      actions: [
        'CREATE_OPPORTUNITY',
        'ASSIGN_ACCOUNT_MANAGER',
        'SEND_WELCOME_EMAIL',
        'SCHEDULE_DISCOVERY_CALL'
      ]
    },
    
    // 단계별 자동 작업
    stageActions: {
      QUALIFYING: [
        'SEND_CAPABILITY_DECK',
        'SCHEDULE_NEEDS_ASSESSMENT'
      ],
      NEEDS_ANALYSIS: [
        'CREATE_SOLUTION_BLUEPRINT',
        'IDENTIFY_STAKEHOLDERS'
      ],
      PROPOSAL: [
        'GENERATE_PROPOSAL',
        'SCHEDULE_PRESENTATION',
        'PREPARE_ROI_ANALYSIS'
      ],
      NEGOTIATION: [
        'DRAFT_CONTRACT',
        'INVOLVE_LEGAL_TEAM',
        'PREPARE_NEGOTIATION_STRATEGY'
      ]
    },
    
    // 정체 기회 관리
    stagnantOpportunity: {
      trigger: 'DAYS_IN_STAGE > STAGE_SLA',
      actions: [
        'SEND_ALERT_TO_MANAGER',
        'ESCALATE_TO_DIRECTOR',
        'SUGGEST_REVIVAL_TACTICS'
      ]
    }
  };
}
```

---

## 3. Project Module (프로젝트 관리) - HRD 특화

### 3.1 데이터 모델 (차수/분반 구조)
```typescript
interface HRDProject {
  // 기본 정보
  id: string;
  code: string;                    // 프로젝트 코드
  name: string;
  description: string;
  type: 'LEADERSHIP' | 'SALES' | 'CS' | 'TECHNICAL' | 'ONBOARDING';
  
  // 관계 정보
  customerId: string;
  contractId: string;
  opportunityId: string;
  
  // 담당자 배정 (프로젝트 생성시)
  assignments: {
    projectManager: {
      userId: string;
      name: string;
      assignedAt: Date;
      approvedBy: string;
    };
    operationManager: {
      userId: string;
      name: string;
      assignedAt: Date;
    };
    salesRep: {
      userId: string;
      name: string;
    };
  };
  
  // 프로젝트 일정
  projectSchedule: {
    plannedStartDate: Date;
    plannedEndDate: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    totalDuration: number;        // 일수
  };
  
  // 재무 정보
  budget: Budget;
  actualCost: number;
  revenue: number;
  margin: number;
  
  // 진행 정보
  status: ProjectStatus;
  phase: ProjectPhase;
  progress: number;                // 진행률 (%)
  health: 'GREEN' | 'YELLOW' | 'RED';
  
  // 리소스 정보
  team: TeamMember[];
  resources: Resource[];
  
  // 차수 (Sessions) - HRD 특화
  sessions: TrainingSession[];
  
  // 교육 정보
  curriculum: {
    modules: CurriculumModule[];
    totalHours: number;
    methodology: string[];
  };
  
  // 산출물
  deliverables: Deliverable[];
  milestones: Milestone[];
  
  // 리스크 관리
  risks: Risk[];
  issues: Issue[];
  changes: ChangeRequest[];
}

// 교육 차수 (Training Session/Round)
interface TrainingSession {
  id: string;
  projectId: string;
  sessionNumber: number;           // 차수 번호 (1차, 2차...)
  sessionName: string;             // 차수명
  
  // 차수 일정
  schedule: {
    startDate: Date;
    endDate: Date;
    trainingDays: number;         // 실제 교육일수
    trainingHours: number;        // 총 교육시간
  };
  
  // 차수 담당자
  coordinator: {
    userId: string;
    name: string;
    role: 'SESSION_COORDINATOR';
    responsibilities: string[];
  };
  
  // 분반 (Classes)
  classes: TrainingClass[];
  
  // 차수 통계
  statistics: {
    totalParticipants: number;
    totalClasses: number;
    completionRate: number;
    satisfactionScore: number;
  };
  
  status: 'PLANNED' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// 교육 분반 (Training Class)
interface TrainingClass {
  id: string;
  sessionId: string;
  classCode: string;               // 분반 코드 (A, B, C...)
  className: string;               // 분반명
  
  // 분반 정보
  capacity: number;                // 정원
  enrolled: number;                // 등록 인원
  
  // 강사 배정
  instructor: {
    instructorId: string;
    name: string;
    expertise: string[];
    assignedAt: Date;
    confirmedAt?: Date;
  };
  
  // 수강생
  participants: {
    id: string;
    name: string;
    company: string;
    department: string;
    position: string;
    email: string;
    phone: string;
    attendanceRate?: number;
    completionStatus?: 'COMPLETED' | 'INCOMPLETE' | 'DROPPED';
  }[];
  
  // 교육장
  venue: {
    locationId: string;
    name: string;
    address: string;
    room: string;
    capacity: number;
    facilities: string[];
  };
  
  // 일정
  schedule: {
    date: Date;
    startTime: string;
    endTime: string;
    topic: string;
    materials: string[];
  }[];
  
  // 평가
  evaluation?: {
    conducted: boolean;
    responseRate: number;
    scores: {
      instructor: number;
      content: number;
      facility: number;
      overall: number;
    };
    feedback: string[];
  };
}

interface ProjectTemplate {
  type: 'LEADERSHIP' | 'SALES' | 'CS' | 'COMMUNICATION' | 'CUSTOM';
  
  structure: {
    phases: Phase[];
    tasks: TaskTemplate[];
    deliverables: DeliverableTemplate[];
    milestones: MilestoneTemplate[];
  };
  
  resources: {
    roles: RoleRequirement[];
    skills: SkillRequirement[];
    tools: string[];
  };
  
  duration: {
    standard: number;
    minimum: number;
    maximum: number;
  };
}
```

### 3.2 핵심 기능

#### 3.2.1 프로젝트 계획 및 일정 관리
```typescript
class ProjectPlanning {
  // WBS 기반 프로젝트 생성
  async createProjectFromTemplate(
    templateId: string,
    customization: ProjectCustomization
  ): Promise<Project> {
    const template = await this.getTemplate(templateId);
    
    // 1. WBS 구조 생성
    const wbs = this.generateWBS(template, customization);
    
    // 2. 일정 계산 (Critical Path Method)
    const schedule = this.calculateSchedule(wbs, customization.constraints);
    
    // 3. 리소스 할당
    const resources = await this.allocateResources(wbs, schedule);
    
    // 4. 예산 계산
    const budget = this.calculateBudget(resources, schedule);
    
    // 5. 리스크 식별
    const risks = this.identifyRisks(wbs, resources, schedule);
    
    return this.createProject({
      wbs,
      schedule,
      resources,
      budget,
      risks
    });
  }
  
  // Critical Path 계산
  calculateCriticalPath(tasks: Task[]): CriticalPath {
    // Forward Pass - Early Start/Finish 계산
    tasks.forEach(task => {
      task.earlyStart = this.calculateEarlyStart(task);
      task.earlyFinish = task.earlyStart + task.duration;
    });
    
    // Backward Pass - Late Start/Finish 계산
    tasks.reverse().forEach(task => {
      task.lateFinish = this.calculateLateFinish(task);
      task.lateStart = task.lateFinish - task.duration;
    });
    
    // Float 계산 및 Critical Path 식별
    const criticalTasks = tasks.filter(task => {
      task.float = task.lateStart - task.earlyStart;
      return task.float === 0;
    });
    
    return {
      tasks: criticalTasks,
      duration: Math.max(...tasks.map(t => t.earlyFinish)),
      risk: this.assessScheduleRisk(criticalTasks)
    };
  }
}
```

#### 3.2.2 리소스 관리 및 최적화
```typescript
class ResourceManagement {
  // 스마트 강사 매칭
  async matchInstructor(requirement: InstructorRequirement): Promise<InstructorMatch[]> {
    const candidates = await this.getAvailableInstructors(requirement.dates);
    
    const scores = candidates.map(instructor => {
      const score = {
        instructor,
        
        // 역량 매칭 (40%)
        skillMatch: this.calculateSkillMatch(
          instructor.skills,
          requirement.requiredSkills
        ) * 0.4,
        
        // 경험 매칭 (25%)
        experienceMatch: this.calculateExperienceMatch(
          instructor.experience,
          requirement.industryType,
          requirement.audienceLevel
        ) * 0.25,
        
        // 성과 점수 (20%)
        performanceScore: (instructor.avgRating / 5) * 0.2,
        
        // 가용성 (10%)
        availability: this.calculateAvailability(
          instructor.schedule,
          requirement.dates
        ) * 0.1,
        
        // 거리/비용 (5%)
        logistics: this.calculateLogistics(
          instructor.location,
          requirement.location,
          instructor.dailyRate
        ) * 0.05
      };
      
      score.total = Object.values(score)
        .filter(v => typeof v === 'number')
        .reduce((a, b) => a + b, 0);
        
      return score;
    });
    
    return scores
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(s => ({
        instructor: s.instructor,
        matchScore: s.total,
        breakdown: {
          skill: s.skillMatch,
          experience: s.experienceMatch,
          performance: s.performanceScore,
          availability: s.availability,
          logistics: s.logistics
        },
        recommendation: this.generateRecommendation(s)
      }));
  }
  
  // 리소스 평준화
  async levelResources(project: Project): Promise<ResourcePlan> {
    const tasks = await this.getProjectTasks(project.id);
    const resources = await this.getProjectResources(project.id);
    
    // 리소스 히스토그램 생성
    const histogram = this.createResourceHistogram(tasks, resources);
    
    // 과부하 기간 식별
    const overloads = this.identifyOverloads(histogram);
    
    // 평준화 알고리즘 적용
    const optimized = this.applyLevelingAlgorithm(
      tasks,
      resources,
      overloads,
      {
        method: 'RESOURCE_CONSTRAINED', // vs TIME_CONSTRAINED
        priority: 'MINIMIZE_DURATION',   // vs MINIMIZE_COST
        constraints: project.constraints
      }
    );
    
    return {
      original: histogram,
      optimized: optimized.histogram,
      changes: optimized.changes,
      impact: {
        duration: optimized.duration - project.duration,
        cost: optimized.cost - project.budget,
        risk: this.assessImpact(optimized.changes)
      }
    };
  }
}
```

### 3.3 프로젝트 모니터링 및 제어

#### 3.3.1 Earned Value Management (EVM)
```typescript
class ProjectMonitoring {
  calculateEVM(project: Project): EVMMetrics {
    const today = new Date();
    const elapsed = this.getElapsedDays(project.startDate, today);
    const total = this.getTotalDays(project.startDate, project.endDate);
    
    // 기본 메트릭
    const PV = project.budget * (elapsed / total);  // Planned Value
    const EV = project.budget * project.progress;    // Earned Value  
    const AC = project.actualCost;                   // Actual Cost
    
    // 차이 분석
    const CV = EV - AC;  // Cost Variance
    const SV = EV - PV;  // Schedule Variance
    
    // 성과 지표
    const CPI = EV / AC;  // Cost Performance Index
    const SPI = EV / PV;  // Schedule Performance Index
    
    // 예측
    const EAC = project.budget / CPI;  // Estimate at Completion
    const ETC = EAC - AC;               // Estimate to Complete
    const VAC = project.budget - EAC;   // Variance at Completion
    
    // 건강도 평가
    let health: ProjectHealth;
    if (CPI >= 0.95 && SPI >= 0.95) health = 'GREEN';
    else if (CPI >= 0.85 && SPI >= 0.85) health = 'YELLOW';
    else health = 'RED';
    
    return {
      basics: { PV, EV, AC },
      variances: { CV, SV },
      indices: { CPI, SPI },
      forecasts: { EAC, ETC, VAC },
      health,
      recommendations: this.generateEVMRecommendations({ CPI, SPI, CV, SV })
    };
  }
}
```

---

## 4. Meeting Management Module (미팅 관리) - 전략적 기록

### 4.1 미팅 분류 체계
```typescript
interface MeetingHierarchy {
  // Top Level: 미팅 대상별 분류
  byTarget: {
    CUSTOMER: {
      description: '고객사와의 외부 미팅';
      stages: ['INITIAL', 'CONSULTATION', 'OPERATION', 'FOLLOWUP'];
    };
    INTERNAL: {
      description: '내부 조직 및 파트너 미팅';
      types: ['TEAM', 'CROSS_DEPT', 'PARTNER', 'MANAGEMENT'];
    };
  };
  
  // Customer Meeting Lifecycle
  customerMeetingLifecycle: {
    INITIAL: {
      objective: 'Relationship Building & Discovery';
      keyOutputs: ['BANT Score', 'Needs Map', 'Next Steps'];
      templates: ['Initial Meeting Template'];
    };
    CONSULTATION: {
      objective: 'Solution Presentation & Negotiation';
      keyOutputs: ['Proposal', 'ROI Analysis', 'Competition Analysis'];
      templates: ['Proposal Meeting Template'];
    };
    OPERATION: {
      objective: 'Project Execution & Management';
      keyOutputs: ['Progress Report', 'Issue Log', 'Change Requests'];
      templates: ['Kickoff Template', 'Review Template'];
    };
    FOLLOWUP: {
      objective: 'Relationship Maintenance & Growth';
      keyOutputs: ['Satisfaction Score', 'Renewal Plan', 'Referrals'];
      templates: ['QBR Template', 'Follow-up Template'];
    };
  };
}
```

### 4.2 고객 미팅 상세 구조

#### 4.2.1 초기 미팅 관리
```typescript
class InitialMeetingManager {
  // 미팅 준비 체크리스트
  preparationChecklist = {
    research: [
      'Company background research',
      'Industry trends analysis',
      'Key stakeholder mapping',
      'Competition landscape'
    ];
    materials: [
      'Company introduction deck',
      'Case studies relevant to industry',
      'Product demo preparation',
      'Meeting agenda'
    ];
    logistics: [
      'Meeting room/video link',
      'Attendee confirmation',
      'Materials distribution',
      'Technical setup'
    ];
  };
  
  // BANT 스코어링 자동화
  calculateBANTScore(assessment: BANTAssessment): BANTResult {
    const weights = {
      budget: 0.3,
      authority: 0.25,
      need: 0.35,
      timeline: 0.1
    };
    
    const score = 
      assessment.budget * weights.budget +
      assessment.authority * weights.authority +
      assessment.need * weights.need +
      assessment.timeline * weights.timeline;
    
    return {
      totalScore: score,
      qualification: this.getQualification(score),
      recommendedActions: this.getRecommendedActions(score),
      followUpPriority: this.getPriority(score)
    };
  }
  
  // 자동 후속 조치 생성
  generateFollowUpTasks(meeting: InitialMeeting): Task[] {
    const tasks: Task[] = [];
    
    // BANT 점수 기반 태스크
    if (meeting.bantScore > 80) {
      tasks.push({
        title: 'Prepare detailed proposal',
        dueDate: this.addDays(2),
        priority: 'HIGH'
      });
    }
    
    // 니즈 기반 태스크
    meeting.needs.forEach(need => {
      tasks.push({
        title: `Research solution for: ${need}`,
        dueDate: this.addDays(5),
        assignee: 'Solution Architect'
      });
    });
    
    return tasks;
  }
}
```

#### 4.2.2 제안 미팅 관리
```typescript
class ProposalMeetingManager {
  // 제품 마스터 연동
  productMasterIntegration = {
    // 상품 추천 엔진
    recommendProducts(customerNeeds: Need[]): Product[] {
      return this.productMaster
        .filter(product => this.matchesNeeds(product, customerNeeds))
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 5);
    },
    
    // 커스터마이징 옵션 생성
    generateCustomization(baseProduct: Product, requirements: Requirement[]): Customization {
      return {
        baseProduct,
        modifications: this.calculateModifications(requirements),
        additionalServices: this.suggestServices(requirements),
        pricing: this.calculateCustomPrice(baseProduct, requirements)
      };
    }
  };
  
  // ROI 계산기
  roiCalculator = {
    quantitative(investment: number, benefits: Benefit[]): QuantitativeROI {
      const totalBenefit = benefits.reduce((sum, b) => sum + b.value, 0);
      const netBenefit = totalBenefit - investment;
      const roi = (netBenefit / investment) * 100;
      const paybackPeriod = investment / (totalBenefit / benefits[0].duration);
      
      return {
        roi,
        netPresentValue: this.calculateNPV(benefits, investment),
        paybackPeriod,
        internalRateOfReturn: this.calculateIRR(benefits, investment)
      };
    },
    
    qualitative(benefits: QualitativeBenefit[]): QualitativeROI {
      return {
        strategicAlignment: this.assessStrategicFit(benefits),
        riskMitigation: this.assessRiskReduction(benefits),
        competitiveAdvantage: this.assessCompetitiveGain(benefits),
        employeeSatisfaction: this.assessEmployeeImpact(benefits)
      };
    }
  };
  
  // 경쟁 분석 도구
  competitiveAnalysis = {
    compareProposals(ourProposal: Proposal, competitors: Competitor[]): Analysis {
      return {
        strengthComparison: this.compareStrengths(ourProposal, competitors),
        pricePositioning: this.analyzePricing(ourProposal, competitors),
        differentiators: this.identifyDifferentiators(ourProposal, competitors),
        winStrategy: this.developWinStrategy(ourProposal, competitors)
      };
    }
  };
}
```

#### 4.2.3 운영 미팅 관리
```typescript
class OperationMeetingManager {
  // 프로젝트 상태 대시보드
  projectStatusDashboard = {
    getSnapshot(projectId: string): ProjectSnapshot {
      return {
        progress: this.calculateProgress(projectId),
        health: this.assessHealth(projectId),
        risks: this.identifyRisks(projectId),
        milestones: this.getMilestoneStatus(projectId),
        budget: this.getBudgetStatus(projectId),
        quality: this.getQualityMetrics(projectId)
      };
    }
  };
  
  // 이슈 추적 시스템
  issueTracker = {
    categorizeIssue(issue: Issue): IssueCategory {
      if (issue.impact === 'HIGH' && issue.urgency === 'HIGH') 
        return 'CRITICAL';
      if (issue.impact === 'HIGH' || issue.urgency === 'HIGH')
        return 'MAJOR';
      return 'MINOR';
    },
    
    generateResolutionPlan(issue: Issue): ResolutionPlan {
      return {
        immediateAction: this.getImmediateAction(issue),
        rootCauseAnalysis: this.analyzeRootCause(issue),
        preventiveMeasures: this.definePrevention(issue),
        communicationPlan: this.createCommPlan(issue)
      };
    }
  };
}
```

### 4.3 내부 미팅 관리

#### 4.3.1 팀 미팅 효율화
```typescript
class TeamMeetingOptimizer {
  // 스탠드업 미팅 자동화
  dailyStandup = {
    template: {
      yesterday: 'What was completed?',
      today: 'What will be worked on?',
      blockers: 'Any impediments?'
    },
    
    autoGenerateAgenda(team: Team): Agenda {
      return {
        updates: team.members.map(m => ({
          member: m,
          tasks: this.getTasksForMember(m)
        })),
        blockers: this.collectBlockers(team),
        decisions: this.getPendingDecisions(team)
      };
    }
  };
  
  // 액션 아이템 추적
  actionItemTracker = {
    createActionItem(decision: Decision): ActionItem {
      return {
        id: this.generateId(),
        title: decision.action,
        owner: decision.owner,
        deadline: decision.deadline,
        status: 'PENDING',
        dependencies: decision.dependencies,
        notifications: this.scheduleReminders(decision.deadline)
      };
    },
    
    trackCompletion(items: ActionItem[]): CompletionMetrics {
      return {
        onTime: items.filter(i => i.completedBy <= i.deadline).length,
        delayed: items.filter(i => i.completedBy > i.deadline).length,
        pending: items.filter(i => !i.completedBy).length,
        completionRate: this.calculateRate(items)
      };
    }
  };
}
```

### 4.4 미팅 인사이트 및 분석

#### 4.4.1 미팅 효과성 분석
```typescript
class MeetingAnalytics {
  // 미팅 ROI 계산
  calculateMeetingROI(meeting: Meeting): MeetingROI {
    const costs = {
      time: this.calculateTimeCost(meeting.attendees, meeting.duration),
      preparation: this.calculatePrepCost(meeting.preparation),
      opportunity: this.calculateOpportunityCost(meeting)
    };
    
    const value = {
      decisions: this.valueDecisions(meeting.decisions),
      progress: this.valueProgress(meeting.outcomes),
      relationship: this.valueRelationship(meeting.type)
    };
    
    return {
      totalCost: Object.values(costs).reduce((a, b) => a + b, 0),
      totalValue: Object.values(value).reduce((a, b) => a + b, 0),
      roi: ((value.total - costs.total) / costs.total) * 100,
      efficiency: this.calculateEfficiency(meeting)
    };
  }
  
  // 미팅 패턴 분석
  analyzeMeetingPatterns(meetings: Meeting[]): PatternInsights {
    return {
      averageDuration: this.calculateAvgDuration(meetings),
      peakTimes: this.identifyPeakTimes(meetings),
      mostProductiveFormats: this.analyzeFormats(meetings),
      attendeeOptimization: this.optimizeAttendees(meetings),
      recommendations: this.generateRecommendations(meetings)
    };
  }
  
  // 예측 분석
  predictiveAnalytics = {
    // 미팅 성공 확률 예측
    predictMeetingSuccess(meeting: PlannedMeeting): SuccessPrediction {
      const factors = {
        preparation: this.scorePreparation(meeting),
        attendees: this.scoreAttendees(meeting),
        timing: this.scoreTiming(meeting),
        agenda: this.scoreAgenda(meeting)
      };
      
      return {
        successProbability: this.calculateProbability(factors),
        riskFactors: this.identifyRisks(factors),
        recommendations: this.suggestImprovements(factors)
      };
    },
    
    // 최적 미팅 시간 추천
    recommendOptimalTime(participants: Participant[], purpose: string): TimeRecommendation {
      return {
        primarySlot: this.findBestSlot(participants),
        alternativeSlots: this.findAlternatives(participants),
        timezone: this.optimizeTimezone(participants),
        duration: this.recommendDuration(purpose)
      };
    }
  };
}
```

## 5. 통합 워크플로우

### 5.1 Lead to Cash 프로세스
```typescript
class LeadToCashWorkflow {
  stages = {
    // 1. Lead Generation
    leadGeneration: {
      sources: ['Website', 'Campaign', 'Referral', 'Event'],
      actions: ['Capture', 'Score', 'Qualify', 'Assign']
    },
    
    // 2. Opportunity Management
    opportunityManagement: {
      pipeline: ['Qualify', 'Analyze', 'Propose', 'Negotiate'],
      actions: ['Track', 'Forecast', 'Collaborate']
    },
    
    // 3. Quote to Contract
    quoteToContract: {
      process: ['Configure', 'Price', 'Quote', 'Approve'],
      output: ['Proposal', 'Contract', 'SOW']
    },
    
    // 4. Project Delivery
    projectDelivery: {
      phases: ['Initiate', 'Plan', 'Execute', 'Close'],
      tracking: ['Progress', 'Quality', 'Risk']
    },
    
    // 5. Invoice to Payment
    invoiceToPayment: {
      billing: ['Generate', 'Send', 'Track'],
      collection: ['Monitor', 'Follow-up', 'Collect']
    },
    
    // 6. Support & Renewal
    supportRenewal: {
      service: ['Support', 'Success', 'Satisfaction'],
      growth: ['Upsell', 'Cross-sell', 'Renew']
    }
  };
  
  // 단계간 자동 전환
  transitions = {
    leadToOpportunity: {
      condition: 'lead.score >= 80 && lead.qualified === true',
      action: 'createOpportunity(lead)'
    },
    
    opportunityToProject: {
      condition: 'opportunity.stage === "CLOSED_WON"',
      action: 'createProject(opportunity, contract)'
    },
    
    projectToInvoice: {
      condition: 'milestone.completed === true',
      action: 'generateInvoice(milestone)'
    },
    
    invoiceToRevenue: {
      condition: 'payment.received === true',
      action: 'recognizeRevenue(payment)'
    }
  };
}
```

### 4.2 교육 운영 워크플로우
```typescript
class TrainingOperationWorkflow {
  // 교육 준비 체크리스트
  preparationChecklist = {
    T_minus_30: [  // 30일 전
      'Contract signed',
      'Instructor assigned',
      'Venue booked',
      'Materials ordered'
    ],
    
    T_minus_14: [  // 14일 전
      'Participants confirmed',
      'Materials customized',
      'Logistics arranged',
      'Pre-survey sent'
    ],
    
    T_minus_7: [   // 7일 전
      'Final headcount',
      'Materials printed',
      'Equipment tested',
      'Reminder sent'
    ],
    
    T_minus_1: [   // 1일 전
      'Venue setup',
      'Materials delivered',
      'Instructor briefed',
      'Final check'
    ],
    
    T_day: [       // 당일
      'Registration',
      'Opening',
      'Delivery',
      'Evaluation'
    ],
    
    T_plus_1: [    // 1일 후
      'Feedback collected',
      'Materials returned',
      'Invoice sent',
      'Thank you sent'
    ],
    
    T_plus_7: [    // 7일 후
      'Report generated',
      'Action items tracked',
      'Follow-up scheduled',
      'NPS measured'
    ]
  };
}
```

---

## 5. 성능 및 확장성 고려사항

### 5.1 데이터베이스 최적화
```typescript
const DATABASE_OPTIMIZATION = {
  indexing: {
    // 복합 인덱스
    customer: ['companyName', 'status', 'accountManagerId'],
    opportunity: ['stage', 'probability', 'expectedCloseDate'],
    project: ['status', 'endDate', 'customerId'],
    
    // 전문 검색 인덱스
    search: ['GIN index on searchable fields'],
    
    // 파티셔닝
    partitioning: {
      activities: 'BY RANGE (created_at) MONTHLY',
      logs: 'BY RANGE (timestamp) DAILY'
    }
  },
  
  caching: {
    redis: {
      customerProfile: '1 hour',
      pipeline: '5 minutes',
      dashboard: '1 minute',
      reports: '10 minutes'
    }
  },
  
  queryOptimization: {
    // N+1 문제 해결
    eager: ['customer.contacts', 'opportunity.activities'],
    
    // 페이지네이션
    pagination: {
      defaultSize: 20,
      maxSize: 100
    },
    
    // 집계 최적화
    materialized: ['daily_stats', 'monthly_revenue']
  }
};
```

### 5.2 확장성 아키텍처
```typescript
const SCALABILITY_ARCHITECTURE = {
  microservices: {
    core: ['customer', 'opportunity', 'project'],
    support: ['notification', 'reporting', 'integration'],
    shared: ['auth', 'file', 'search']
  },
  
  eventDriven: {
    broker: 'Apache Kafka',
    events: [
      'customer.created',
      'opportunity.stage_changed',
      'project.completed',
      'invoice.paid'
    ]
  },
  
  loadBalancing: {
    api: 'Round Robin with Health Check',
    database: 'Read Replicas for Queries',
    cache: 'Redis Cluster'
  }
};
```

---

## 📋 체크리스트

### Phase 2 개발 전 확인사항
- [ ] 기능 우선순위 확정
- [ ] 데이터 모델 검토
- [ ] 비즈니스 규칙 검증
- [ ] 워크플로우 승인
- [ ] 성능 요구사항 확인
- [ ] 통합 포인트 식별
- [ ] 보안 요구사항 검토
- [ ] UI/UX 요구사항 수집

### 개발 준비사항
- [ ] API 명세서 작성
- [ ] 데이터베이스 스키마 설계
- [ ] UI 와이어프레임 작성
- [ ] 테스트 시나리오 준비
- [ ] 개발 환경 구성
- [ ] CI/CD 파이프라인 설정

---

*이 문서를 검토하고 필요한 수정사항을 반영해 주세요. Phase 2 개발의 상세 명세로 사용됩니다.*