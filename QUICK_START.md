# 🚀 CRM AUGU 빠른 시작 가이드

> 💡 **5분 안에 서버 실행하기!**

## 📌 체크리스트

시작하기 전에 확인:
- [ ] Docker Desktop 실행 중
- [ ] Node.js 18+ 설치됨
- [ ] Git 설치됨
- [ ] VS Code 설치됨 (선택)

## 🎯 3단계로 서버 실행하기

### 1️⃣ 터미널 열기
```bash
# Windows: Win + R → cmd 또는 powershell
# Mac: Cmd + Space → Terminal
```

### 2️⃣ 프로젝트 폴더로 이동
```bash
cd D:\claude\crm-augu
```

### 3️⃣ 서버 시작
```bash
make dev
```

**끝! 🎉**

서버가 실행되면:
- Backend API: http://localhost:8080
- Prisma Studio: http://localhost:5555
- Frontend: http://localhost:5173 (설정된 경우)

---

## 🔥 서버 실행 상태 확인

### ✅ 정상 실행 시 보이는 메시지:
```
✅ Database connected successfully
🔌 Socket.io initialized
⏰ Cron jobs started
🚀 Server is running on port 8080
```

### ❌ 문제가 있다면?

#### 포트 충돌
```bash
# 8080 포트 사용 중인 프로세스 종료
# Windows
netstat -ano | findstr :8080
taskkill /PID [번호] /F

# Mac/Linux
lsof -i :8080
kill -9 [번호]
```

#### Docker 문제
```bash
# Docker 재시작
docker-compose down
docker-compose up -d
```

---

## 🛠️ 자주 사용하는 명령어

| 작업 | 명령어 |
|------|--------|
| 서버 시작 | `make dev` |
| 서버 중지 | `Ctrl + C` |
| 데이터베이스 GUI | `make db-studio` |
| 코드 체크 | `make check` |
| 테스트 실행 | `make test` |
| 로그 보기 | `docker logs -f crm-augu-postgres` |

---

## 📱 API 테스트하기

### 1. Health Check
```bash
curl http://localhost:8080/api/health
```

### 2. 로그인
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-augu.com","password":"Admin123!@#"}'
```

### 3. Postman 사용 (추천)
1. [Postman 다운로드](https://www.postman.com/downloads/)
2. Import → `docs/postman/CRM_AUGU_API.json`
3. 테스트 시작!

---

## 💻 VS Code 설정 (추천)

### 1. 프로젝트 열기
```bash
code D:\claude\crm-augu
```

### 2. 추천 확장 프로그램 설치
- Prisma
- ESLint
- Prettier
- Thunder Client (API 테스트)

### 3. 터미널 분할 사용
- `Ctrl + Shift + 5`: 터미널 분할
- 왼쪽: Backend 서버
- 오른쪽: 명령어 실행

---

## 📝 개발 시작하기

### 새 기능 추가 워크플로우

1. **브랜치 생성**
```bash
git checkout -b feature/my-feature
```

2. **코드 작성**
```bash
# 예: 새 서비스 생성
touch backend/src/services/my-service.ts
```

3. **테스트**
```bash
npm test
```

4. **커밋**
```bash
git add .
git commit -m "feat: add my feature"
```

5. **푸시**
```bash
git push origin feature/my-feature
```

---

## 🆘 도움말

### 문제 해결 순서
1. 에러 메시지 읽기
2. `make clean && make dev` 재시작
3. `docs/DEVELOPER_GUIDE.md` 확인
4. Google/ChatGPT에 에러 검색

### 유용한 리소스
- [프로젝트 문서](./docs/)
- [API 문서](./docs/API_DOCUMENTATION.md)
- [개발 현황](./docs/DEVELOPMENT_STATUS.md)
- [개발자 가이드](./docs/DEVELOPER_GUIDE.md)

---

## 🎮 단축키 모음

### VS Code
- `Ctrl + P`: 파일 빠른 열기
- `Ctrl + Shift + F`: 전체 검색
- `Ctrl + ` `: 터미널 토글
- `F5`: 디버깅 시작

### Terminal
- `Ctrl + C`: 프로세스 중지
- `↑`: 이전 명령어
- `Tab`: 자동 완성
- `Ctrl + L`: 화면 정리

---

**🏃‍♂️ 바로 시작하세요!**

```bash
cd D:\claude\crm-augu && make dev
```

**Happy Coding! 🚀**