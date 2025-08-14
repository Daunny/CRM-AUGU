# 프로젝트 거버넌스 (Project Governance)

> CRM AUGU 프로젝트의 일관된 개발 및 관리를 위한 통합 가이드

## 🎯 프로젝트 관리 원칙

### 1. Single Source of Truth
- 모든 정보는 한 곳에서 관리
- 중복 문서 최소화
- 명확한 문서 계층 구조

### 2. Consistency First
- 일관된 코딩 표준
- 통일된 커밋 메시지
- 표준화된 문서 템플릿

### 3. Automation
- 반복 작업 자동화
- CI/CD 파이프라인
- 자동 코드 검사

## 📁 프로젝트 구조 표준

```
crm-augu/
├── .github/                    # GitHub 설정
│   ├── workflows/             # CI/CD 워크플로우
│   ├── ISSUE_TEMPLATE/        # 이슈 템플릿
│   └── pull_request_template.md
├── .vscode/                    # VS Code 설정
│   ├── settings.json          # 프로젝트 설정
│   ├── extensions.json        # 권장 확장
│   └── launch.json           # 디버그 설정
├── backend/                    # 백엔드 애플리케이션
│   ├── src/
│   ├── tests/
│   ├── prisma/
│   └── package.json
├── frontend/                   # 프론트엔드 애플리케이션
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/                       # 프로젝트 문서
│   ├── development/           # 개발 문서
│   ├── api/                  # API 문서
│   ├── guides/               # 가이드
│   └── DEVELOPMENT_STATUS.md # 개발 현황
├── scripts/                    # 유틸리티 스크립트
│   ├── setup.sh              # 초기 설정
│   ├── deploy.sh             # 배포
│   └── test.sh               # 테스트
└── [Root Files]
    ├── PROJECT_GOVERNANCE.md   # 이 문서
    ├── README.md              # 프로젝트 소개
    ├── CLAUDE.md              # AI 가이드라인
    ├── .env.example           # 환경변수 템플릿
    ├── docker-compose.yml     # Docker 설정
    └── Makefile              # 명령어 단축키
```

## 🔧 개발 환경 표준화

### 필수 도구
```json
{
  "node": ">=20.0.0",
  "npm": ">=10.0.0",
  "typescript": "^5.0.0",
  "docker": ">=24.0.0",
  "git": ">=2.40.0"
}
```

### VS Code 설정 (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

### 환경 변수 관리
```bash
# .env.example (템플릿)
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## 📝 코드 표준

### TypeScript 설정 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint 설정 (.eslintrc.json)
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Prettier 설정 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

## 🔄 개발 워크플로우

### 브랜치 전략
```
main
├── develop
│   ├── feature/기능명
│   ├── bugfix/버그명
│   └── hotfix/긴급수정
└── release/버전
```

### 브랜치 명명 규칙
- `feature/user-authentication`
- `bugfix/login-error`
- `hotfix/security-patch`
- `release/v1.0.0`

### 커밋 메시지 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `perf`: 성능 개선
- `test`: 테스트
- `build`: 빌드 시스템
- `ci`: CI 설정
- `chore`: 기타 작업

## 📊 프로젝트 메트릭

### 코드 품질 목표
| 메트릭 | 목표 | 현재 |
|--------|------|------|
| Test Coverage | 80% | 45% |
| Code Duplication | <5% | - |
| Technical Debt | <5 days | - |
| Cyclomatic Complexity | <10 | - |
| Documentation Coverage | 100% | 70% |

### 성능 목표
| 메트릭 | 목표 | 현재 |
|--------|------|------|
| API Response Time | <200ms | - |
| Page Load Time | <2s | - |
| Database Query Time | <50ms | - |
| Memory Usage | <512MB | - |

## 🚀 CI/CD 파이프라인

### GitHub Actions (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm run security-check
```

## 📋 체크리스트

### Daily Checklist
- [ ] 코드 커밋 전 로컬 테스트
- [ ] 린트 및 타입 체크
- [ ] 커밋 메시지 규칙 준수

### PR Checklist
- [ ] 테스트 코드 작성
- [ ] 문서 업데이트
- [ ] 코드 리뷰 요청
- [ ] CI 파이프라인 통과

### Release Checklist
- [ ] 버전 번호 업데이트
- [ ] CHANGELOG 작성
- [ ] 태그 생성
- [ ] 배포 문서 업데이트

## 🛠️ 유용한 명령어

### Makefile
```makefile
# 개발 환경 설정
setup:
	docker-compose up -d
	cd backend && npm install
	cd frontend && npm install
	cd backend && npx prisma migrate dev

# 개발 서버 시작
dev:
	docker-compose up -d
	cd backend && npm run dev &
	cd frontend && npm run dev

# 테스트 실행
test:
	cd backend && npm test
	cd frontend && npm test

# 코드 품질 체크
lint:
	cd backend && npm run lint && npm run typecheck
	cd frontend && npm run lint && npm run typecheck

# 전체 빌드
build:
	cd backend && npm run build
	cd frontend && npm run build

# 클린업
clean:
	docker-compose down
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/dist
	rm -rf frontend/dist
```

## 📚 문서 관리

### 문서 계층 구조
1. **Level 1**: 프로젝트 개요 (README.md)
2. **Level 2**: 거버넌스 (PROJECT_GOVERNANCE.md)
3. **Level 3**: 개발 가이드 (CLAUDE.md, docs/)
4. **Level 4**: API/기술 문서 (docs/api/, docs/development/)

### 문서 업데이트 규칙
- 코드 변경 시 관련 문서 동시 업데이트
- 주요 결정사항은 ADR(Architecture Decision Record) 작성
- 모든 문서는 Markdown 형식 사용

## 🔒 보안 정책

### 보안 체크리스트
- [ ] 환경 변수 분리
- [ ] 민감 정보 암호화
- [ ] 입력 검증
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CSRF 토큰
- [ ] Rate Limiting
- [ ] 로깅 및 모니터링

### 의존성 관리
```bash
# 보안 취약점 검사
npm audit

# 자동 수정
npm audit fix

# 의존성 업데이트
npm update
```

## 📈 모니터링

### 로깅 전략
- **Error**: 시스템 오류
- **Warn**: 경고 사항
- **Info**: 일반 정보
- **Debug**: 디버깅 정보

### 모니터링 도구
- Application: Winston + Elasticsearch
- Infrastructure: Docker Stats
- Error Tracking: Sentry (추후)
- APM: New Relic (추후)

## 🤝 팀 협업

### 코드 리뷰 규칙
1. 모든 PR은 최소 1명 리뷰
2. 24시간 내 리뷰 응답
3. 건설적인 피드백
4. 승인 후 머지

### 커뮤니케이션
- 기술 논의: GitHub Discussions
- 버그 리포트: GitHub Issues
- 일일 스탠드업: Slack/Teams
- 주간 회고: 금요일 오후

## 📅 릴리즈 관리

### 버전 규칙 (Semantic Versioning)
```
MAJOR.MINOR.PATCH
1.0.0
│ │ └── 버그 수정
│ └──── 기능 추가 (하위 호환)
└────── Breaking Change
```

### 릴리즈 주기
- Patch: 필요 시
- Minor: 2주
- Major: 3개월

## 🎓 온보딩 가이드

### 신규 개발자 체크리스트
1. [ ] 개발 환경 설정
2. [ ] 프로젝트 문서 읽기
3. [ ] 코드 스타일 가이드 숙지
4. [ ] 로컬 환경 실행
5. [ ] 첫 PR 생성

### 학습 자료
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

*이 문서는 프로젝트의 중심 거버넌스 문서로, 모든 개발 활동의 기준이 됩니다.*
*정기적으로 검토하고 업데이트하여 프로젝트의 현재 상태를 반영합니다.*