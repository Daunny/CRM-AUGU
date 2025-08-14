# CLAUDE.md - AI Assistant Guidelines

이 파일은 Claude AI가 CRM AUGU 프로젝트를 이해하고 일관된 개발을 지원하기 위한 가이드라인입니다.

## 📋 프로젝트 개요

**CRM AUGU**는 고객 중심의 워크플로우를 통해 HRD 비즈니스의 전체 프로세스를 관리하는 통합 CRM 플랫폼입니다.

### 핵심 가치
- **Customer-Centric**: 모든 기능이 고객 경험 향상에 집중
- **Workflow Automation**: 반복 작업 자동화로 생산성 극대화  
- **Data-Driven**: 데이터 기반 의사결정 지원
- **Scalable Architecture**: 성장 가능한 확장형 아키텍처

## 🎯 품질 관리 원칙

### 1. 일관성 유지 (Consistency)
- **모든 코드는 동일한 표준을 따라야 함**
- `.editorconfig`, `.prettierrc`, `.eslintrc.json` 설정 준수
- TypeScript strict mode 활성화
- 코드 리뷰 전 `make check` 실행 필수

### 2. 자동화 우선 (Automation First)
- **반복 작업은 Makefile로 자동화**
- CI/CD 파이프라인 통과 필수
- Pre-commit hooks 활용
- 자동 테스트 커버리지 80% 유지

### 3. 문서화 동기화 (Documentation Sync)
- **코드 변경 시 문서 동시 업데이트**
- PR 머지 시 `DEVELOPMENT_STATUS.md` 업데이트
- 기능별 문서 작성 (`docs/development/phase#/`)
- API 변경 시 즉시 문서화

## 🏗️ 기술 스택

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: Prisma
- **Cache**: Redis
- **Auth**: JWT (Access + Refresh Token)
- **Validation**: Joi
- **Logging**: Winston

### Frontend  
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit + Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Yup
- **Routing**: React Router v6

### Infrastructure
- **Container**: Docker & Docker Compose
- **Real-time**: Socket.io
- **File Storage**: MinIO (S3 compatible) - 추후 구현
- **Search**: Elasticsearch - 추후 구현

## 📁 프로젝트 구조

```
crm-augu/
├── backend/
│   ├── src/
│   │   ├── config/          # 설정 파일 (database, redis, app)
│   │   ├── controllers/     # HTTP 요청 처리
│   │   ├── services/        # 비즈니스 로직
│   │   ├── repositories/    # 데이터 액세스 계층
│   │   ├── middleware/      # Express 미들웨어
│   │   ├── routes/          # API 라우트 정의
│   │   ├── types/           # TypeScript 타입 정의
│   │   ├── utils/           # 유틸리티 함수
│   │   └── index.ts         # 앱 진입점
│   ├── prisma/
│   │   ├── schema.prisma    # 데이터베이스 스키마
│   │   └── migrations/      # DB 마이그레이션
│   └── tests/               # 테스트 파일
├── frontend/
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 서비스
│   │   ├── store/           # 상태 관리
│   │   ├── types/           # TypeScript 타입
│   │   ├── utils/           # 유틸리티 함수
│   │   └── App.tsx          # 메인 앱 컴포넌트
│   └── tests/               # 테스트 파일
├── docs/                    # 프로젝트 문서
│   ├── development/         # 개발 관련 문서
│   │   ├── phase1/         # Phase 1 개발 내역
│   │   ├── phase2/         # Phase 2 개발 내역
│   │   └── phase3/         # Phase 3 개발 내역
│   ├── api/                # API 문서
│   ├── database/           # 데이터베이스 문서
│   └── guides/             # 가이드 문서
└── docker-compose.yml       # Docker 구성
```

## 🔄 개발 프로세스

### 1. 작업 시작 전
```bash
# 1. 최신 코드 pull
git pull origin develop

# 2. 브랜치 생성
git checkout -b feature/기능명

# 3. 환경 동기화
make setup
```

### 2. 개발 중
```bash
# 개발 서버 실행
make dev

# 코드 품질 체크 (수시로)
make check

# 테스트 실행
make test
```

### 3. 커밋 전
```bash
# 1. 코드 품질 확인
make lint
make typecheck

# 2. 테스트 통과 확인
make test

# 3. 커밋 (규칙 준수)
git commit -m "feat(scope): description"
```

### 4. PR 생성
- PR 템플릿 작성
- 체크리스트 완료
- 리뷰어 지정

### 5. 머지 후
```bash
# 문서 업데이트 확인
- docs/DEVELOPMENT_STATUS.md
- docs/development/phase#/기능명.md
- CHANGELOG.md (major 변경 시)
```

## 📝 문서화 체계

### 필수 문서 업데이트 규칙

#### 매 PR마다 업데이트
1. **`docs/DEVELOPMENT_STATUS.md`**
   - 최근 완료 작업 추가
   - 진행률 업데이트
   - 알려진 이슈 관리

2. **`docs/development/phase#/기능명.md`**
   - 구현 내역 상세 기록
   - 테스트 결과 포함
   - 향후 개선사항 명시

#### 주간 업데이트
- **`PROJECT_GOVERNANCE.md`** - 프로세스 개선사항
- **`docs/CODE_REVIEW_GUIDELINES.md`** - 리뷰 기준 조정

#### 월간 업데이트
- **`ROADMAP.md`** - 진행 상황 반영
- **메트릭 분석** - 코드 품질 지표 검토

### 문서 템플릿 사용

#### 기능 구현 문서
```markdown
# [기능명] 구현

## 요구사항
- 원본 요구사항

## 구현 내역
### 1. 데이터베이스
- 스키마 변경사항
- 마이그레이션

### 2. Backend
- API 엔드포인트
- 비즈니스 로직

### 3. Frontend
- UI 컴포넌트
- 상태 관리

### 4. 테스트
- 테스트 케이스
- 커버리지

## 변경 이력
- YYYY-MM-DD: 내용

## 개선 필요사항
- 향후 개선점
```

## 💻 개발 명령어

### 자주 사용하는 명령어 (Makefile)
```bash
# 필수 명령어
make setup      # 초기 환경 설정
make dev        # 개발 서버 시작
make test       # 테스트 실행
make lint       # 린트 검사
make typecheck  # 타입 체크
make build      # 프로덕션 빌드

# 유틸리티 명령어
make check      # 빠른 품질 체크 (lint + typecheck)
make ci         # CI 체크 (lint + typecheck + test)
make status     # 프로젝트 상태 확인
make clean      # 클린업

# 데이터베이스
make db-migrate # 마이그레이션 실행
make db-seed    # 시드 데이터
make db-studio  # Prisma Studio 실행
make db-reset   # DB 초기화
```

### 개발 환경 포트
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prisma Studio: http://localhost:5555

## 🎨 코드 스타일 가이드

### 필수 규칙
1. **파일명**: kebab-case (`user-service.ts`)
2. **클래스**: PascalCase (`UserService`)
3. **함수/변수**: camelCase (`getUserById`)
4. **상수**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
5. **타입/인터페이스**: PascalCase (`UserData`)

### TypeScript 규칙
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): User | null => {
  return user?.data ?? null;
};

// ❌ Bad
interface user {  // PascalCase 위반
  id: any;  // any 타입 사용
}

const getUser = (id) => {  // 타입 명시 없음
  return user!.data;  // Non-null assertion
};
```

## 🔐 보안 체크리스트

### 매 개발 시 확인
- [ ] 환경 변수 하드코딩 없음
- [ ] 입력 검증 구현
- [ ] SQL Injection 방지 (Prisma 사용)
- [ ] XSS 방지
- [ ] 민감 정보 로깅 없음
- [ ] 인증/인가 체크

## 🧪 테스트 전략

### 테스트 작성 규칙
1. **파일 위치**: 같은 디렉토리에 `.test.ts` 파일
2. **커버리지 목표**: 80% 이상
3. **테스트 종류**:
   - Unit Test: 개별 함수/클래스
   - Integration Test: API 엔드포인트
   - E2E Test: 사용자 시나리오

### 테스트 실행
```bash
# 전체 테스트
make test

# 감시 모드
make test-watch

# 커버리지 확인
npm run test:coverage
```

## 📊 품질 지표 모니터링

### 주간 체크
| 지표 | 목표 | 체크 방법 |
|------|------|-----------|
| 테스트 커버리지 | ≥80% | `npm run test:coverage` |
| 타입 에러 | 0 | `make typecheck` |
| 린트 에러 | 0 | `make lint` |
| 빌드 성공 | 100% | `make build` |

### 월간 리뷰
- 코드 복잡도 분석
- 의존성 취약점 검사 (`npm audit`)
- 성능 메트릭 측정
- 기술 부채 평가

## 🚀 개발 진행 상황

### Phase 1: Foundation ✅ (완료)
- [x] 프로젝트 초기 설정
- [x] 데이터베이스 스키마 설계
- [x] 공통 유틸리티 구현
- [x] 인증/인가 시스템
- [x] 기본 API 구조

### Phase 2: Core Features (진행 중 - 80%)
- [x] 고객 관리 (Customer Management)
- [x] 영업 파이프라인 (Sales Pipeline)
- [x] 제안 관리 (Proposal Management)
- [x] 태스크 관리 (Task Management)
- [ ] 프로젝트 관리 (Project Management)

### Phase 3: Advanced Features (예정)
- [ ] 대시보드 및 리포트
- [ ] 실시간 알림
- [ ] 파일 업로드
- [ ] 이메일 연동

### Phase 4: Optimization (예정)
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 모니터링 구축
- [ ] 배포 파이프라인

## 🔄 지속적 개선

### 개선 프로세스
1. **피드백 수집**: 코드 리뷰, 사용자 피드백
2. **분석**: 메트릭 분석, 패턴 파악
3. **개선안 도출**: 문서화, 우선순위 설정
4. **구현**: 점진적 개선
5. **검증**: 테스트, 모니터링

### 문서 진화
- 새로운 패턴 발견 시 가이드라인 추가
- 반복되는 이슈는 체크리스트화
- 베스트 프랙티스를 표준으로 승격

## ⚠️ 주의사항

### Critical Rules
1. **절대 main 브랜치에 직접 커밋 금지**
2. **환경 변수 파일(.env) 커밋 금지**
3. **테스트 없는 코드 머지 금지**
4. **문서 업데이트 없는 기능 배포 금지**

### 데이터베이스 변경
- 항상 마이그레이션 사용
- 롤백 계획 수립
- 프로덕션 데이터 백업

### API 변경
- 버전 관리 고려
- Breaking change 최소화
- Deprecation 기간 제공

## 📚 참고 자료

### 핵심 문서
- [PROJECT_GOVERNANCE.md](./PROJECT_GOVERNANCE.md) - 프로젝트 거버넌스
- [docs/DEVELOPMENT_STATUS.md](./docs/DEVELOPMENT_STATUS.md) - 개발 현황
- [docs/CODE_REVIEW_GUIDELINES.md](./docs/CODE_REVIEW_GUIDELINES.md) - 코드 리뷰 가이드

### 외부 자료
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)
- [Material-UI Documentation](https://mui.com)

## 🤝 개발 원칙

1. **KISS (Keep It Simple, Stupid)**: 단순하고 명확한 코드 작성
2. **DRY (Don't Repeat Yourself)**: 코드 중복 최소화
3. **SOLID Principles**: 객체지향 설계 원칙 준수
4. **Test First**: 테스트 가능한 코드 작성
5. **Documentation as Code**: 문서도 코드처럼 관리
6. **Continuous Improvement**: 지속적 개선과 학습
7. **Quality First**: 품질은 타협 불가

---

**Remember**: 
- 이 프로젝트의 목표는 안정적이고 확장 가능한 CRM 시스템 구축
- 모든 개발 과정을 체계적으로 문서화
- 품질 기준을 항상 충족
- 팀과 프로젝트가 함께 성장

**Last Updated**: 2025-01-14
**Version**: 2.0.0