# Phase 3 상세 실행 계획

## 📋 개요
Phase 3는 CRM AUGU의 고급 기능을 구현하는 단계로, 데이터 시각화, 실시간 통신, 파일 관리, 외부 시스템 연동 등의 기능을 포함합니다.

## 🎯 Phase 3 목표
- 경영진 대시보드 및 리포팅 시스템 구축
- 실시간 알림 및 협업 기능 구현
- 파일 관리 및 문서 처리 시스템 구축
- 이메일 연동 및 자동화 구현
- 고급 검색 및 데이터 분석 기능 구현

## 📅 개발 일정 (4주)

### Week 1: 대시보드 및 리포팅 시스템
- 경영진 대시보드 구현
- 실시간 KPI 모니터링
- 커스터마이징 가능한 위젯 시스템
- PDF/Excel 리포트 생성

### Week 2: 실시간 통신 시스템
- WebSocket 기반 실시간 알림
- 활동 피드 및 타임라인
- 멘션 및 태그 시스템
- 푸시 알림 (브라우저/모바일)

### Week 3: 파일 관리 시스템
- MinIO 기반 파일 스토리지
- 문서 버전 관리
- 파일 미리보기 및 변환
- 보안 파일 공유 링크

### Week 4: 외부 시스템 연동
- 이메일 서버 연동 (SMTP/IMAP)
- 캘린더 동기화
- 데이터 임포트/익스포트
- API 웹훅 시스템

## 🏗️ 기술 구현 상세

### 1. 대시보드 및 리포팅 시스템

#### 1.1 경영진 대시보드
```typescript
// 대시보드 위젯 구조
interface DashboardWidget {
  id: string;
  type: 'chart' | 'stat' | 'table' | 'calendar' | 'activity';
  title: string;
  dataSource: string;
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
    metrics?: string[];
    dimensions?: string[];
    filters?: FilterConfig[];
    refreshInterval?: number;
  };
  position: { x: number; y: number; w: number; h: number };
}

// 대시보드 API
GET /api/dashboards                    // 대시보드 목록
GET /api/dashboards/:id               // 대시보드 상세
POST /api/dashboards                  // 대시보드 생성
PUT /api/dashboards/:id              // 대시보드 수정
DELETE /api/dashboards/:id           // 대시보드 삭제

// 위젯 데이터 API
GET /api/widgets/:widgetId/data      // 위젯 데이터 조회
POST /api/widgets                    // 위젯 추가
PUT /api/widgets/:id                 // 위젯 수정
DELETE /api/widgets/:id              // 위젯 삭제
```

#### 1.2 리포트 생성 시스템
```typescript
// 리포트 템플릿 구조
interface ReportTemplate {
  id: string;
  name: string;
  type: 'sales' | 'project' | 'kpi' | 'financial' | 'custom';
  format: 'pdf' | 'excel' | 'html';
  sections: ReportSection[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    time: string;
  };
}

// 리포트 API
POST /api/reports/generate           // 리포트 생성
GET /api/reports/templates           // 템플릿 목록
POST /api/reports/templates          // 템플릿 생성
POST /api/reports/schedule           // 정기 리포트 설정
```

#### 1.3 데이터 집계 서비스
```typescript
// backend/src/services/analytics.service.ts
export class AnalyticsService {
  // 영업 분석
  async getSalesAnalytics(filter: AnalyticsFilter) {
    // 파이프라인 분석
    // 전환율 분석
    // 영업 사이클 분석
    // 팀/개인 성과 분석
  }

  // 프로젝트 분석
  async getProjectAnalytics(filter: AnalyticsFilter) {
    // 프로젝트 진행률
    // 리소스 활용도
    // 일정 준수율
    // 수익성 분석
  }

  // 고객 분석
  async getCustomerAnalytics(filter: AnalyticsFilter) {
    // 고객 세그먼트 분석
    // LTV (Lifetime Value)
    // 이탈률 분석
    // 만족도 추이
  }

  // 실시간 대시보드 데이터
  async getDashboardMetrics(widgetConfig: WidgetConfig) {
    // 동적 쿼리 생성
    // 캐싱 전략 적용
    // 실시간 데이터 스트리밍
  }
}
```

### 2. 실시간 통신 시스템

#### 2.1 WebSocket 서버 구축
```typescript
// backend/src/websocket/socket.server.ts
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export class SocketServer {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map();

  initialize(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: { origin: process.env.FRONTEND_URL },
    });

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      if (user) {
        socket.data.userId = user.userId;
        next();
      } else {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: any) {
    const userId = socket.data.userId;
    
    // 사용자 소켓 등록
    this.addUserSocket(userId, socket.id);
    
    // 이벤트 핸들러
    socket.on('subscribe', (channel: string) => {
      socket.join(channel);
    });

    socket.on('disconnect', () => {
      this.removeUserSocket(userId, socket.id);
    });
  }

  // 알림 전송
  sendNotification(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
    }
  }

  // 브로드캐스트
  broadcast(channel: string, event: string, data: any) {
    this.io.to(channel).emit(event, data);
  }
}
```

#### 2.2 알림 시스템
```typescript
// 알림 타입 정의
enum NotificationType {
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  MEETING_REMINDER = 'MEETING_REMINDER',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  KPI_ALERT = 'KPI_ALERT',
  MENTION = 'MENTION',
  COMMENT = 'COMMENT',
  APPROVAL_REQUEST = 'APPROVAL_REQUEST',
}

// 알림 서비스
export class NotificationService {
  async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high';
  }) {
    // DB 저장
    const notification = await prisma.notification.create({
      data: input
    });

    // 실시간 전송
    socketServer.sendNotification(input.userId, notification);

    // 이메일/푸시 알림 (설정에 따라)
    await this.sendExternalNotification(input);

    return notification;
  }

  // 알림 설정 관리
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ) {
    // 이메일, 푸시, 인앱 알림 설정
  }
}
```

### 3. 파일 관리 시스템

#### 3.1 MinIO 설정
```yaml
# docker-compose.yml 추가
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
```

#### 3.2 파일 업로드 서비스
```typescript
// backend/src/services/file.service.ts
import { Client } from 'minio';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export class FileService {
  private minioClient: Client;

  constructor() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT!),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata: {
      entityType: string;
      entityId: string;
      userId: string;
    }
  ) {
    const fileId = uuidv4();
    const bucketName = metadata.entityType.toLowerCase();
    
    // 버킷 생성 (없으면)
    await this.ensureBucket(bucketName);

    // 파일 업로드
    await this.minioClient.putObject(
      bucketName,
      fileId,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Entity-Id': metadata.entityId,
        'X-User-Id': metadata.userId,
      }
    );

    // 이미지인 경우 썸네일 생성
    if (file.mimetype.startsWith('image/')) {
      await this.createThumbnail(file, bucketName, fileId);
    }

    // DB 기록
    const fileRecord = await prisma.file.create({
      data: {
        id: fileId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        bucket: bucketName,
        entityType: metadata.entityType,
        entityId: metadata.entityId,
        uploadedBy: metadata.userId,
      }
    });

    return fileRecord;
  }

  async createThumbnail(
    file: Express.Multer.File,
    bucket: string,
    fileId: string
  ) {
    const thumbnail = await sharp(file.buffer)
      .resize(200, 200)
      .toBuffer();

    await this.minioClient.putObject(
      bucket,
      `${fileId}_thumb`,
      thumbnail
    );
  }

  async getFileUrl(fileId: string, expiry: number = 3600) {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    return await this.minioClient.presignedGetObject(
      file.bucket,
      fileId,
      expiry
    );
  }

  async deleteFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    // MinIO에서 삭제
    await this.minioClient.removeObject(file.bucket, fileId);
    
    // 썸네일 삭제
    if (file.mimeType.startsWith('image/')) {
      await this.minioClient.removeObject(
        file.bucket,
        `${fileId}_thumb`
      );
    }

    // DB에서 삭제
    await prisma.file.delete({
      where: { id: fileId }
    });
  }
}
```

### 4. 이메일 연동 시스템

#### 4.1 이메일 서비스
```typescript
// backend/src/services/email.service.ts
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import handlebars from 'handlebars';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 이메일 발송
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    template: string;
    data: any;
    attachments?: any[];
  }) {
    const template = await this.loadTemplate(options.template);
    const html = handlebars.compile(template)(options.data);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html,
      attachments: options.attachments,
    };

    const result = await this.transporter.sendMail(mailOptions);
    
    // 발송 기록 저장
    await prisma.emailLog.create({
      data: {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: options.subject,
        template: options.template,
        status: 'SENT',
        sentAt: new Date(),
      }
    });

    return result;
  }

  // 이메일 수신 (IMAP)
  async fetchEmails(config: {
    userId: string;
    folder?: string;
    since?: Date;
  }) {
    const client = new ImapFlow({
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT!),
      secure: true,
      auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS,
      },
    });

    await client.connect();
    
    const mailbox = await client.getMailbox(config.folder || 'INBOX');
    
    const messages = await client.fetch(
      config.since ? { since: config.since } : '1:*',
      { envelope: true, bodyParts: true }
    );

    // CRM에 이메일 기록
    for await (const message of messages) {
      await this.processIncomingEmail(message, config.userId);
    }

    await client.logout();
  }

  // 이메일 템플릿 관리
  private async loadTemplate(name: string): Promise<string> {
    const template = await prisma.emailTemplate.findUnique({
      where: { name }
    });

    if (!template) {
      throw new NotFoundError(`Email template ${name} not found`);
    }

    return template.content;
  }

  // 자동 응답 설정
  async setupAutoResponder(config: {
    trigger: string;
    template: string;
    conditions?: any;
  }) {
    // 자동 응답 규칙 저장
    await prisma.autoResponder.create({
      data: config
    });
  }
}
```

### 5. 고급 검색 시스템

#### 5.1 Elasticsearch 통합
```typescript
// backend/src/services/search.service.ts
import { Client } from '@elastic/elasticsearch';

export class SearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }

  // 인덱스 생성
  async createIndex(name: string, mappings: any) {
    await this.client.indices.create({
      index: name,
      body: {
        mappings,
        settings: {
          analysis: {
            analyzer: {
              korean: {
                type: 'custom',
                tokenizer: 'nori_tokenizer',
                filter: ['lowercase', 'nori_part_of_speech'],
              },
            },
          },
        },
      },
    });
  }

  // 문서 인덱싱
  async indexDocument(index: string, id: string, document: any) {
    await this.client.index({
      index,
      id,
      body: document,
    });
  }

  // 전체 텍스트 검색
  async search(query: {
    index: string | string[];
    text: string;
    filters?: any;
    from?: number;
    size?: number;
    highlight?: boolean;
  }) {
    const body: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query.text,
                fields: ['*'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: query.filters || [],
        },
      },
      from: query.from || 0,
      size: query.size || 10,
    };

    if (query.highlight) {
      body.highlight = {
        fields: {
          '*': {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };
    }

    const result = await this.client.search({
      index: query.index,
      body,
    });

    return {
      total: result.hits.total,
      hits: result.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight,
      })),
    };
  }

  // 자동완성
  async suggest(index: string, prefix: string, field: string) {
    const result = await this.client.search({
      index,
      body: {
        suggest: {
          suggestions: {
            prefix,
            completion: {
              field,
              size: 10,
            },
          },
        },
      },
    });

    return result.suggest.suggestions[0].options;
  }

  // 집계 분석
  async aggregate(query: {
    index: string;
    aggregations: any;
    filters?: any;
  }) {
    const result = await this.client.search({
      index: query.index,
      body: {
        size: 0,
        query: {
          bool: {
            filter: query.filters || [],
          },
        },
        aggs: query.aggregations,
      },
    });

    return result.aggregations;
  }
}
```

### 6. 데이터 임포트/익스포트

#### 6.1 데이터 임포트 서비스
```typescript
// backend/src/services/import.service.ts
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { Readable } from 'stream';

export class ImportService {
  // CSV 임포트
  async importCSV(
    file: Express.Multer.File,
    config: {
      entityType: string;
      mapping: Record<string, string>;
      userId: string;
    }
  ) {
    const results: any[] = [];
    const errors: any[] = [];

    const stream = Readable.from(file.buffer.toString());
    
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', async (row) => {
          try {
            const mappedData = this.mapData(row, config.mapping);
            const validated = await this.validateData(
              mappedData,
              config.entityType
            );
            results.push(validated);
          } catch (error: any) {
            errors.push({ row, error: error.message });
          }
        })
        .on('end', async () => {
          // 배치 처리
          const imported = await this.batchImport(
            results,
            config.entityType,
            config.userId
          );
          
          resolve({
            success: imported.length,
            failed: errors.length,
            errors,
            importId: await this.createImportLog(config, imported, errors),
          });
        })
        .on('error', reject);
    });
  }

  // Excel 임포트
  async importExcel(
    file: Express.Multer.File,
    config: {
      entityType: string;
      mapping: Record<string, string>;
      sheetName?: string;
      userId: string;
    }
  ) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = config.sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = [];
    const errors = [];

    for (const row of data) {
      try {
        const mappedData = this.mapData(row, config.mapping);
        const validated = await this.validateData(
          mappedData,
          config.entityType
        );
        results.push(validated);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    const imported = await this.batchImport(
      results,
      config.entityType,
      config.userId
    );

    return {
      success: imported.length,
      failed: errors.length,
      errors,
      importId: await this.createImportLog(config, imported, errors),
    };
  }

  // 데이터 매핑
  private mapData(
    source: any,
    mapping: Record<string, string>
  ): any {
    const result: any = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      result[targetField] = source[sourceField];
    }

    return result;
  }

  // 데이터 검증
  private async validateData(data: any, entityType: string) {
    // 엔티티별 검증 규칙 적용
    switch (entityType) {
      case 'company':
        return this.validateCompany(data);
      case 'contact':
        return this.validateContact(data);
      case 'lead':
        return this.validateLead(data);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  // 배치 임포트
  private async batchImport(
    data: any[],
    entityType: string,
    userId: string
  ) {
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // 트랜잭션으로 배치 처리
      const imported = await prisma.$transaction(async (tx) => {
        return await this.importBatch(tx, batch, entityType, userId);
      });

      results.push(...imported);
    }

    return results;
  }
}
```

#### 6.2 데이터 익스포트 서비스
```typescript
// backend/src/services/export.service.ts
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export class ExportService {
  // Excel 익스포트
  async exportToExcel(config: {
    entityType: string;
    filters?: any;
    columns: Array<{
      field: string;
      header: string;
      width?: number;
      format?: string;
    }>;
    userId: string;
  }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.entityType);

    // 헤더 설정
    worksheet.columns = config.columns.map(col => ({
      header: col.header,
      key: col.field,
      width: col.width || 15,
    }));

    // 스타일 적용
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 데이터 조회
    const data = await this.fetchData(config.entityType, config.filters);

    // 데이터 추가
    data.forEach(item => {
      const row = worksheet.addRow(item);
      
      // 포맷 적용
      config.columns.forEach((col, index) => {
        if (col.format === 'currency') {
          row.getCell(index + 1).numFmt = '#,##0.00';
        } else if (col.format === 'date') {
          row.getCell(index + 1).numFmt = 'yyyy-mm-dd';
        }
      });
    });

    // 자동 필터 추가
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + config.columns.length)}${data.length + 1}`,
    };

    // 버퍼로 변환
    const buffer = await workbook.xlsx.writeBuffer();

    // 익스포트 기록
    await this.createExportLog(config, data.length);

    return buffer;
  }

  // CSV 익스포트
  async exportToCSV(config: {
    entityType: string;
    filters?: any;
    fields: string[];
    userId: string;
  }) {
    const data = await this.fetchData(config.entityType, config.filters);
    
    const parser = new Parser({ fields: config.fields });
    const csv = parser.parse(data);

    // 익스포트 기록
    await this.createExportLog(config, data.length);

    return Buffer.from(csv, 'utf-8');
  }

  // PDF 익스포트
  async exportToPDF(config: {
    title: string;
    data: any[];
    columns: Array<{ field: string; header: string }>;
    userId: string;
  }) {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // 제목
    doc.fontSize(20).text(config.title, { align: 'center' });
    doc.moveDown();

    // 테이블 헤더
    const startX = 50;
    let currentX = startX;
    const columnWidth = 100;

    doc.fontSize(12).font('Helvetica-Bold');
    config.columns.forEach(col => {
      doc.text(col.header, currentX, doc.y, { width: columnWidth });
      currentX += columnWidth;
    });

    doc.moveDown();
    doc.font('Helvetica');

    // 데이터 행
    config.data.forEach(row => {
      currentX = startX;
      config.columns.forEach(col => {
        const value = row[col.field] || '';
        doc.text(String(value), currentX, doc.y, { width: columnWidth });
        currentX += columnWidth;
      });
      doc.moveDown();
    });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(buffers);
        resolve(buffer);
      });
    });
  }

  // 데이터 조회
  private async fetchData(entityType: string, filters?: any) {
    switch (entityType) {
      case 'company':
        return await prisma.company.findMany({ where: filters });
      case 'lead':
        return await prisma.lead.findMany({ where: filters });
      case 'project':
        return await prisma.project.findMany({ where: filters });
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
```

## 📊 프론트엔드 구현

### 1. 대시보드 컴포넌트
```typescript
// frontend/src/components/Dashboard/DashboardGrid.tsx
import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useQuery } from '@tanstack/react-query';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardGrid: React.FC = () => {
  const [layouts, setLayouts] = useState({});
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const handleLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
    // 레이아웃 변경 저장
    dashboardService.updateLayout(layouts);
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget config={widget} />;
      case 'stat':
        return <StatWidget config={widget} />;
      case 'table':
        return <TableWidget config={widget} />;
      case 'activity':
        return <ActivityWidget config={widget} />;
      default:
        return null;
    }
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      onLayoutChange={handleLayoutChange}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={60}
      isDraggable
      isResizable
    >
      {widgets.map(widget => (
        <div key={widget.id} data-grid={widget.position}>
          {renderWidget(widget)}
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};
```

### 2. 실시간 알림 컴포넌트
```typescript
// frontend/src/components/Notification/NotificationProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

const NotificationContext = createContext<{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
});

export const NotificationProvider: React.FC = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(process.env.REACT_APP_WS_URL!, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // 토스트 알림 표시
      toast(notification.message, {
        type: notification.priority === 'high' ? 'error' : 'info',
      });

      // 브라우저 알림 (권한이 있는 경우)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
```

## 🧪 테스트 계획

### 1. 단위 테스트
- 각 서비스 메서드 테스트
- 유틸리티 함수 테스트
- React 컴포넌트 테스트

### 2. 통합 테스트
- API 엔드포인트 테스트
- WebSocket 연결 테스트
- 파일 업로드/다운로드 테스트
- 이메일 발송/수신 테스트

### 3. E2E 테스트
- 대시보드 워크플로우
- 실시간 알림 시나리오
- 파일 관리 시나리오
- 데이터 임포트/익스포트 시나리오

### 4. 성능 테스트
- 대용량 데이터 처리
- 동시 사용자 접속
- 실시간 데이터 스트리밍
- 파일 업로드 처리량

## 📈 성능 최적화

### 1. 캐싱 전략
- Redis 기반 쿼리 캐싱
- CDN을 통한 정적 파일 캐싱
- 브라우저 캐싱 활용

### 2. 데이터베이스 최적화
- 인덱스 최적화
- 쿼리 최적화
- 파티셔닝 적용

### 3. 프론트엔드 최적화
- 코드 스플리팅
- Lazy loading
- Virtual scrolling
- 이미지 최적화

## 🔐 보안 강화

### 1. 파일 업로드 보안
- 파일 타입 검증
- 파일 크기 제한
- 바이러스 스캔
- 안전한 파일명 생성

### 2. 이메일 보안
- SPF/DKIM 설정
- 이메일 암호화
- 피싱 방지

### 3. API 보안
- Rate limiting
- API 키 관리
- 웹훅 서명 검증

## 📝 배포 체크리스트

### Week 1 완료 시
- [ ] 대시보드 API 테스트 완료
- [ ] 리포트 생성 기능 검증
- [ ] 위젯 시스템 동작 확인

### Week 2 완료 시
- [ ] WebSocket 서버 안정성 확인
- [ ] 알림 전달 테스트
- [ ] 실시간 업데이트 검증

### Week 3 완료 시
- [ ] MinIO 스토리지 설정 완료
- [ ] 파일 업로드/다운로드 테스트
- [ ] 썸네일 생성 확인

### Week 4 완료 시
- [ ] 이메일 발송/수신 테스트
- [ ] 데이터 임포트/익스포트 검증
- [ ] 전체 통합 테스트 완료

## 🎯 성공 지표

### 기술적 지표
- API 응답 시간 < 200ms
- WebSocket 레이턴시 < 100ms
- 파일 업로드 처리량 > 100MB/s
- 동시 접속자 > 1000명 지원

### 비즈니스 지표
- 대시보드 로딩 시간 50% 감소
- 리포트 생성 시간 70% 단축
- 사용자 만족도 30% 향상
- 운영 효율성 40% 개선

## 📚 참고 자료

### 기술 문서
- [Socket.io Documentation](https://socket.io/docs/)
- [MinIO JavaScript SDK](https://docs.min.io/docs/javascript-client-api-reference.html)
- [Elasticsearch Node.js Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)

### 디자인 패턴
- Repository Pattern
- Observer Pattern (WebSocket)
- Strategy Pattern (Export formats)
- Factory Pattern (Widget creation)

---

**작성일**: 2025-01-13
**버전**: 1.0.0
**다음 단계**: Week 1 대시보드 구현 시작