# CRM AUGU Makefile
# 프로젝트 전체 명령어 통합 관리

.PHONY: help setup dev test lint build clean status docs

# 색상 정의
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# 기본 명령어 (help)
help:
	@echo "$(GREEN)CRM AUGU - 사용 가능한 명령어$(NC)"
	@echo ""
	@echo "$(YELLOW)개발 환경:$(NC)"
	@echo "  make setup       - 초기 환경 설정"
	@echo "  make dev         - 개발 서버 시작"
	@echo "  make stop        - 모든 서비스 중지"
	@echo ""
	@echo "$(YELLOW)코드 품질:$(NC)"
	@echo "  make lint        - 코드 스타일 검사"
	@echo "  make typecheck   - TypeScript 타입 체크"
	@echo "  make test        - 테스트 실행"
	@echo "  make test-watch  - 테스트 감시 모드"
	@echo ""
	@echo "$(YELLOW)빌드:$(NC)"
	@echo "  make build       - 프로덕션 빌드"
	@echo "  make clean       - 빌드 파일 정리"
	@echo ""
	@echo "$(YELLOW)데이터베이스:$(NC)"
	@echo "  make db-migrate  - DB 마이그레이션 실행"
	@echo "  make db-seed     - 시드 데이터 생성"
	@echo "  make db-reset    - DB 초기화"
	@echo "  make db-studio   - Prisma Studio 실행"
	@echo ""
	@echo "$(YELLOW)유틸리티:$(NC)"
	@echo "  make status      - 프로젝트 상태 확인"
	@echo "  make docs        - 문서 빌드"
	@echo "  make audit       - 보안 취약점 검사"

# 초기 환경 설정
setup:
	@echo "$(GREEN)🚀 프로젝트 초기 설정 시작...$(NC)"
	@echo "$(YELLOW)Docker 서비스 시작...$(NC)"
	docker-compose up -d
	@echo "$(YELLOW)Backend 의존성 설치...$(NC)"
	cd backend && npm install
	@echo "$(YELLOW)Frontend 의존성 설치...$(NC)"
	cd frontend && npm install
	@echo "$(YELLOW)데이터베이스 마이그레이션...$(NC)"
	cd backend && npx prisma migrate dev
	@echo "$(GREEN)✅ 설정 완료!$(NC)"

# 개발 서버 시작
dev:
	@echo "$(GREEN)🔧 개발 서버 시작...$(NC)"
	docker-compose up -d
	@echo "$(YELLOW)Backend 서버 시작 (포트 8080)...$(NC)"
	cd backend && npm run dev &
	@echo "$(YELLOW)Frontend 서버 시작 (포트 5173)...$(NC)"
	cd frontend && npm run dev &
	@echo "$(GREEN)✅ 개발 서버 실행 중!$(NC)"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Prisma:   http://localhost:5555"

# 서비스 중지
stop:
	@echo "$(YELLOW)🛑 모든 서비스 중지...$(NC)"
	docker-compose down
	pkill -f "npm run dev" || true
	@echo "$(GREEN)✅ 서비스 중지 완료!$(NC)"

# 코드 스타일 검사
lint:
	@echo "$(YELLOW)🔍 코드 스타일 검사...$(NC)"
	@echo "Backend 린트..."
	cd backend && npm run lint
	@echo "Frontend 린트..."
	cd frontend && npm run lint
	@echo "$(GREEN)✅ 린트 검사 완료!$(NC)"

# TypeScript 타입 체크
typecheck:
	@echo "$(YELLOW)📝 TypeScript 타입 체크...$(NC)"
	@echo "Backend 타입 체크..."
	cd backend && npm run typecheck
	@echo "Frontend 타입 체크..."
	cd frontend && npm run typecheck
	@echo "$(GREEN)✅ 타입 체크 완료!$(NC)"

# 테스트 실행
test:
	@echo "$(YELLOW)🧪 테스트 실행...$(NC)"
	@echo "Backend 테스트..."
	cd backend && npm test
	@echo "Frontend 테스트..."
	cd frontend && npm test
	@echo "$(GREEN)✅ 테스트 완료!$(NC)"

# 테스트 감시 모드
test-watch:
	@echo "$(YELLOW)👀 테스트 감시 모드...$(NC)"
	cd backend && npm run test:watch

# 프로덕션 빌드
build:
	@echo "$(GREEN)📦 프로덕션 빌드 시작...$(NC)"
	@echo "Backend 빌드..."
	cd backend && npm run build
	@echo "Frontend 빌드..."
	cd frontend && npm run build
	@echo "$(GREEN)✅ 빌드 완료!$(NC)"

# 클린업
clean:
	@echo "$(YELLOW)🧹 프로젝트 정리...$(NC)"
	docker-compose down -v
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/logs/*
	@echo "$(GREEN)✅ 정리 완료!$(NC)"

# DB 마이그레이션
db-migrate:
	@echo "$(YELLOW)🗄️ 데이터베이스 마이그레이션...$(NC)"
	cd backend && npx prisma migrate dev
	@echo "$(GREEN)✅ 마이그레이션 완료!$(NC)"

# DB 시드
db-seed:
	@echo "$(YELLOW)🌱 시드 데이터 생성...$(NC)"
	cd backend && npx prisma db seed
	@echo "$(GREEN)✅ 시드 데이터 생성 완료!$(NC)"

# DB 초기화
db-reset:
	@echo "$(RED)⚠️  데이터베이스 초기화...$(NC)"
	cd backend && npx prisma migrate reset
	@echo "$(GREEN)✅ 데이터베이스 초기화 완료!$(NC)"

# Prisma Studio
db-studio:
	@echo "$(YELLOW)🎨 Prisma Studio 시작...$(NC)"
	cd backend && npx prisma studio

# 프로젝트 상태 확인
status:
	@echo "$(GREEN)📊 프로젝트 상태$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker 컨테이너:$(NC)"
	docker-compose ps
	@echo ""
	@echo "$(YELLOW)Node 프로세스:$(NC)"
	ps aux | grep "node" | grep -v grep || echo "실행 중인 Node 프로세스 없음"
	@echo ""
	@echo "$(YELLOW)포트 사용 현황:$(NC)"
	netstat -an | grep LISTEN | grep -E ":(8080|5173|5432|6379|5555)" || echo "포트 확인 불가"

# 문서 빌드
docs:
	@echo "$(YELLOW)📚 문서 업데이트...$(NC)"
	@echo "개발 현황 업데이트..."
	@echo "최종 업데이트: $$(date '+%Y-%m-%d')" > docs/DEVELOPMENT_STATUS.md
	@echo "$(GREEN)✅ 문서 업데이트 완료!$(NC)"

# 보안 취약점 검사
audit:
	@echo "$(YELLOW)🔒 보안 취약점 검사...$(NC)"
	@echo "Backend 보안 검사..."
	cd backend && npm audit
	@echo "Frontend 보안 검사..."
	cd frontend && npm audit
	@echo "$(GREEN)✅ 보안 검사 완료!$(NC)"

# 전체 체크 (CI/CD용)
ci: lint typecheck test
	@echo "$(GREEN)✅ CI 체크 완료!$(NC)"

# 빠른 체크
check: lint typecheck
	@echo "$(GREEN)✅ 빠른 체크 완료!$(NC)"

# 의존성 업데이트
update:
	@echo "$(YELLOW)📦 의존성 업데이트...$(NC)"
	cd backend && npm update
	cd frontend && npm update
	@echo "$(GREEN)✅ 업데이트 완료!$(NC)"

# 로그 확인
logs:
	@echo "$(YELLOW)📋 로그 확인...$(NC)"
	docker-compose logs -f

# 백엔드 로그
logs-backend:
	tail -f backend/logs/combined.log

# 에러 로그
logs-error:
	tail -f backend/logs/error.log