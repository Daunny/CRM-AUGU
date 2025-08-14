# 🚀 CRM AUGU 개발자 가이드 (초보자용)

> 이 문서는 CRM AUGU 프로젝트를 처음 접하는 개발자가 개발을 이어서 진행할 수 있도록 도와주는 상세 가이드입니다.

## 📋 목차
1. [개발 환경 준비](#1-개발-환경-준비)
2. [프로젝트 시작하기](#2-프로젝트-시작하기)
3. [서버 실행하기](#3-서버-실행하기)
4. [개발 작업 진행하기](#4-개발-작업-진행하기)
5. [문제 해결 가이드](#5-문제-해결-가이드)
6. [유용한 명령어 모음](#6-유용한-명령어-모음)

---

## 1. 개발 환경 준비

### 필수 프로그램 설치 확인

#### 1.1 Node.js 확인
```bash
# 터미널을 열고 다음 명령어 실행
node --version
# v18.0.0 이상이어야 함

npm --version
# 9.0.0 이상이어야 함
```

#### 1.2 Git 확인
```bash
git --version
# git version 2.x.x 이상
```

#### 1.3 Docker Desktop 확인
```bash
docker --version
# Docker version 20.x.x 이상

docker-compose --version
# docker-compose version 2.x.x 이상
```

#### 1.4 VS Code 설치 (권장)
- https://code.visualstudio.com/ 에서 다운로드
- 추천 확장 프로그램:
  - ESLint
  - Prettier
  - Prisma
  - TypeScript and JavaScript Language Features

### 필수 프로그램이 없다면?

#### Node.js 설치
1. https://nodejs.org/ 접속
2. LTS 버전 다운로드 및 설치
3. 설치 완료 후 터미널 재시작

#### Git 설치
1. https://git-scm.com/ 접속
2. 운영체제에 맞는 버전 다운로드 및 설치

#### Docker Desktop 설치
1. https://www.docker.com/products/docker-desktop/ 접속
2. 운영체제에 맞는 버전 다운로드 및 설치
3. Docker Desktop 실행 (백그라운드에서 계속 실행되어야 함)

---

## 2. 프로젝트 시작하기

### Step 1: 프로젝트 폴더로 이동
```bash
# Windows 명령 프롬프트 또는 PowerShell
cd D:\claude\crm-augu

# Mac/Linux 터미널
cd ~/projects/crm-augu  # 실제 경로로 변경
```

### Step 2: 최신 코드 받기
```bash
# 현재 브랜치 확인
git branch
# * feature/test-coverage 라고 표시되어야 함

# 최신 코드 받기
git pull origin feature/test-coverage
```

### Step 3: 패키지 설치 확인
```bash
# Backend 패키지 설치
cd backend
npm install

# Frontend 패키지 설치 (필요한 경우)
cd ../frontend
npm install

# 다시 프로젝트 루트로 이동
cd ..
```

---

## 3. 서버 실행하기

### 🎯 가장 간단한 방법 (Makefile 사용)

```bash
# 프로젝트 루트(D:\claude\crm-augu)에서 실행
make dev
```

이 명령어 하나로:
- ✅ Docker 컨테이너 시작 (PostgreSQL, Redis)
- ✅ 데이터베이스 마이그레이션
- ✅ Backend 서버 시작
- ✅ Frontend 서버 시작 (설정된 경우)

### 📝 단계별 수동 실행 방법

#### Step 1: Docker 서비스 시작
```bash
# Docker Desktop이 실행 중인지 확인
# Windows는 시스템 트레이, Mac은 상단 메뉴바에서 확인

# Docker 컨테이너 시작
docker-compose up -d

# 실행 확인
docker ps
# postgresql과 redis 컨테이너가 보여야 함
```

#### Step 2: 데이터베이스 설정
```bash
cd backend

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
# 브라우저에서 http://localhost:5555 자동 열림
```

#### Step 3: Backend 서버 시작
```bash
# backend 폴더에서
npm run dev

# 성공 메시지 확인:
# ✅ Database connected successfully
# 🔌 Socket.io initialized
# 🚀 Server is running on port 8080
```

#### Step 4: API 테스트
```bash
# 새 터미널 창에서
curl http://localhost:8080/api/health

# 응답:
# {"status":"ok","timestamp":"2025-01-14T..."}
```

---

## 4. 개발 작업 진행하기

### 📂 프로젝트 구조 이해하기

```
crm-augu/
├── backend/                 # 백엔드 서버
│   ├── src/
│   │   ├── controllers/    # API 엔드포인트 처리
│   │   ├── services/       # 비즈니스 로직
│   │   ├── routes/         # URL 라우팅
│   │   ├── middleware/     # 미들웨어 (인증 등)
│   │   ├── config/         # 설정 파일
│   │   ├── types/          # TypeScript 타입
│   │   └── utils/          # 유틸리티 함수
│   ├── prisma/
│   │   └── schema.prisma   # 데이터베이스 스키마
│   └── package.json
├── frontend/               # 프론트엔드 (React)
├── docs/                   # 문서
└── docker-compose.yml      # Docker 설정
```

### 🔧 일반적인 개발 작업

#### 1. 새로운 API 엔드포인트 추가하기

**예시: 새로운 통계 API 추가**

1. **Service 파일 생성/수정**
```typescript
// backend/src/services/statistics.service.ts
export class StatisticsService {
  async getUserStats(userId: string) {
    // 비즈니스 로직 구현
    return { totalTasks: 10, completed: 5 };
  }
}
```

2. **Controller 파일 생성/수정**
```typescript
// backend/src/controllers/statistics.controller.ts
export const getUserStats = async (req: Request, res: Response) => {
  const stats = await statisticsService.getUserStats(req.user.id);
  res.json({ success: true, data: stats });
};
```

3. **Route 파일 생성/수정**
```typescript
// backend/src/routes/statistics.routes.ts
router.get('/user-stats', authenticate, getUserStats);
```

#### 2. 데이터베이스 스키마 변경하기

1. **스키마 수정**
```prisma
// backend/prisma/schema.prisma
model User {
  // 기존 필드들...
  lastLoginAt DateTime?  // 새 필드 추가
}
```

2. **마이그레이션 실행**
```bash
cd backend
npx prisma migrate dev --name add_last_login
```

#### 3. 코드 수정 후 확인하기

```bash
# TypeScript 타입 체크
npm run typecheck

# 린트 체크
npm run lint

# 테스트 실행
npm test

# 모든 체크 한번에
make check
```

---

## 5. 문제 해결 가이드

### ❌ 자주 발생하는 문제와 해결법

#### 문제 1: "포트가 이미 사용 중입니다"
```bash
Error: listen EADDRINUSE: address already in use :::8080
```

**해결법:**
```bash
# Windows
netstat -ano | findstr :8080
# PID 확인 후
taskkill /PID [PID번호] /F

# Mac/Linux
lsof -i :8080
kill -9 [PID번호]
```

#### 문제 2: "데이터베이스 연결 실패"
```bash
Error: Can't reach database server
```

**해결법:**
```bash
# Docker 컨테이너 상태 확인
docker ps

# 컨테이너가 없다면 시작
docker-compose up -d

# 로그 확인
docker logs crm-augu-postgres
```

#### 문제 3: "TypeScript 컴파일 에러"
```bash
TSError: ⨯ Unable to compile TypeScript
```

**해결법:**
```bash
# 패키지 재설치
cd backend
rm -rf node_modules package-lock.json
npm install

# TypeScript 체크
npm run typecheck
```

#### 문제 4: "Prisma 관련 에러"
```bash
Error: @prisma/client did not initialize yet
```

**해결법:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 6. 유용한 명령어 모음

### 🚀 빠른 실행 명령어 (Makefile)

```bash
# 전체 개발 환경 시작
make dev

# 데이터베이스만 시작
make db-up

# 백엔드 서버만 시작
make backend-dev

# 코드 품질 체크
make check

# 테스트 실행
make test

# 클린업 (모든 것 정리)
make clean

# 도움말 보기
make help
```

### 📊 데이터베이스 명령어

```bash
# Prisma Studio (GUI) 실행
cd backend && npx prisma studio

# 마이그레이션 실행
cd backend && npx prisma migrate dev

# 데이터베이스 초기화
cd backend && npx prisma migrate reset

# 시드 데이터 넣기
cd backend && npm run db:seed
```

### 🔍 디버깅 명령어

```bash
# 백엔드 로그 실시간 보기
cd backend && npm run dev

# Docker 로그 보기
docker logs crm-augu-postgres -f
docker logs crm-augu-redis -f

# API 테스트 (curl)
curl http://localhost:8080/api/health
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-augu.com","password":"Admin123!@#"}'
```

### 📝 Git 명령어

```bash
# 현재 상태 확인
git status

# 변경사항 확인
git diff

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "feat: 새로운 기능 추가"

# 푸시 (처음)
git push -u origin feature/test-coverage

# 푸시 (이후)
git push
```

---

## 🎯 다음 단계 추천 작업

### Phase 4 작업 시작하기

1. **성능 최적화**
   - 데이터베이스 인덱스 추가
   - 쿼리 최적화
   - 캐싱 전략 개선

2. **보안 강화**
   - Rate limiting 구현
   - 2FA 인증 추가
   - 보안 헤더 설정

3. **프론트엔드 개발**
   - React 컴포넌트 구현
   - API 연동
   - UI/UX 개선

### 학습 자료

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Prisma**: https://www.prisma.io/docs/
- **Express.js**: https://expressjs.com/
- **Socket.io**: https://socket.io/docs/
- **Docker**: https://docs.docker.com/

---

## 💡 팁과 베스트 프랙티스

1. **항상 브랜치에서 작업하기**
   ```bash
   git checkout -b feature/새기능이름
   ```

2. **커밋 메시지 규칙 따르기**
   - feat: 새로운 기능
   - fix: 버그 수정
   - docs: 문서 수정
   - refactor: 코드 개선
   - test: 테스트 추가

3. **정기적으로 백업하기**
   ```bash
   git add .
   git commit -m "WIP: 작업 중 백업"
   ```

4. **문제가 생기면 로그 먼저 확인**
   - 터미널 출력
   - Docker 로그
   - 브라우저 개발자 도구

5. **도움 요청하기**
   - 에러 메시지 전체를 복사
   - 실행한 명령어 기록
   - 스크린샷 첨부

---

## 📞 추가 도움이 필요하다면?

1. **프로젝트 문서 확인**
   - `docs/DEVELOPMENT_STATUS.md` - 개발 현황
   - `docs/API_DOCUMENTATION.md` - API 문서
   - `CLAUDE.md` - AI 어시스턴트 가이드

2. **에러 로그 수집**
   ```bash
   # 로그 파일로 저장
   npm run dev > error.log 2>&1
   ```

3. **환경 정보 수집**
   ```bash
   npx envinfo --system --browsers --binaries --npmPackages
   ```

---

**마지막 업데이트**: 2025-01-14  
**작성자**: Claude AI Assistant  
**버전**: 1.0.0

이 가이드를 따라하면 누구나 CRM AUGU 프로젝트 개발을 이어서 진행할 수 있습니다! 🚀