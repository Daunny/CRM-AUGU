# CLAUDE.md - AI Assistant Guidelines

이 파일은 Claude AI가 CRM AUGU 프로젝트를 이해하고 일관된 개발을 지원하기 위한 가이드라인입니다.

## 📋 프로젝트 개요

**CRM AUGU**는 고객 중심의 워크플로우를 통해 HRD 비즈니스의 전체 프로세스를 관리하는 통합 CRM 플랫폼입니다.

### 핵심 가치
- **Customer-Centric**: 모든 기능이 고객 경험 향상에 집중
- **Workflow Automation**: 반복 작업 자동화로 생산성 극대화  
- **Data-Driven**: 데이터 기반 의사결정 지원
- **Scalable Architecture**: 성장 가능한 확장형 아키텍처

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
└── docker-compose.yml       # Docker 구성

```

## 💻 개발 환경 설정

### 필수 요구사항
- Node.js 20+
- Docker Desktop
- Git

### 개발 명령어

```bash
# 전체 서비스 시작 (Docker Compose)
docker-compose up -d

# 전체 서비스 중지
docker-compose down

# Backend 개발 (로컬)
cd backend
npm install
npm run dev         # 개발 서버 (nodemon + ts-node)
npm run build       # TypeScript 컴파일
npm run test        # 테스트 실행
npm run lint        # ESLint 검사
npm run typecheck   # TypeScript 타입 체크

# Frontend 개발 (로컬)
cd frontend
npm install
npm run dev         # 개발 서버 (Vite)
npm run build       # 프로덕션 빌드
npm run test        # 테스트 실행
npm run lint        # ESLint 검사
npm run typecheck   # TypeScript 타입 체크

# Database 관리
cd backend
npx prisma migrate dev     # 마이그레이션 생성 및 적용
npx prisma studio          # Prisma Studio (DB GUI)
npx prisma generate        # Prisma Client 재생성
```

### 포트 정보
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prisma Studio: http://localhost:5555

## 🎨 코드 스타일 가이드

### 명명 규칙

```typescript
// 파일명: kebab-case
customer-service.ts
auth-middleware.ts

// 클래스: PascalCase  
class CustomerService {}
class AuthMiddleware {}

// 함수/변수: camelCase
const findCustomerById = () => {}
let customerData = {}

// 상수: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'http://localhost:8080'

// 타입/인터페이스: PascalCase
interface CustomerData {}
type CustomerStatus = 'active' | 'inactive'

// React 컴포넌트: PascalCase
function CustomerList() {}
const CustomerCard = () => {}
```

### 디렉토리 구조 규칙

```typescript
// 기능별 그룹화 (Feature-based)
features/
  customer/
    components/
    hooks/
    services/
    types/
    
// 컴포넌트 구조
components/
  CustomerCard/
    index.tsx           // 컴포넌트 export
    CustomerCard.tsx    // 메인 컴포넌트
    CustomerCard.test.tsx
    CustomerCard.styles.ts
```

### TypeScript 규칙

```typescript
// 명시적 타입 선언
const count: number = 0
const name: string = 'John'

// 인터페이스 우선 사용 (확장 가능한 경우)
interface User {
  id: string
  name: string
}

// 타입 별칭 (유니온, 인터섹션, 유틸리티 타입)
type Status = 'active' | 'inactive'
type SafeUser = Omit<User, 'password'>

// 제네릭 사용
function getValue<T>(key: string): T | null {
  // ...
}

// Non-null assertion 최소화
// Bad: user!.name
// Good: user?.name ?? 'Unknown'
```

### React 컴포넌트 규칙

```typescript
// 함수형 컴포넌트 사용
function CustomerList({ customers }: Props) {
  return <div>...</div>
}

// Props 타입 정의
interface CustomerListProps {
  customers: Customer[]
  onSelect?: (customer: Customer) => void
}

// 커스텀 훅은 use 접두사
function useCustomer(id: string) {
  // ...
}

// 이벤트 핸들러는 handle 접두사
const handleClick = () => {}
const handleSubmit = () => {}
```

## 🔐 보안 가이드라인

### 필수 보안 사항

1. **환경 변수 관리**
   - 민감한 정보는 절대 코드에 하드코딩하지 않음
   - .env 파일은 절대 커밋하지 않음
   - 프로덕션과 개발 환경 분리

2. **인증/인가**
   - 모든 API 엔드포인트에 인증 미들웨어 적용
   - JWT 토큰 만료 시간 설정 (Access: 15분, Refresh: 7일)
   - 역할 기반 접근 제어 (RBAC) 구현

3. **입력 검증**
   - 모든 사용자 입력은 Joi로 검증
   - SQL Injection 방지 (Prisma ORM 사용)
   - XSS 방지 (React 기본 + 추가 sanitization)

4. **에러 처리**
   - 민감한 정보가 에러 메시지에 노출되지 않도록 주의
   - 프로덕션 환경에서는 상세 에러 스택 숨김

## 🧪 테스트 전략

### 테스트 레벨
- **Unit Test**: 개별 함수/컴포넌트 (목표: 80% 커버리지)
- **Integration Test**: API 엔드포인트
- **E2E Test**: 핵심 사용자 시나리오

### 테스트 파일 위치
```
component.tsx
component.test.tsx  // 같은 디렉토리에 위치
```

## 📝 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

### 예시
```
feat(customer): add customer search functionality

- Implement full-text search for customers
- Add search filters (status, industry, size)
- Update customer list UI with search bar

Closes #123
```

## 🚀 개발 우선순위

### Phase 1: Foundation (현재)
- [x] 프로젝트 초기 설정
- [x] 데이터베이스 스키마 설계
- [x] 공통 유틸리티 구현
- [ ] 인증/인가 시스템
- [ ] 기본 API 구조

### Phase 2: Core Features
- [ ] 고객 관리 (CRUD)
- [ ] 영업 파이프라인
- [ ] 프로젝트 관리
- [ ] 태스크 관리

### Phase 3: Advanced Features
- [ ] 대시보드 및 리포트
- [ ] 실시간 알림
- [ ] 파일 업로드
- [ ] 이메일 연동

### Phase 4: Optimization
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 모니터링 구축
- [ ] 배포 파이프라인

## ⚠️ 주의사항

1. **데이터베이스 변경 시**
   - 항상 마이그레이션 파일 생성
   - 기존 데이터 호환성 고려
   - 롤백 계획 수립

2. **API 변경 시**
   - 버전 관리 고려
   - Breaking change 최소화
   - API 문서 업데이트

3. **의존성 추가 시**
   - 라이센스 확인
   - 번들 크기 영향 검토
   - 보안 취약점 검사

## 📚 참고 자료

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)
- [Material-UI Documentation](https://mui.com)

## 🤝 개발 원칙

1. **KISS (Keep It Simple, Stupid)**: 단순하고 명확한 코드 작성
2. **DRY (Don't Repeat Yourself)**: 코드 중복 최소화
3. **SOLID Principles**: 객체지향 설계 원칙 준수
4. **Test First**: 테스트 가능한 코드 작성
5. **Documentation**: 코드는 자체 문서화되어야 함

---

**Remember**: 이 프로젝트의 목표는 안정적이고 확장 가능한 CRM 시스템을 구축하는 것입니다. 
항상 코드 품질, 보안, 성능을 염두에 두고 개발하세요.