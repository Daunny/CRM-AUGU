# Phase 1 개발 상세 계획

## 📋 개요

**목표**: 인증 시스템과 Core API 구현을 통한 기본 플랫폼 구축  
**기간**: 2025-01-13 ~ 2025-01-27 (2주)  
**우선순위**: 인증 시스템 → Core API → Frontend 기본 UI

## 🎯 주요 목표

1. **보안 인증 시스템 구축**
   - JWT 기반 인증/인가
   - Refresh Token 메커니즘
   - 역할 기반 접근 제어 (RBAC)

2. **Core API 완성**
   - 5개 핵심 모듈 CRUD 구현
   - 비즈니스 로직 구현
   - API 검증 및 에러 처리

## 📅 상세 개발 일정

### Week 1 (2025-01-13 ~ 2025-01-19): 인증 시스템

#### Day 1-2: JWT 인증 기본 구현
- [ ] JWT 토큰 생성/검증 유틸리티
- [ ] 환경변수 설정 (JWT_SECRET, JWT_EXPIRES_IN)
- [ ] 토큰 페이로드 타입 정의
- [ ] 토큰 서명 및 검증 로직

**구현 파일**:
- `backend/src/utils/jwt.ts`
- `backend/src/types/auth.types.ts`
- `backend/.env`

#### Day 3-4: 사용자 인증 API
- [ ] 회원가입 API (`POST /api/v1/auth/register`)
- [ ] 로그인 API (`POST /api/v1/auth/login`)
- [ ] 토큰 갱신 API (`POST /api/v1/auth/refresh`)
- [ ] 로그아웃 API (`POST /api/v1/auth/logout`)
- [ ] 비밀번호 해싱 (bcrypt)

**구현 파일**:
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/validators/auth.validator.ts`

#### Day 5: Refresh Token 구현
- [ ] Refresh Token 생성 및 저장 (Redis)
- [ ] Token Rotation 전략
- [ ] Refresh Token 블랙리스트
- [ ] 다중 디바이스 지원

**구현 파일**:
- `backend/src/services/token.service.ts`
- `backend/src/config/redis.ts`

#### Day 6-7: RBAC 구현
- [ ] 역할 정의 (ADMIN, MANAGER, USER)
- [ ] 권한 정의 (CREATE, READ, UPDATE, DELETE)
- [ ] 역할-권한 매핑
- [ ] 권한 검증 미들웨어
- [ ] 리소스별 접근 제어

**구현 파일**:
- `backend/src/middleware/rbac.middleware.ts`
- `backend/src/types/roles.types.ts`
- `backend/prisma/schema.prisma` (Role, Permission 모델)

### Week 2 (2025-01-20 ~ 2025-01-26): Core API 구현

#### Day 8-9: Company API
- [ ] Company CRUD 구현
  - `GET /api/v1/companies` - 목록 조회
  - `GET /api/v1/companies/:id` - 상세 조회
  - `POST /api/v1/companies` - 생성
  - `PUT /api/v1/companies/:id` - 수정
  - `DELETE /api/v1/companies/:id` - 삭제
- [ ] 검색/필터링 기능
- [ ] 페이지네이션
- [ ] Joi 검증 스키마

**구현 파일**:
- `backend/src/controllers/company.controller.ts`
- `backend/src/services/company.service.ts`
- `backend/src/repositories/company.repository.ts`
- `backend/src/validators/company.validator.ts`

#### Day 10-11: Lead API
- [ ] Lead CRUD 구현
  - `GET /api/v1/leads` - 목록 조회
  - `GET /api/v1/leads/:id` - 상세 조회
  - `POST /api/v1/leads` - 생성
  - `PUT /api/v1/leads/:id` - 수정
  - `DELETE /api/v1/leads/:id` - 삭제
- [ ] Lead 상태 관리 (NEW, CONTACTED, QUALIFIED, LOST)
- [ ] Lead Score 계산
- [ ] Lead-Company 연결

**구현 파일**:
- `backend/src/controllers/lead.controller.ts`
- `backend/src/services/lead.service.ts`
- `backend/src/repositories/lead.repository.ts`
- `backend/src/validators/lead.validator.ts`

#### Day 12: Opportunity API
- [ ] Opportunity CRUD 구현
- [ ] 파이프라인 단계 관리
- [ ] 예상 매출 계산
- [ ] Lead → Opportunity 전환

**구현 파일**:
- `backend/src/controllers/opportunity.controller.ts`
- `backend/src/services/opportunity.service.ts`
- `backend/src/repositories/opportunity.repository.ts`

#### Day 13: Project API
- [ ] Project CRUD 구현
- [ ] 프로젝트 상태 관리
- [ ] 프로젝트-기회 연결
- [ ] 프로젝트 타임라인

**구현 파일**:
- `backend/src/controllers/project.controller.ts`
- `backend/src/services/project.service.ts`
- `backend/src/repositories/project.repository.ts`

#### Day 14: 통합 테스트 및 문서화
- [ ] API 통합 테스트
- [ ] Postman Collection 생성
- [ ] API 문서 업데이트
- [ ] 에러 처리 검증

## 🏗️ 구현 아키텍처

### 1. 인증 플로우

```
Client → Login Request → Auth Controller
           ↓
    Validate Credentials
           ↓
    Generate JWT + Refresh Token
           ↓
    Store Refresh Token in Redis
           ↓
    Return Tokens to Client
```

### 2. API 요청 플로우

```
Client Request → Auth Middleware → RBAC Middleware → Controller
                      ↓                  ↓              ↓
               Verify JWT Token    Check Permissions  Service
                                                         ↓
                                                    Repository
                                                         ↓
                                                      Database
```

### 3. 디렉토리 구조

```
backend/src/
├── controllers/       # HTTP 요청 처리
├── services/         # 비즈니스 로직
├── repositories/     # 데이터 액세스
├── middleware/       # 인증, RBAC, 에러 처리
├── validators/       # 입력 검증
├── utils/           # 유틸리티 함수
└── types/           # TypeScript 타입 정의
```

## 🔧 기술 구현 상세

### JWT 구현
```typescript
// Access Token: 15분
// Refresh Token: 7일
// Token Rotation: Refresh 시 새로운 Refresh Token 발급
```

### RBAC 구현
```typescript
// 역할
enum Role {
  ADMIN = 'ADMIN',        // 전체 권한
  MANAGER = 'MANAGER',    // 관리 권한
  USER = 'USER'          // 기본 권한
}

// 권한
enum Permission {
  CREATE_COMPANY = 'create:company',
  READ_COMPANY = 'read:company',
  UPDATE_COMPANY = 'update:company',
  DELETE_COMPANY = 'delete:company',
  // ... 기타 권한
}
```

### Repository 패턴
```typescript
// 데이터베이스 접근 로직 분리
class CompanyRepository {
  findAll(filters, pagination)
  findById(id)
  create(data)
  update(id, data)
  delete(id)
}
```

## 📊 성공 지표

### Week 1 완료 기준
- [ ] 회원가입/로그인 성공
- [ ] JWT 토큰 발급 및 검증
- [ ] Refresh Token 동작
- [ ] 역할별 접근 제어

### Week 2 완료 기준
- [ ] 5개 모듈 CRUD 완성
- [ ] API 응답 표준화
- [ ] 에러 처리 완성
- [ ] 기본 테스트 통과

## 🚨 리스크 및 대응

| 리스크 | 대응 방안 |
|--------|----------|
| JWT 보안 취약점 | HTTPS 필수, Token 만료 시간 단축 |
| Redis 연결 실패 | In-memory 캐시 fallback |
| 성능 이슈 | 데이터베이스 인덱싱, 쿼리 최적화 |
| 타입 불일치 | Strict TypeScript 설정 |

## 📝 체크리스트

### 개발 전 준비
- [x] 프로젝트 구조 확인
- [x] 필요 패키지 설치 확인
- [ ] 환경변수 설정
- [ ] 데이터베이스 연결 테스트

### 개발 중 확인
- [ ] 코드 스타일 가이드 준수
- [ ] TypeScript 타입 정의
- [ ] 에러 처리
- [ ] 로깅 구현

### 개발 후 검증
- [ ] 단위 테스트 작성
- [ ] API 문서 업데이트
- [ ] 코드 리뷰
- [ ] 성능 테스트

## 🔗 참고 자료

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

**작성일**: 2025-01-13  
**작성자**: Development Team  
**다음 업데이트**: 2025-01-20 (Week 1 완료 후)