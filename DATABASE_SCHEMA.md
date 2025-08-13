# CRM AUGU - Database Schema Design

## 📊 데이터베이스 설계 개요
- **DBMS**: PostgreSQL 15
- **ORM**: Prisma
- **캐시**: Redis 7
- **설계 원칙**: 3NF (Third Normal Form), Soft Delete, Audit Trail

---

## 🗄️ Core Schema Design

### 1. User & Authentication

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR',
  user_tier VARCHAR(50) NOT NULL DEFAULT 'OPERATOR', -- OPERATOR, MANAGER, EXECUTIVE
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- User sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles and Permissions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### 2. Customer Management (3-Tier Structure)

```sql
-- Companies (Level 1)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_number VARCHAR(50) UNIQUE,
  representative VARCHAR(100),
  industry_id UUID REFERENCES industries(id),
  company_size VARCHAR(50), -- STARTUP, SMB, MIDMARKET, ENTERPRISE
  annual_revenue DECIMAL(15, 2),
  employee_count INTEGER,
  fiscal_year_end VARCHAR(5), -- MM-DD
  website VARCHAR(255),
  description TEXT,
  tier VARCHAR(20) DEFAULT 'BRONZE', -- VIP, GOLD, SILVER, BRONZE
  status VARCHAR(50) DEFAULT 'PROSPECT', -- PROSPECT, ACTIVE, INACTIVE, CHURNED
  credit_limit DECIMAL(15, 2),
  payment_terms INTEGER DEFAULT 30,
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Branches (Level 2)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  branch_type VARCHAR(50), -- HEADQUARTERS, BRANCH, FACTORY, RND
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_postal VARCHAR(20),
  address_country VARCHAR(100) DEFAULT '대한민국',
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  manager_name VARCHAR(100),
  employee_count INTEGER,
  is_primary BOOLEAN DEFAULT false,
  is_billing_address BOOLEAN DEFAULT false,
  is_shipping_address BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Contacts (Level 3)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  role_type VARCHAR(50), -- DECISION_MAKER, INFLUENCER, USER, CHAMPION
  is_primary BOOLEAN DEFAULT false,
  preferred_contact_method VARCHAR(20), -- EMAIL, PHONE, MOBILE, KAKAO
  birthday DATE,
  notes TEXT,
  linkedin_url VARCHAR(255),
  last_contacted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Industries
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES industries(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Lead & Opportunity Management

```sql
-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  source VARCHAR(50), -- WEBSITE, REFERRAL, CAMPAIGN, COLD_CALL, EVENT
  source_detail VARCHAR(255),
  status VARCHAR(50) DEFAULT 'NEW', -- NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED
  score INTEGER DEFAULT 0,
  bant_budget BOOLEAN DEFAULT false,
  bant_authority BOOLEAN DEFAULT false,
  bant_need BOOLEAN DEFAULT false,
  bant_timeline BOOLEAN DEFAULT false,
  bant_score INTEGER DEFAULT 0, -- 0-100
  assigned_to UUID REFERENCES users(id),
  assigned_team_id UUID REFERENCES teams(id),
  converted_at TIMESTAMP,
  converted_to_company_id UUID REFERENCES companies(id),
  converted_to_opportunity_id UUID REFERENCES opportunities(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Lead Assignment Workflow
CREATE TABLE lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  assigned_from UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  assigned_team_id UUID REFERENCES teams(id),
  assignment_reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  branch_id UUID REFERENCES branches(id),
  contact_id UUID REFERENCES contacts(id),
  type VARCHAR(50), -- NEW_BUSINESS, RENEWAL, EXPANSION, REPLACEMENT
  stage VARCHAR(50) DEFAULT 'QUALIFYING', -- QUALIFYING, NEEDS_ANALYSIS, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
  probability INTEGER DEFAULT 10,
  amount DECIMAL(15, 2),
  expected_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'KRW',
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason TEXT,
  competitor_info JSONB,
  source VARCHAR(50),
  campaign_id UUID REFERENCES campaigns(id),
  account_manager_id UUID NOT NULL REFERENCES users(id),
  sales_team_id UUID REFERENCES teams(id),
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Opportunity Stage History
CREATE TABLE opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  duration_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Project Management (HRD Specialized)

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- LEADERSHIP, SALES, SERVICE, TECHNICAL, ONBOARDING
  company_id UUID NOT NULL REFERENCES companies(id),
  branch_id UUID REFERENCES branches(id),
  opportunity_id UUID REFERENCES opportunities(id),
  contract_id UUID REFERENCES contracts(id),
  status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
  phase VARCHAR(50), -- INITIATION, PLANNING, EXECUTION, MONITORING, CLOSING
  health VARCHAR(20), -- GREEN, YELLOW, RED
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  start_date DATE,
  end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  budget DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  revenue DECIMAL(15, 2),
  margin DECIMAL(15, 2),
  margin_percent DECIMAL(5, 2),
  progress INTEGER DEFAULT 0, -- 0-100
  project_manager_id UUID REFERENCES users(id),
  coordinator_id UUID REFERENCES users(id),
  operator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Training Sessions (차수)
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  session_number INTEGER NOT NULL,
  name VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  coordinator_id UUID REFERENCES users(id),
  location VARCHAR(255),
  max_participants INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  attended_count INTEGER DEFAULT 0,
  satisfaction_score DECIMAL(3, 2), -- 1-5
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, session_number)
);

-- Training Classes (분반)
CREATE TABLE training_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id),
  class_number INTEGER NOT NULL,
  name VARCHAR(255),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_id UUID REFERENCES instructors(id),
  room VARCHAR(100),
  topic VARCHAR(255),
  materials_url TEXT,
  max_participants INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  attended_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, class_number)
);

-- Instructors
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  specialties TEXT[],
  rating DECIMAL(3, 2), -- 1-5
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  certifications TEXT[],
  is_internal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Team Members
CREATE TABLE project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50), -- PROJECT_MANAGER, COORDINATOR, OPERATOR, MEMBER
  allocation_percent INTEGER DEFAULT 100,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);
```

### 5. Meeting Management

```sql
-- Meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target VARCHAR(20) NOT NULL, -- CUSTOMER, INTERNAL
  type VARCHAR(50) NOT NULL, -- INITIAL, PROPOSAL, OPERATION, FOLLOWUP, TEAM, CROSS_DEPT, PARTNER
  company_id UUID REFERENCES companies(id),
  branch_id UUID REFERENCES branches(id),
  opportunity_id UUID REFERENCES opportunities(id),
  project_id UUID REFERENCES projects(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER, -- minutes
  location_type VARCHAR(20), -- ONSITE, ONLINE, HYBRID
  location_address TEXT,
  location_room VARCHAR(100),
  online_link TEXT,
  organizer_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  importance VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  has_minutes BOOLEAN DEFAULT false,
  has_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Meeting Participants
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  participant_type VARCHAR(20) NOT NULL, -- INTERNAL, EXTERNAL
  user_id UUID REFERENCES users(id), -- For internal
  contact_id UUID REFERENCES contacts(id), -- For external
  name VARCHAR(100), -- For external without contact
  company VARCHAR(100), -- For external without contact
  position VARCHAR(100),
  role VARCHAR(50), -- ORGANIZER, PRESENTER, ATTENDEE, OPTIONAL
  attendance VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, ATTENDED, ABSENT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_id, user_id),
  UNIQUE(meeting_id, contact_id)
);

-- Meeting Agenda
CREATE TABLE meeting_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  sequence INTEGER NOT NULL,
  topic VARCHAR(255) NOT NULL,
  duration INTEGER, -- minutes
  presenter VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Minutes
CREATE TABLE meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID UNIQUE NOT NULL REFERENCES meetings(id),
  summary TEXT NOT NULL,
  key_points TEXT[],
  decisions TEXT[],
  next_steps TEXT,
  customer_reaction VARCHAR(20), -- POSITIVE, NEUTRAL, NEGATIVE
  customer_concerns TEXT[],
  customer_interests TEXT[],
  competitors_mentioned JSONB,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Meeting Action Items
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  task VARCHAR(255) NOT NULL,
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Products (for Proposal meetings)
CREATE TABLE meeting_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(15, 2),
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  total_price DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Product Master

```sql
-- Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES product_categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  type VARCHAR(50), -- TRAINING, CONSULTING, ASSESSMENT, COACHING
  description TEXT,
  duration_days INTEGER,
  duration_hours INTEGER,
  min_participants INTEGER,
  max_participants INTEGER,
  list_price DECIMAL(15, 2),
  cost DECIMAL(15, 2),
  margin DECIMAL(15, 2),
  curriculum JSONB,
  prerequisites TEXT[],
  objectives TEXT[],
  target_audience TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. KPI Management

```sql
-- KPI Definitions
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- SALES, PROJECT, FINANCE, CUSTOMER, OPERATIONAL
  level VARCHAR(20), -- COMPANY, DEPARTMENT, TEAM, INDIVIDUAL
  formula TEXT,
  unit VARCHAR(20), -- CURRENCY, PERCENT, COUNT, DAYS
  target_direction VARCHAR(20), -- INCREASE, DECREASE, MAINTAIN
  frequency VARCHAR(20), -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Targets
CREATE TABLE kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id),
  entity_type VARCHAR(20), -- COMPANY, DEPARTMENT, TEAM, USER
  entity_id UUID, -- References to respective entity
  period_year INTEGER NOT NULL,
  period_month INTEGER,
  period_quarter INTEGER,
  target_value DECIMAL(15, 2) NOT NULL,
  stretch_value DECIMAL(15, 2),
  minimum_value DECIMAL(15, 2),
  weight INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- KPI Actuals
CREATE TABLE kpi_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_target_id UUID NOT NULL REFERENCES kpi_targets(id),
  period_date DATE NOT NULL,
  actual_value DECIMAL(15, 2) NOT NULL,
  achievement_percent DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Team & Department Structure

```sql
-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES users(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  team_lead_id UUID REFERENCES users(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50), -- LEAD, MEMBER
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);
```

### 9. Activity & History Tracking

```sql
-- Activities (Polymorphic)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- COMPANY, CONTACT, OPPORTUNITY, PROJECT
  entity_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- CALL, EMAIL, MEETING, NOTE, TASK
  subject VARCHAR(255),
  description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER, -- minutes
  outcome TEXT,
  next_action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

---

## 🔄 Database Migrations

### Initial Migration
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  phone         String?
  department    String?
  position      String?
  role          String    @default("OPERATOR")
  userTier      String    @default("OPERATOR") @map("user_tier")
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  createdBy     String?   @map("created_by")
  updatedBy     String?   @map("updated_by")
  deletedAt     DateTime? @map("deleted_at")
  deletedBy     String?   @map("deleted_by")

  // Relations
  sessions      UserSession[]
  createdUsers  User[]    @relation("UserCreatedBy")
  updatedUsers  User[]    @relation("UserUpdatedBy")
  deletedUsers  User[]    @relation("UserDeletedBy")

  @@map("users")
}

// ... Additional models following the same pattern
```

---

## 📊 Indexes & Performance

### Recommended Indexes
```sql
-- Customer queries
CREATE INDEX idx_companies_status ON companies(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_tier ON companies(tier) WHERE deleted_at IS NULL;
CREATE INDEX idx_branches_company ON branches(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_branch ON contacts(branch_id) WHERE deleted_at IS NULL;

-- Sales queries
CREATE INDEX idx_leads_status ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_assigned ON leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_stage ON opportunities(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_company ON opportunities(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_close_date ON opportunities(expected_close_date);

-- Project queries
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_company ON projects(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- Meeting queries
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_company ON meetings(company_id) WHERE company_id IS NOT NULL;

-- Activity queries
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_created ON activities(created_at, created_by);

-- Full-text search
CREATE INDEX idx_companies_search ON companies USING gin(
  to_tsvector('korean', name || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_contacts_search ON contacts USING gin(
  to_tsvector('korean', first_name || ' ' || last_name || ' ' || COALESCE(email, ''))
);
```

---

## 🔐 Security & Constraints

### Row Level Security
```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY companies_view_policy ON companies
  FOR SELECT
  USING (
    deleted_at IS NULL AND (
      current_user_tier() = 'EXECUTIVE' OR
      (current_user_tier() = 'MANAGER' AND account_manager_id IN (
        SELECT user_id FROM team_members WHERE team_id IN (
          SELECT team_id FROM team_members WHERE user_id = current_user_id()
        )
      )) OR
      account_manager_id = current_user_id()
    )
  );
```

### Check Constraints
```sql
-- Date validations
ALTER TABLE projects ADD CONSTRAINT check_project_dates 
  CHECK (end_date >= start_date);

ALTER TABLE meetings ADD CONSTRAINT check_meeting_times
  CHECK (end_time > start_time);

-- Value validations
ALTER TABLE opportunities ADD CONSTRAINT check_probability
  CHECK (probability >= 0 AND probability <= 100);

ALTER TABLE projects ADD CONSTRAINT check_progress
  CHECK (progress >= 0 AND progress <= 100);
```

---

## 📈 Data Retention & Archiving

### Archiving Strategy
```sql
-- Archive tables
CREATE TABLE archive_opportunities (LIKE opportunities INCLUDING ALL);
CREATE TABLE archive_projects (LIKE projects INCLUDING ALL);
CREATE TABLE archive_activities (LIKE activities INCLUDING ALL);

-- Archiving function
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS void AS $$
BEGIN
  -- Archive completed opportunities older than 2 years
  INSERT INTO archive_opportunities
  SELECT * FROM opportunities
  WHERE stage IN ('CLOSED_WON', 'CLOSED_LOST')
    AND actual_close_date < CURRENT_DATE - INTERVAL '2 years';
  
  DELETE FROM opportunities
  WHERE stage IN ('CLOSED_WON', 'CLOSED_LOST')
    AND actual_close_date < CURRENT_DATE - INTERVAL '2 years';
  
  -- Similar for other tables...
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly archiving
SELECT cron.schedule('archive-old-data', '0 2 1 * *', 'SELECT archive_old_data();');
```

---

## 🔄 Backup & Recovery

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/crm-augu"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="crm_augu"

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME -F c -f "$BACKUP_DIR/full_backup_$DATE.dump"

# Incremental backup using WAL
pg_basebackup -h localhost -U postgres -D "$BACKUP_DIR/wal_$DATE" -Ft -z -P

# Keep only last 30 days
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
```

---

*이 데이터베이스 스키마 설계를 검토하시고 필요한 수정사항을 알려주세요.*