# Task Management 구현

## 요구사항
- 태스크 생성, 조회, 수정, 삭제 기능
- 담당자 할당 및 다중 할당
- 반복 태스크 생성
- 태스크 알림 시스템
- 계층적 태스크 구조 (부모-자식 관계)

## 구현 내역

### 1. 데이터베이스
#### 추가된 테이블
- `Task` - 태스크 정보
- `TaskComment` - 태스크 댓글
- `TaskAttachment` - 태스크 첨부파일
- `TaskHistory` - 태스크 변경 이력

#### 새로운 Enum
```prisma
enum TaskCategory {
  GENERAL
  MEETING
  CALL
  EMAIL
  DOCUMENT
  REVIEW
  TRAINING
  PROJECT
  SUPPORT
}

enum RecurringType {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

#### 마이그레이션
- 파일: `20250114_task_management.sql`
- 계층 구조를 위한 self-referencing 관계 추가

### 2. Backend

#### 생성/수정된 파일
- `backend/src/services/task.service.ts` - 태스크 비즈니스 로직
- `backend/src/controllers/task.controller.ts` - HTTP 요청 처리
- `backend/src/routes/task.routes.ts` - 라우팅 설정
- `backend/src/jobs/task-reminders.job.ts` - 알림 크론 작업

#### 주요 기능
1. **CRUD 작업**
   - 생성, 조회, 수정, 삭제
   - 페이지네이션 및 필터링

2. **반복 태스크**
   ```typescript
   async createRecurringTasks(originalTaskId: string) {
     // 원본 태스크 기반으로 반복 태스크 생성
     // 반복 타입에 따라 다음 날짜 계산
   }
   ```

3. **알림 시스템**
   - 30분마다 리마인더 체크
   - 1시간마다 지연 태스크 체크
   - node-cron 사용

4. **계층 구조**
   - 부모-자식 태스크 관계
   - 서브태스크 관리

#### API 엔드포인트
```
GET    /api/tasks              # 태스크 목록
GET    /api/tasks/my           # 내 태스크
GET    /api/tasks/upcoming     # 예정된 태스크
GET    /api/tasks/overdue      # 지연된 태스크
GET    /api/tasks/:id          # 태스크 상세
POST   /api/tasks              # 태스크 생성
PUT    /api/tasks/:id          # 태스크 수정
DELETE /api/tasks/:id          # 태스크 삭제
POST   /api/tasks/:id/assign   # 담당자 할당
POST   /api/tasks/bulk-assign  # 대량 할당
GET    /api/tasks/statistics   # 통계
```

### 3. Frontend
- 아직 구현 안됨 (Phase 3에서 구현 예정)

### 4. 테스트
- 단위 테스트: 작성 예정
- 통합 테스트: 작성 예정

## 변경 이력
- 2025-01-14: 초기 구현
- 2025-01-14: 반복 태스크 기능 추가
- 2025-01-14: 알림 크론 작업 추가

## 참고사항

### 주의사항
- date-fns 패키지 의존성 필요
- node-cron 패키지 의존성 필요
- 반복 태스크는 최대 12개월까지만 생성

### 향후 개선 필요 사항
1. 알림 전송 메커니즘 구현 (이메일/푸시)
2. 태스크 템플릿 기능
3. 태스크 대시보드 통계
4. 파일 첨부 기능 활성화
5. 태스크 내 멘션 기능