/**
 * @swagger
 * /api/sales-pipeline/metrics:
 *   get:
 *     summary: Get pipeline metrics
 *     description: Retrieve comprehensive sales pipeline metrics including conversion rates, average deal size, and sales cycle duration
 *     tags: [Sales Pipeline]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salesTeamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales team
 *       - in: query
 *         name: accountManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account manager
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for metrics calculation
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for metrics calculation
 *     responses:
 *       200:
 *         description: Pipeline metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOpportunities:
 *                       type: integer
 *                       example: 142
 *                     totalValue:
 *                       type: number
 *                       example: 5250000
 *                     averageDealSize:
 *                       type: number
 *                       example: 36971.83
 *                     conversionRate:
 *                       type: number
 *                       example: 0.28
 *                     averageSalesCycle:
 *                       type: number
 *                       example: 45.5
 *                       description: Average days from lead to close
 *                     stageDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                             example: PROPOSAL
 *                           count:
 *                             type: integer
 *                             example: 35
 *                           value:
 *                             type: number
 *                             example: 1750000
 *                           percentage:
 *                             type: number
 *                             example: 24.6
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: Internal server error
 *
 * /api/sales-pipeline/proposals:
 *   get:
 *     summary: Get proposal analytics
 *     description: Analyze proposal performance including acceptance rates, approval times, and template effectiveness
 *     tags: [Sales Pipeline]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salesTeamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales team
 *       - in: query
 *         name: accountManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account manager
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by proposal template
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum proposal amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum proposal amount
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis
 *     responses:
 *       200:
 *         description: Proposal analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProposals:
 *                       type: integer
 *                       example: 85
 *                     acceptanceRate:
 *                       type: number
 *                       example: 0.68
 *                       description: Percentage of proposals accepted
 *                     rejectionRate:
 *                       type: number
 *                       example: 0.15
 *                     averageApprovalTime:
 *                       type: number
 *                       example: 2.5
 *                       description: Average days to approval
 *                     totalValue:
 *                       type: number
 *                       example: 3250000
 *                     averageValue:
 *                       type: number
 *                       example: 38235.29
 *                     averageDiscountPercent:
 *                       type: number
 *                       example: 8.5
 *                     templatePerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           templateId:
 *                             type: string
 *                             format: uuid
 *                           templateName:
 *                             type: string
 *                             example: Enterprise Template
 *                           usageCount:
 *                             type: integer
 *                             example: 25
 *                           acceptanceRate:
 *                             type: number
 *                             example: 0.72
 *                           averageValue:
 *                             type: number
 *                             example: 45000
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *
 * /api/sales-pipeline/funnel:
 *   get:
 *     summary: Get funnel analysis
 *     description: Analyze conversion rates through each stage of the sales funnel
 *     tags: [Sales Pipeline]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salesTeamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales team
 *       - in: query
 *         name: accountManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account manager
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company
 *     responses:
 *       200:
 *         description: Funnel analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                             example: QUALIFICATION
 *                           count:
 *                             type: integer
 *                             example: 100
 *                           value:
 *                             type: number
 *                             example: 2500000
 *                           conversionToNext:
 *                             type: number
 *                             example: 0.75
 *                             description: Conversion rate to next stage
 *                           averageTimeInStage:
 *                             type: number
 *                             example: 7.5
 *                             description: Average days in this stage
 *                     overallConversion:
 *                       type: number
 *                       example: 0.28
 *                       description: Lead to close conversion rate
 *                     bottlenecks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fromStage:
 *                             type: string
 *                             example: PROPOSAL
 *                           toStage:
 *                             type: string
 *                             example: NEGOTIATION
 *                           conversionRate:
 *                             type: number
 *                             example: 0.45
 *                           averageTime:
 *                             type: number
 *                             example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *
 * /api/sales-pipeline/forecast:
 *   get:
 *     summary: Get sales forecast
 *     description: Generate sales forecast for the specified period with best/worst case scenarios
 *     tags: [Sales Pipeline]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 3
 *         description: Number of months to forecast
 *     responses:
 *       200:
 *         description: Sales forecast generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     forecast:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: 2024-01
 *                           expected:
 *                             type: number
 *                             example: 850000
 *                             description: Expected revenue
 *                           bestCase:
 *                             type: number
 *                             example: 1200000
 *                             description: Best case scenario (all opportunities close)
 *                           worstCase:
 *                             type: number
 *                             example: 450000
 *                             description: Worst case scenario (only high probability close)
 *                           weighted:
 *                             type: number
 *                             example: 780000
 *                             description: Probability-weighted forecast
 *                           dealCount:
 *                             type: integer
 *                             example: 12
 *                             description: Expected number of deals
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalExpected:
 *                           type: number
 *                           example: 2550000
 *                         totalBestCase:
 *                           type: number
 *                           example: 3600000
 *                         totalWorstCase:
 *                           type: number
 *                           example: 1350000
 *                         totalWeighted:
 *                           type: number
 *                           example: 2340000
 *                         confidence:
 *                           type: number
 *                           example: 0.72
 *                           description: Forecast confidence score
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *
 * /api/sales-pipeline/team-performance:
 *   get:
 *     summary: Get team performance metrics
 *     description: Analyze sales team and individual performance metrics
 *     tags: [Sales Pipeline]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salesTeamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales team
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance analysis
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance analysis
 *     responses:
 *       200:
 *         description: Team performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     teamMetrics:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                           example: 5250000
 *                         averageDealSize:
 *                           type: number
 *                           example: 45000
 *                         winRate:
 *                           type: number
 *                           example: 0.28
 *                         averageSalesCycle:
 *                           type: number
 *                           example: 42
 *                     individualPerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           userName:
 *                             type: string
 *                             example: John Smith
 *                           closedDeals:
 *                             type: integer
 *                             example: 15
 *                           revenue:
 *                             type: number
 *                             example: 750000
 *                           averageDealSize:
 *                             type: number
 *                             example: 50000
 *                           winRate:
 *                             type: number
 *                             example: 0.32
 *                           pipelineValue:
 *                             type: number
 *                             example: 450000
 *                           quota:
 *                             type: number
 *                             example: 800000
 *                           quotaAttainment:
 *                             type: number
 *                             example: 0.94
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                             example: 1
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           userName:
 *                             type: string
 *                             example: Jane Doe
 *                           metric:
 *                             type: string
 *                             example: revenue
 *                           value:
 *                             type: number
 *                             example: 1250000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */

export {};