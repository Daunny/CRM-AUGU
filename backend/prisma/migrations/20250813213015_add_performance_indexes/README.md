# Performance Indexes Migration

This migration adds comprehensive database indexes to improve query performance across all major tables in the CRM AUGU system.

## Index Categories

### 1. User Table Indexes
- **Email index**: Fast user lookup by email (login, search)
- **Department/Team composite index**: Team-based filtering and reporting
- **Soft delete index**: Efficient exclusion of deleted users
- **Role/Tier index**: Authorization and user management queries
- **Active user index**: Quick filtering of active users only

### 2. Company Table Indexes
- **Code index**: Fast company lookup by unique code
- **Business number index**: Company identification and validation
- **Status/Tier composite index**: Customer segmentation queries
- **Soft delete index**: Efficient exclusion of deleted companies
- **Account manager index**: Sales territory management
- **Industry index**: Industry-based filtering and reporting
- **Company size index**: Market segmentation
- **Full-text search index**: Advanced search functionality using PostgreSQL's GIN index

### 3. Lead Table Indexes
- **Status index**: Lead pipeline management
- **Assignment composite index**: Lead distribution and ownership tracking
- **Scoring index**: Lead prioritization (BANT score + general score, descending)
- **Soft delete index**: Efficient exclusion of deleted leads
- **Source index**: Lead source analysis
- **Conversion tracking**: Converted lead analysis
- **BANT flags**: Qualification criteria filtering

### 4. Opportunity Table Indexes
- **Stage index**: Sales pipeline management
- **Company index**: Account-based opportunity tracking
- **Expected close date**: Sales forecasting and pipeline analysis
- **Amount index**: Revenue-based sorting and filtering (descending)
- **Soft delete index**: Efficient exclusion of deleted opportunities
- **Branch/Contact indexes**: Relationship-based filtering
- **Account manager index**: Sales territory management
- **Probability index**: Win probability analysis
- **Type and creation date**: Opportunity categorization and trending

### 5. Project Table Indexes
- **Status index**: Project portfolio management
- **Company index**: Client project tracking
- **Date range index**: Project timeline management
- **Manager roles indexes**: Resource allocation and responsibility tracking
- **Soft delete index**: Efficient exclusion of deleted projects
- **Type, health, priority, phase**: Project categorization and health monitoring

### 6. Activity Table Indexes
- **Entity relationship index**: Polymorphic relationship optimization
- **User/Date composite index**: Activity timeline and user history
- **Activity type index**: Activity categorization and reporting
- **Related entity indexes**: Cross-entity activity tracking
- **Creation date index**: Recent activity queries

### 7. Supporting Table Indexes

#### Branch, Contact, Task Tables
- Standard relationship and filtering indexes
- Soft delete and status-based filtering
- Priority and due date management

#### Meeting, Notification, Document Tables
- User-based filtering and access control
- Status and type-based categorization
- Temporal sorting and filtering

#### Department, Team, Session Tables
- Organizational hierarchy traversal
- Active entity filtering
- Session management and cleanup

#### Product, KPI Tables
- Category and type-based organization
- Active entity filtering
- Performance measurement and targeting

### 8. Composite Indexes for Complex Queries
- **Multi-condition filtering**: Status + foreign key + assignment combinations
- **Active entity filtering**: Status + soft delete combinations
- **Performance-critical paths**: Most common query patterns optimized

## Performance Benefits

1. **Query Speed**: Dramatically reduced query execution time for filtered and sorted results
2. **Index Scans**: Most queries will use index scans instead of sequential scans
3. **Join Performance**: Foreign key indexes improve JOIN operation speed
4. **Sorting Efficiency**: Pre-sorted indexes eliminate expensive sort operations
5. **Full-text Search**: GIN indexes enable fast text search capabilities

## Index Strategy

- **Selective Indexes**: Partial indexes for common filtering conditions (e.g., active records only)
- **Composite Indexes**: Multi-column indexes for common query patterns
- **Sort-Optimized**: DESC indexes for fields commonly sorted in descending order
- **Relationship Optimization**: All foreign key relationships are indexed

## Usage Notes

- All indexes use `IF NOT EXISTS` to prevent conflicts during re-runs
- Partial indexes (WHERE clauses) reduce index size and improve performance
- GIN indexes are used for full-text search capabilities
- Composite indexes are ordered by selectivity and common query patterns

## Monitoring

After applying this migration:
1. Monitor query performance using `EXPLAIN ANALYZE`
2. Check index usage with `pg_stat_user_indexes`
3. Review slow query logs for further optimization opportunities
4. Use the `QueryOptimizer.collectStatistics()` method for ongoing analysis

## Maintenance

- Indexes are automatically maintained by PostgreSQL
- Regular `ANALYZE` operations will keep statistics current
- Monitor index bloat and consider `REINDEX` for heavily updated tables