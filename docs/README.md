# CRM AUGU 문서 센터

## 📚 문서 구조

CRM AUGU 프로젝트의 모든 문서는 체계적으로 정리되어 있습니다.

### 📁 디렉토리 구조

```
docs/
├── 00-project-status.md          # 프로젝트 현황 보고서
├── 01-overview/                  # 프로젝트 개요
│   ├── 01-functional-requirements.md  # 기능 요구사항
│   └── 02-roadmap.md                  # 로드맵
├── 02-planning/                  # 계획 문서
│   ├── 01-development-plan.md        # 개발 계획
│   ├── 02-sprint-plan.md             # 스프린트 계획
│   ├── 03-phase2-plan.md             # Phase 2 계획
│   └── 04-phase3-plan.md             # Phase 3 계획
├── 03-architecture/              # 아키텍처 문서
│   ├── 01-database-schema.md         # 데이터베이스 스키마
│   ├── 02-module-specifications.md   # 모듈 명세
│   └── 03-ia-ux-design.md           # IA/UX 디자인
├── 04-development/               # 개발 가이드
│   └── 01-quick-start.md            # 빠른 시작 가이드
├── 05-api/                       # API 문서
│   └── 01-api-specification.md      # API 명세서
└── 06-deployment/                # 배포 문서
    └── (추후 작성 예정)
```

## 🎯 문서별 용도

### 00. 프로젝트 현황
- **[프로젝트 현황 보고서](./00-project-status.md)**: 현재 개발 진행 상황, 완료된 작업, 향후 계획

### 01. 프로젝트 개요
- **[기능 요구사항](./01-overview/01-functional-requirements.md)**: 시스템의 전체 기능 요구사항 정의
- **[로드맵](./01-overview/02-roadmap.md)**: 프로젝트 전체 로드맵 및 마일스톤

### 02. 계획 문서
- **[개발 계획](./02-planning/01-development-plan.md)**: 전체 개발 계획 및 전략
- **[스프린트 계획](./02-planning/02-sprint-plan.md)**: 스프린트별 상세 계획
- **[Phase 2 계획](./02-planning/03-phase2-plan.md)**: Phase 2 개발 상세 계획
- **[Phase 3 계획](./02-planning/04-phase3-plan.md)**: Phase 3 실행 계획

### 03. 아키텍처
- **[데이터베이스 스키마](./03-architecture/01-database-schema.md)**: 전체 DB 구조 및 관계
- **[모듈 명세](./03-architecture/02-module-specifications.md)**: 각 모듈별 상세 명세
- **[IA/UX 디자인](./03-architecture/03-ia-ux-design.md)**: 정보 구조 및 UX 디자인

### 04. 개발 가이드
- **[빠른 시작 가이드](./04-development/01-quick-start.md)**: 개발 환경 설정 및 실행 방법

### 05. API 문서
- **[API 명세서](./05-api/01-api-specification.md)**: RESTful API 상세 명세

### 06. 배포 문서
- 추후 작성 예정

## 🔍 빠른 링크

### 개발자를 위한 문서
1. [빠른 시작 가이드](./04-development/01-quick-start.md) - 개발 환경 설정
2. [API 명세서](./05-api/01-api-specification.md) - API 엔드포인트 정보
3. [데이터베이스 스키마](./03-architecture/01-database-schema.md) - DB 구조

### 기획자를 위한 문서
1. [기능 요구사항](./01-overview/01-functional-requirements.md) - 기능 정의
2. [IA/UX 디자인](./03-architecture/03-ia-ux-design.md) - 화면 구조
3. [로드맵](./01-overview/02-roadmap.md) - 일정 계획

### 관리자를 위한 문서
1. [프로젝트 현황](./00-project-status.md) - 진행 상황
2. [개발 계획](./02-planning/01-development-plan.md) - 전체 계획
3. [스프린트 계획](./02-planning/02-sprint-plan.md) - 단기 계획

## 📝 문서 작성 규칙

### 파일명 규칙
- 번호-이름.md 형식 사용 (예: 01-functional-requirements.md)
- 모두 소문자, 단어 구분은 하이픈(-) 사용
- 카테고리별로 폴더 분류

### 문서 구조
1. 제목 (H1)
2. 개요 설명
3. 목차 (긴 문서의 경우)
4. 본문 내용
5. 참고 자료 (필요시)

### 업데이트 규칙
- 문서 하단에 최종 업데이트 날짜 명시
- 중요한 변경사항은 변경 이력 섹션 추가
- 관련 이슈나 PR 번호 참조

## 🔄 문서 업데이트 주기

| 문서 종류 | 업데이트 주기 | 담당 |
|----------|--------------|------|
| 프로젝트 현황 | 주 1회 | PM |
| API 명세서 | 변경 시 즉시 | Backend Dev |
| 스프린트 계획 | 스프린트 시작 시 | PM |
| 아키텍처 문서 | 변경 시 즉시 | Tech Lead |

## 📮 문의

문서 관련 문의사항이나 개선 제안은 다음으로 연락주세요:
- 프로젝트 이슈 트래커
- 팀 슬랙 채널: #crm-augu-docs

---

*최종 업데이트: 2025-01-13*