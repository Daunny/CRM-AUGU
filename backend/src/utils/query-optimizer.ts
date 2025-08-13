import { Prisma } from '@prisma/client';

// Pagination helper with cursor-based pagination support
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    cursor?: string;
    nextCursor?: string;
  };
}

export class QueryOptimizer {
  // Convert page-based to cursor-based pagination for better performance
  static getPaginationParams(options: PaginationOptions) {
    const limit = Math.min(options.limit || 20, 100); // Max 100 items per page
    const page = Math.max(options.page || 1, 1);
    const skip = (page - 1) * limit;
    
    if (options.cursor) {
      return {
        take: limit + 1, // Take one extra to check if there's next page
        cursor: { id: options.cursor },
        skip: 1, // Skip the cursor itself
      };
    }
    
    return {
      skip,
      take: limit,
    };
  }
  
  // Optimize include statements to prevent N+1 queries
  static optimizeIncludes<T>(includes: T): T {
    const optimized: any = {};
    
    for (const [key, value] of Object.entries(includes as any)) {
      if (value === true) {
        // Convert simple includes to select for better performance
        optimized[key] = {
          select: {
            id: true,
            // Add commonly needed fields based on relation
            ...(key === 'user' ? { email: true, firstName: true, lastName: true } : {}),
            ...(key === 'company' ? { name: true, code: true } : {}),
            ...(key === 'branch' ? { name: true } : {}),
          },
        };
      } else if (typeof value === 'object' && value !== null) {
        // Recursively optimize nested includes
        optimized[key] = this.optimizeIncludes(value);
      } else {
        optimized[key] = value;
      }
    }
    
    return optimized as T;
  }
  
  // Create efficient where clauses with index optimization
  static buildWhereClause(filters: Record<string, any>): Prisma.JsonObject {
    const where: any = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
      // Handle different filter types
      if (key === 'search' && typeof value === 'string') {
        // Use OR for search across multiple fields
        where.OR = this.buildSearchConditions(value);
      } else if (key.endsWith('_from')) {
        // Range queries - from
        const field = key.slice(0, -5);
        where[field] = { ...where[field], gte: value };
      } else if (key.endsWith('_to')) {
        // Range queries - to
        const field = key.slice(0, -3);
        where[field] = { ...where[field], lte: value };
      } else if (key.endsWith('_in')) {
        // IN queries
        const field = key.slice(0, -3);
        where[field] = { in: value };
      } else if (key.endsWith('_not')) {
        // NOT queries
        const field = key.slice(0, -4);
        where[field] = { not: value };
      } else if (Array.isArray(value)) {
        // Array values become IN queries
        where[key] = { in: value };
      } else {
        // Direct equality
        where[key] = value;
      }
    }
    
    // Always exclude soft-deleted records
    where.deletedAt = null;
    
    return where;
  }
  
  // Build search conditions with full-text search optimization
  private static buildSearchConditions(searchTerm: string): any[] {
    const conditions = [];
    const searchPattern = { contains: searchTerm, mode: 'insensitive' };
    
    // Add common searchable fields
    conditions.push(
      { name: searchPattern },
      { code: searchPattern },
      { email: searchPattern },
      { description: searchPattern },
      { title: searchPattern },
    );
    
    return conditions;
  }
  
  // Batch operations for better performance
  static async batchOperation<T>(
    items: T[],
    operation: (batch: T[]) => Promise<any>,
    batchSize: number = 100
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const result = await operation(batch);
      results.push(result);
    }
    
    return results;
  }
  
  // Connection pooling optimization
  static getConnectionOptions(maxConnections: number = 10): any {
    return {
      connection_limit: maxConnections,
      connect_timeout: 10,
      pool_timeout: 10,
      idle_in_transaction_session_timeout: 10,
      statement_timeout: 30000, // 30 seconds
    };
  }
  
  // Query result caching key generator
  static getCacheKey(model: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return `${model}:${JSON.stringify(sortedParams)}`;
  }
  
  // Aggregation query optimizer
  static async performAggregation(
    groupBy: string[],
    aggregations: Record<string, any>,
    where?: any
  ) {
    const pipeline = [];
    
    // Add match stage if where clause exists
    if (where) {
      pipeline.push({ $match: where });
    }
    
    // Add group stage
    const groupStage: any = { _id: {} };
    for (const field of groupBy) {
      groupStage._id[field] = `$${field}`;
    }
    
    // Add aggregations
    for (const [alias, agg] of Object.entries(aggregations)) {
      if (typeof agg === 'object' && agg !== null) {
        const { operation, field } = agg as any;
        switch (operation) {
          case 'count':
            groupStage[alias] = { $sum: 1 };
            break;
          case 'sum':
            groupStage[alias] = { $sum: `$${field}` };
            break;
          case 'avg':
            groupStage[alias] = { $avg: `$${field}` };
            break;
          case 'min':
            groupStage[alias] = { $min: `$${field}` };
            break;
          case 'max':
            groupStage[alias] = { $max: `$${field}` };
            break;
        }
      }
    }
    
    pipeline.push({ $group: groupStage });
    
    // Add sort stage
    pipeline.push({ $sort: { _id: 1 } });
    
    return pipeline;
  }
  
  // Index recommendations
  static getIndexRecommendations(model: string): string[] {
    const recommendations: Record<string, string[]> = {
      User: [
        'CREATE INDEX idx_user_email ON users(email);',
        'CREATE INDEX idx_user_department_team ON users(department_id, team_id);',
        'CREATE INDEX idx_user_deleted ON users(deleted_at) WHERE deleted_at IS NULL;',
      ],
      Company: [
        'CREATE INDEX idx_company_code ON companies(code);',
        'CREATE INDEX idx_company_business_number ON companies(business_number);',
        'CREATE INDEX idx_company_status_tier ON companies(status, tier);',
        'CREATE INDEX idx_company_deleted ON companies(deleted_at) WHERE deleted_at IS NULL;',
        'CREATE INDEX idx_company_search ON companies USING gin(to_tsvector(\'english\', name || \' \' || COALESCE(description, \'\')));',
      ],
      Lead: [
        'CREATE INDEX idx_lead_status ON leads(status);',
        'CREATE INDEX idx_lead_assigned ON leads(assigned_to_id, assigned_team_id);',
        'CREATE INDEX idx_lead_score ON leads(bant_score DESC, score DESC);',
        'CREATE INDEX idx_lead_deleted ON leads(deleted_at) WHERE deleted_at IS NULL;',
      ],
      Opportunity: [
        'CREATE INDEX idx_opportunity_stage ON opportunities(stage);',
        'CREATE INDEX idx_opportunity_company ON opportunities(company_id);',
        'CREATE INDEX idx_opportunity_expected_close ON opportunities(expected_close_date);',
        'CREATE INDEX idx_opportunity_amount ON opportunities(expected_amount DESC);',
        'CREATE INDEX idx_opportunity_deleted ON opportunities(deleted_at) WHERE deleted_at IS NULL;',
      ],
      Project: [
        'CREATE INDEX idx_project_status ON projects(status);',
        'CREATE INDEX idx_project_company ON projects(company_id);',
        'CREATE INDEX idx_project_dates ON projects(start_date, end_date);',
        'CREATE INDEX idx_project_manager ON projects(project_manager_id);',
        'CREATE INDEX idx_project_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;',
      ],
      Activity: [
        'CREATE INDEX idx_activity_entity ON activities(entity_type, entity_id);',
        'CREATE INDEX idx_activity_user_date ON activities(user_id, start_time DESC);',
        'CREATE INDEX idx_activity_type ON activities(activity_type);',
      ],
    };
    
    return recommendations[model] || [];
  }
  
  // Query execution plan analyzer
  static async analyzeQuery(prisma: any, query: string): Promise<any> {
    try {
      const result = await prisma.$queryRaw`EXPLAIN ANALYZE ${Prisma.raw(query)}`;
      return result;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }
  
  // Optimize large dataset exports
  static async* streamLargeDataset<T>(
    model: any,
    where: any = {},
    batchSize: number = 1000
  ): AsyncGenerator<T[], void, unknown> {
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const query: any = {
        where,
        take: batchSize,
        orderBy: { id: 'asc' },
      };
      
      if (cursor) {
        query.cursor = { id: cursor };
        query.skip = 1;
      }
      
      const results = await model.findMany(query);
      
      if (results.length > 0) {
        cursor = results[results.length - 1].id;
        yield results;
      }
      
      hasMore = results.length === batchSize;
    }
  }
  
  // Database statistics collector
  static async collectStatistics(prisma: any): Promise<any> {
    const stats: any = {};
    
    // Table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    
    // Index usage
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `;
    
    // Slow queries (if pg_stat_statements is enabled)
    let slowQueries = [];
    try {
      slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT 10;
      `;
    } catch (e) {
      // pg_stat_statements might not be enabled
    }
    
    stats.tableSizes = tableSizes;
    stats.indexUsage = indexUsage;
    stats.slowQueries = slowQueries;
    
    return stats;
  }
  
  // Connection pool monitoring
  static async monitorConnectionPool(prisma: any): Promise<any> {
    const poolStats = await prisma.$queryRaw`
      SELECT 
        numbackends as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) as waiting_queries
      FROM pg_stat_database
      WHERE datname = current_database();
    `;
    
    return poolStats[0];
  }
  
  // Query timeout wrapper
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeout]);
  }
  
  // Bulk upsert optimization
  static async bulkUpsert(
    prisma: any,
    model: string,
    data: any[],
    uniqueFields: string[]
  ): Promise<any> {
    const operations = data.map(item => {
      const where: any = {};
      for (const field of uniqueFields) {
        where[field] = item[field];
      }
      
      return prisma[model].upsert({
        where,
        update: item,
        create: item,
      });
    });
    
    return prisma.$transaction(operations);
  }
}

// Export helper functions
export const {
  getPaginationParams,
  optimizeIncludes,
  buildWhereClause,
  batchOperation,
  getCacheKey,
  getIndexRecommendations,
  streamLargeDataset,
  withTimeout,
  bulkUpsert,
} = QueryOptimizer;

export default QueryOptimizer;