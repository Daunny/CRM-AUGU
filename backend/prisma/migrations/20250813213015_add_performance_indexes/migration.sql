-- CreateIndex: Performance indexes from query-optimizer.ts recommendations

-- User table indexes
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_user_department_team" ON "users"("department_id", "team_id");
CREATE INDEX IF NOT EXISTS "idx_user_deleted" ON "users"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_user_role_tier" ON "users"("role", "user_tier");
CREATE INDEX IF NOT EXISTS "idx_user_active" ON "users"("is_active") WHERE "is_active" = true;

-- Company table indexes
CREATE INDEX IF NOT EXISTS "idx_company_code" ON "companies"("code");
CREATE INDEX IF NOT EXISTS "idx_company_business_number" ON "companies"("business_number");
CREATE INDEX IF NOT EXISTS "idx_company_status_tier" ON "companies"("status", "tier");
CREATE INDEX IF NOT EXISTS "idx_company_deleted" ON "companies"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_company_account_manager" ON "companies"("account_manager_id");
CREATE INDEX IF NOT EXISTS "idx_company_industry" ON "companies"("industry_id");
CREATE INDEX IF NOT EXISTS "idx_company_size" ON "companies"("company_size");
-- Full-text search index for company name and description
CREATE INDEX IF NOT EXISTS "idx_company_search" ON "companies" USING gin(to_tsvector('english', "name" || ' ' || COALESCE("description", '')));

-- Lead table indexes
CREATE INDEX IF NOT EXISTS "idx_lead_status" ON "leads"("status");
CREATE INDEX IF NOT EXISTS "idx_lead_assigned" ON "leads"("assigned_to_id", "assigned_team_id");
CREATE INDEX IF NOT EXISTS "idx_lead_score" ON "leads"("bant_score" DESC, "score" DESC);
CREATE INDEX IF NOT EXISTS "idx_lead_deleted" ON "leads"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_lead_source" ON "leads"("source");
CREATE INDEX IF NOT EXISTS "idx_lead_converted" ON "leads"("converted_at");
CREATE INDEX IF NOT EXISTS "idx_lead_bant_flags" ON "leads"("bant_budget", "bant_authority", "bant_need", "bant_timeline");

-- Opportunity table indexes
CREATE INDEX IF NOT EXISTS "idx_opportunity_stage" ON "opportunities"("stage");
CREATE INDEX IF NOT EXISTS "idx_opportunity_company" ON "opportunities"("company_id");
CREATE INDEX IF NOT EXISTS "idx_opportunity_expected_close" ON "opportunities"("expected_close_date");
CREATE INDEX IF NOT EXISTS "idx_opportunity_amount" ON "opportunities"("expected_amount" DESC);
CREATE INDEX IF NOT EXISTS "idx_opportunity_deleted" ON "opportunities"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_opportunity_branch" ON "opportunities"("branch_id");
CREATE INDEX IF NOT EXISTS "idx_opportunity_contact" ON "opportunities"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_opportunity_account_manager" ON "opportunities"("account_manager_id");
CREATE INDEX IF NOT EXISTS "idx_opportunity_probability" ON "opportunities"("probability" DESC);
CREATE INDEX IF NOT EXISTS "idx_opportunity_type" ON "opportunities"("type");
CREATE INDEX IF NOT EXISTS "idx_opportunity_created" ON "opportunities"("created_at");

-- Project table indexes
CREATE INDEX IF NOT EXISTS "idx_project_status" ON "projects"("status");
CREATE INDEX IF NOT EXISTS "idx_project_company" ON "projects"("company_id");
CREATE INDEX IF NOT EXISTS "idx_project_dates" ON "projects"("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "idx_project_manager" ON "projects"("project_manager_id");
CREATE INDEX IF NOT EXISTS "idx_project_deleted" ON "projects"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_project_coordinator" ON "projects"("coordinator_id");
CREATE INDEX IF NOT EXISTS "idx_project_operator" ON "projects"("operator_id");
CREATE INDEX IF NOT EXISTS "idx_project_type" ON "projects"("type");
CREATE INDEX IF NOT EXISTS "idx_project_health" ON "projects"("health");
CREATE INDEX IF NOT EXISTS "idx_project_priority" ON "projects"("priority");
CREATE INDEX IF NOT EXISTS "idx_project_phase" ON "projects"("phase");

-- Activity table indexes
CREATE INDEX IF NOT EXISTS "idx_activity_entity" ON "activities"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_user_date" ON "activities"("user_id", "start_time" DESC);
CREATE INDEX IF NOT EXISTS "idx_activity_type" ON "activities"("activity_type");
CREATE INDEX IF NOT EXISTS "idx_activity_company" ON "activities"("company_id");
CREATE INDEX IF NOT EXISTS "idx_activity_contact" ON "activities"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_activity_opportunity" ON "activities"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_created" ON "activities"("created_at" DESC);

-- Additional indexes for common query patterns

-- Branch table indexes
CREATE INDEX IF NOT EXISTS "idx_branch_company" ON "branches"("company_id");
CREATE INDEX IF NOT EXISTS "idx_branch_deleted" ON "branches"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_branch_primary" ON "branches"("is_primary") WHERE "is_primary" = true;
CREATE INDEX IF NOT EXISTS "idx_branch_type" ON "branches"("branch_type");

-- Contact table indexes
CREATE INDEX IF NOT EXISTS "idx_contact_branch" ON "contacts"("branch_id");
CREATE INDEX IF NOT EXISTS "idx_contact_deleted" ON "contacts"("deleted_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_contact_active" ON "contacts"("is_active") WHERE "is_active" = true;
CREATE INDEX IF NOT EXISTS "idx_contact_primary" ON "contacts"("is_primary") WHERE "is_primary" = true;
CREATE INDEX IF NOT EXISTS "idx_contact_role" ON "contacts"("role_type");

-- Task table indexes
CREATE INDEX IF NOT EXISTS "idx_task_assigned" ON "tasks"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_task_status" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "idx_task_priority" ON "tasks"("priority");
CREATE INDEX IF NOT EXISTS "idx_task_due_date" ON "tasks"("due_date");
CREATE INDEX IF NOT EXISTS "idx_task_project" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "idx_task_opportunity" ON "tasks"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_task_completed" ON "tasks"("completed_at");

-- Meeting table indexes
CREATE INDEX IF NOT EXISTS "idx_meeting_organizer" ON "meetings"("organizer_id");
CREATE INDEX IF NOT EXISTS "idx_meeting_company" ON "meetings"("company_id");
CREATE INDEX IF NOT EXISTS "idx_meeting_status" ON "meetings"("status");
CREATE INDEX IF NOT EXISTS "idx_meeting_target" ON "meetings"("target");
CREATE INDEX IF NOT EXISTS "idx_meeting_type" ON "meetings"("type");
CREATE INDEX IF NOT EXISTS "idx_meeting_importance" ON "meetings"("importance");

-- Notification table indexes
CREATE INDEX IF NOT EXISTS "idx_notification_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "idx_notification_type" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_notification_created" ON "notifications"("created_at" DESC);

-- Document table indexes
CREATE INDEX IF NOT EXISTS "idx_document_entity" ON "documents"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_document_type" ON "documents"("type");
CREATE INDEX IF NOT EXISTS "idx_document_uploaded_by" ON "documents"("uploaded_by");

-- Department and Team indexes
CREATE INDEX IF NOT EXISTS "idx_department_parent" ON "departments"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_department_manager" ON "departments"("manager_id");
CREATE INDEX IF NOT EXISTS "idx_department_active" ON "departments"("is_active") WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "idx_team_department" ON "teams"("department_id");
CREATE INDEX IF NOT EXISTS "idx_team_lead" ON "teams"("team_lead_id");
CREATE INDEX IF NOT EXISTS "idx_team_active" ON "teams"("is_active") WHERE "is_active" = true;

-- Session table indexes
CREATE INDEX IF NOT EXISTS "idx_session_user" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_session_expires" ON "sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_session_created" ON "sessions"("created_at");

-- Product related indexes
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "idx_product_type" ON "products"("type");
CREATE INDEX IF NOT EXISTS "idx_product_active" ON "products"("is_active") WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "idx_product_category_parent" ON "product_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_product_category_active" ON "product_categories"("is_active") WHERE "is_active" = true;

-- KPI related indexes
CREATE INDEX IF NOT EXISTS "idx_kpi_definition_category" ON "kpi_definitions"("category");
CREATE INDEX IF NOT EXISTS "idx_kpi_definition_level" ON "kpi_definitions"("level");
CREATE INDEX IF NOT EXISTS "idx_kpi_definition_active" ON "kpi_definitions"("is_active") WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "idx_kpi_target_entity" ON "kpi_targets"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_kpi_target_period" ON "kpi_targets"("period_year", "period_month", "period_quarter");
CREATE INDEX IF NOT EXISTS "idx_kpi_target_definition" ON "kpi_targets"("kpi_definition_id");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_user_active_dept_team" ON "users"("is_active", "department_id", "team_id") WHERE "is_active" = true AND "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_company_active_tier_manager" ON "companies"("status", "tier", "account_manager_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_opportunity_stage_company_manager" ON "opportunities"("stage", "company_id", "account_manager_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_project_status_company_manager" ON "projects"("status", "company_id", "project_manager_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_lead_status_assigned_score" ON "leads"("status", "assigned_to_id", "bant_score" DESC) WHERE "deleted_at" IS NULL;