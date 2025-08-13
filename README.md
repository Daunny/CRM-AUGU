# CRM AUGU - Customer-Centric CRM Platform

<div align="center">
  <h3>🚀 고객 중심의 워크플로우로 HRD 비즈니스를 혁신하는 통합 CRM 플랫폼</h3>
  <p>Lead부터 Cash까지, 모든 비즈니스 프로세스를 하나의 플랫폼에서 관리하세요</p>
</div>

## 📌 프로젝트 소개

**CRM AUGU**는 HRD(Human Resource Development) 비즈니스에 특화된 통합 CRM 솔루션입니다. 
고객 관리부터 영업, 프로젝트 실행, 정산까지 전체 업무 프로세스를 효율적으로 관리할 수 있습니다.
### ✨ 주요 기능

- **🎯 고객 관리**: 고객 정보 통합 관리, 360도 고객 뷰, 고객 세그먼테이션
- **💼 영업 파이프라인**: 리드 추적, 기회 관리, 영업 활동 기록, 전환율 분석
- **📊 프로젝트 관리**: 프로젝트 계획 및 실행, 리소스 할당, 진행률 추적
- **✅ 태스크 관리**: 업무 할당 및 추적, 우선순위 관리, 마감일 알림
- **📈 대시보드**: 실시간 KPI 모니터링, 커스텀 리포트, 데이터 시각화
- **🔔 실시간 알림**: 중요 이벤트 알림, 활동 리마인더, 팀 협업

## 🚀 시작하기

### 필수 요구사항

- Node.js 20.0 이상
- Docker Desktop
- Git

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone https://github.com/your-username/crm-augu.git
cd crm-augu
```

#### 2. Docker를 사용한 전체 스택 실행 (권장)

```bash
# 모든 서비스 시작 (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

#### 3. 로컬 개발 환경 (선택)

**Backend 실행:**

```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값 설정

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

**Frontend 실행:**

```bash
cd frontend
npm install

# 개발 서버 실행
npm run dev
```

### 접속 정보

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **API Health Check**: http://localhost:8080/api/health
- **PostgreSQL**: localhost:5432 (username: postgres, password: postgres)
- **Redis**: localhost:6379
- **Prisma Studio**: `npx prisma studio` 실행 후 http://localhost:5555
## 🛠️ 기술 스택

### Backend
- **Node.js** + **TypeScript** - 서버 런타임 및 타입 안정성
- **Express.js** - 웹 프레임워크
- **PostgreSQL** - 메인 데이터베이스
- **Prisma** - ORM
- **Redis** - 캐싱 및 세션 관리
- **JWT** - 인증/인가

### Frontend
- **React 18** + **TypeScript** - UI 프레임워크
- **Vite** - 빌드 도구
- **Material-UI** - UI 컴포넌트 라이브러리
- **Redux Toolkit** - 상태 관리
- **React Query** - 서버 상태 관리
- **React Hook Form** - 폼 관리

### DevOps
- **Docker** & **Docker Compose** - 컨테이너화
- **GitHub Actions** - CI/CD (추후 구현)
- **Socket.io** - 실시간 통신
## 📁 프로젝트 구조

```
crm-augu/
├── backend/                 # Backend 서버
│   ├── src/
│   │   ├── config/         # 설정 파일
│   │   ├── controllers/    # 컨트롤러
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middleware/     # 미들웨어
│   │   ├── routes/         # API 라우트
│   │   ├── types/          # TypeScript 타입
│   │   └── utils/          # 유틸리티
│   ├── prisma/             # Prisma 스키마 및 마이그레이션
│   └── tests/              # 테스트
├── frontend/               # Frontend 애플리케이션
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── store/          # Redux 스토어
│   │   └── utils/          # 유틸리티
│   └── tests/              # 테스트
├── docker-compose.yml      # Docker Compose 설정
├── DEVELOPMENT_PLAN.md     # 개발 계획서
├── CLAUDE.md              # AI 어시스턴트 가이드
└── README.md              # 프로젝트 문서
```
## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test
npm run test:watch    # Watch 모드
npm run test:coverage  # 커버리지 리포트

# Frontend 테스트
cd frontend
npm test
npm run test:watch
npm run test:coverage
```
## 📝 개발 가이드

### 코드 스타일

프로젝트는 ESLint와 Prettier를 사용하여 일관된 코드 스타일을 유지합니다.

```bash
# Lint 검사
npm run lint

# Prettier 포맷팅
npm run format

# TypeScript 타입 체크
npm run typecheck
```

### 커밋 메시지 규칙

```
<type>(<scope>): <subject>

예시:
feat(customer): add customer search functionality
fix(auth): resolve token expiration issue
docs(readme): update installation guide
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등

### 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치
## 🔧 주요 명령어

### Database 관리

```bash
cd backend

# 마이그레이션 생성
npx prisma migrate dev --name <migration-name>

# 마이그레이션 적용
npx prisma migrate deploy

# Prisma Studio (DB GUI)
npx prisma studio

# Prisma Client 재생성
npx prisma generate

# 데이터베이스 초기화
npx prisma migrate reset
```

### Docker 명령어

```bash
# 특정 서비스만 재시작
docker-compose restart backend
docker-compose restart frontend

# 컨테이너 로그 확인
docker-compose logs backend
docker-compose logs postgres

# 컨테이너 쉘 접속
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres

# 볼륨 포함 전체 초기화
docker-compose down -v
```
## 🔐 보안

- **인증**: JWT 기반 Access/Refresh Token
- **인가**: 역할 기반 접근 제어 (RBAC)
- **암호화**: bcrypt 비밀번호 해싱
- **입력 검증**: Joi 스키마 검증
- **SQL Injection 방지**: Prisma ORM 사용
- **XSS 방지**: React 기본 보호 + Helmet.js

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

문제가 발생하거나 질문이 있으시면:

1. [Issues](https://github.com/your-username/crm-augu/issues) 페이지를 확인하세요
2. 새로운 이슈를 생성하세요
3. [Discussions](https://github.com/your-username/crm-augu/discussions)에서 토론하세요

## 🙏 감사의 글

이 프로젝트는 다음과 같은 오픈소스 프로젝트들의 도움을 받았습니다:

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma](https://www.prisma.io/)
- [Material-UI](https://mui.com/)
- [Docker](https://www.docker.com/)

---

<div align="center">
  <p>Made with ❤️ by CRM AUGU Team</p>
  <p>© 2025 CRM AUGU. All rights reserved.</p>
</div>