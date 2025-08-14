// Type definitions for Customer 360 Service

import { 
  Company, 
  Branch, 
  Contact, 
  Opportunity, 
  Project, 
  Activity,
  Note,
  Industry,
  User,
  CompanySize,
  CustomerTier,
  CustomerStatus,
  OpportunityStage,
  ProjectStatus,
  ContactRole,
  BranchType,
} from '@prisma/client';

// Extended company type with relations
export interface CompanyWithRelations extends Company {
  industry?: Industry | null;
  accountManager?: User | null;
  branches?: Branch[];
  opportunities?: Opportunity[];
  projects?: Project[];
}

// Extended contact type with relations
export interface ContactWithRelations extends Contact {
  branch?: Branch & {
    company?: Company;
  };
}

// Customer segment information
export interface CustomerSegment {
  id: string;
  name: string;
  criteria: string;
  matchScore: number;
}

// Customer 360 view structure
export interface Customer360View {
  company: CompanyWithRelations;
  branches: Branch[];
  contacts: ContactWithRelations[];
  opportunities: Opportunity[];
  projects: Project[];
  recentActivities: Activity[];
  metrics: CustomerMetrics;
  segments: CustomerSegment[];
  riskAssessment: RiskAssessment;
}

// Customer metrics
export interface CustomerMetrics {
  totalRevenue: number;
  totalOpportunityValue: number;
  activeOpportunities: number;
  completedProjects: number;
  averageDealSize: number;
  winRate: number;
  customerLifetimeValue: number;
  engagementScore: number;
  healthScore: number;
  daysAsCustomer: number;
}

// Risk assessment
export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  churnProbability: number;
  riskFactors: string[];
  recommendations: string[];
  lastAssessmentDate: Date;
}

// Interaction history item
export interface InteractionItem {
  id: string;
  type: 'activity' | 'note' | 'email' | 'meeting' | 'call';
  date: Date;
  subject?: string;
  description?: string | null;
  outcome?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Revenue analytics
export interface RevenueAnalytics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  pipelineValue: number;
  weightedPipeline: number;
  averageDealSize: number;
  averageSalesyCycle: number;
  winRate: number;
  lostValue: number;
  opportunities: OpportunityMetrics[];
  revenueByMonth: MonthlyRevenue[];
  revenueByProduct?: ProductRevenue[];
}

// Opportunity metrics
export interface OpportunityMetrics {
  id: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate?: Date | null;
  daysInPipeline: number;
  isStalled: boolean;
}

// Monthly revenue breakdown
export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  count: number;
}

// Product revenue breakdown
export interface ProductRevenue {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

// Engagement timeline
export interface EngagementTimeline {
  month: string;
  year: number;
  activities: TimelineActivity[];
  totalInteractions: number;
  uniqueContacts: number;
}

// Timeline activity
export interface TimelineActivity {
  id: string;
  date: Date;
  type: string;
  subject?: string;
  user?: {
    id: string;
    name: string;
  };
}

// Company insights
export interface CompanyInsights {
  summary: string;
  strengths: string[];
  opportunities: string[];
  threats: string[];
  nextBestActions: NextBestAction[];
}

// Next best action recommendation
export interface NextBestAction {
  id: string;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  expectedImpact: string;
  dueDate?: Date;
}

// Customer health indicators
export interface HealthIndicators {
  productUsage: number;
  supportTickets: number;
  paymentHistory: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  contractRenewal: {
    daysUntilRenewal: number;
    renewalProbability: number;
  };
  npsScore?: number;
  satisfactionScore?: number;
}

// Contact influence map
export interface ContactInfluenceMap {
  contacts: ContactNode[];
  relationships: ContactRelationship[];
}

// Contact node in influence map
export interface ContactNode {
  id: string;
  name: string;
  title?: string;
  department?: string;
  role?: ContactRole;
  influenceScore: number;
  isPrimary: boolean;
}

// Contact relationship
export interface ContactRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: 'REPORTS_TO' | 'WORKS_WITH' | 'INFLUENCES';
  strength: number;
}

// Customer journey stage
export interface CustomerJourneyStage {
  stage: 'AWARENESS' | 'CONSIDERATION' | 'DECISION' | 'PURCHASE' | 'RETENTION' | 'ADVOCACY';
  enteredAt: Date;
  completedAt?: Date;
  milestones: JourneyMilestone[];
}

// Journey milestone
export interface JourneyMilestone {
  id: string;
  name: string;
  achievedAt?: Date;
  required: boolean;
}

// Competitive analysis
export interface CompetitiveAnalysis {
  competitors: Competitor[];
  winLossRatio: {
    wins: number;
    losses: number;
    ratio: number;
  };
  strengthsVsCompetitors: string[];
  weaknessesVsCompetitors: string[];
}

// Competitor information
export interface Competitor {
  id: string;
  name: string;
  winsAgainst: number;
  lossesAgainst: number;
  averageDealSize: number;
  commonReasons: string[];
}