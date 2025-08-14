#!/bin/bash

# ============================================
# CRM AUGU - 초기 설정 스크립트
# ============================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${BLUE}"
echo "   ____ ____  __  __      _   _   _  ____ _   _ "
echo "  / ___|  _ \|  \/  |    / \ | | | |/ ___| | | |"
echo " | |   | |_) | |\/| |   / _ \| | | | |  _| | | |"
echo " | |___|  _ <| |  | |  / ___ \ |_| | |_| | |_| |"
echo "  \____|_| \_\_|  |_| /_/   \_\___/ \____|\___/ "
echo -e "${NC}"
echo "================================================="
echo "        프로젝트 초기 설정을 시작합니다"
echo "================================================="

# 1. 시스템 요구사항 체크
echo -e "\n${YELLOW}1. 시스템 요구사항 체크...${NC}"

# Node.js 버전 체크
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✓ Node.js $(node -v) 설치됨${NC}"
    else
        echo -e "${RED}✗ Node.js 20 이상이 필요합니다 (현재: $(node -v))${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Node.js가 설치되지 않았습니다${NC}"
    exit 1
fi

# Docker 체크
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 설치됨${NC}"
else
    echo -e "${RED}✗ Docker가 설치되지 않았습니다${NC}"
    exit 1
fi

# Git 체크
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git 설치됨${NC}"
else
    echo -e "${RED}✗ Git이 설치되지 않았습니다${NC}"
    exit 1
fi

# 2. 환경 변수 파일 생성
echo -e "\n${YELLOW}2. 환경 변수 설정...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env 파일 생성됨${NC}"
else
    echo -e "${BLUE}ℹ .env 파일이 이미 존재합니다${NC}"
fi

if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo -e "${GREEN}✓ backend/.env 파일 생성됨${NC}"
fi

if [ ! -f frontend/.env ]; then
    echo "VITE_API_URL=http://localhost:8080/api" > frontend/.env
    echo -e "${GREEN}✓ frontend/.env 파일 생성됨${NC}"
fi

# 3. Docker 컨테이너 시작
echo -e "\n${YELLOW}3. Docker 컨테이너 시작...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# 컨테이너 상태 확인
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Docker 컨테이너 실행 중${NC}"
else
    echo -e "${RED}✗ Docker 컨테이너 시작 실패${NC}"
    exit 1
fi

# 4. Backend 설정
echo -e "\n${YELLOW}4. Backend 설정...${NC}"
cd backend

# 의존성 설치
echo "의존성 설치 중..."
npm install --silent
echo -e "${GREEN}✓ Backend 의존성 설치 완료${NC}"

# 데이터베이스 대기
echo "데이터베이스 연결 대기 중..."
for i in {1..30}; do
    if npx prisma db push --skip-generate 2>/dev/null; then
        echo -e "${GREEN}✓ 데이터베이스 연결 성공${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ 데이터베이스 연결 실패${NC}"
        exit 1
    fi
    sleep 2
done

# Prisma 설정
echo "Prisma 마이그레이션 실행 중..."
npx prisma migrate dev --name init --skip-generate 2>/dev/null || true
npx prisma generate
echo -e "${GREEN}✓ Prisma 설정 완료${NC}"

cd ..

# 5. Frontend 설정
echo -e "\n${YELLOW}5. Frontend 설정...${NC}"
cd frontend

# 의존성 설치
echo "의존성 설치 중..."
npm install --silent
echo -e "${GREEN}✓ Frontend 의존성 설치 완료${NC}"

cd ..

# 6. VS Code 설정
echo -e "\n${YELLOW}6. VS Code 설정...${NC}"
if [ -d .vscode ]; then
    echo -e "${GREEN}✓ VS Code 설정 파일 존재${NC}"
else
    mkdir -p .vscode
    echo -e "${GREEN}✓ VS Code 설정 디렉토리 생성${NC}"
fi

# 7. Git hooks 설정 (선택적)
echo -e "\n${YELLOW}7. Git hooks 설정...${NC}"
if [ -f .git/hooks/pre-commit ]; then
    echo -e "${BLUE}ℹ Git hooks가 이미 설정되어 있습니다${NC}"
else
    # Husky 설치 여부 확인
    read -p "Git hooks (Husky)를 설정하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx husky-init && npm install
        echo -e "${GREEN}✓ Git hooks 설정 완료${NC}"
    else
        echo -e "${BLUE}ℹ Git hooks 설정 건너뜀${NC}"
    fi
fi

# 8. 초기 데이터 생성 (선택적)
echo -e "\n${YELLOW}8. 초기 데이터 생성...${NC}"
read -p "시드 데이터를 생성하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npx prisma db seed 2>/dev/null || echo -e "${YELLOW}⚠ 시드 스크립트가 아직 구현되지 않았습니다${NC}"
    cd ..
else
    echo -e "${BLUE}ℹ 시드 데이터 생성 건너뜀${NC}"
fi

# 9. 완료
echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}       ✨ 프로젝트 설정이 완료되었습니다! ✨${NC}"
echo -e "${GREEN}=================================================${NC}"
echo
echo -e "${BLUE}다음 명령어로 개발을 시작하세요:${NC}"
echo
echo -e "  ${YELLOW}make dev${NC}     - 개발 서버 시작"
echo -e "  ${YELLOW}make test${NC}    - 테스트 실행"
echo -e "  ${YELLOW}make lint${NC}    - 코드 검사"
echo -e "  ${YELLOW}make help${NC}    - 모든 명령어 보기"
echo
echo -e "${BLUE}접속 정보:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:8080${NC}"
echo -e "  Prisma:    ${GREEN}http://localhost:5555${NC}"
echo
echo -e "${YELLOW}Happy Coding! 🚀${NC}"