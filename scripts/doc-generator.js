#!/usr/bin/env node

/**
 * 문서 자동 생성 스크립트
 * 프로젝트 문서를 템플릿 기반으로 자동 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// 문서 디렉토리 경로
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const TEMPLATES_DIR = {
  codeReview: path.join(DOCS_DIR, '07-reviews', 'templates', 'code-review-template.md'),
  weeklyReport: path.join(DOCS_DIR, '07-reviews', 'templates', 'weekly-report-template.md'),
  apiDoc: path.join(DOCS_DIR, '05-api', 'templates', 'api-doc-template.md')
};

// 날짜 포맷팅 함수
function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 주차 계산 함수
function getWeekNumber(date = new Date()) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDay) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
}

// 주간 날짜 범위 계산
function getWeekRange(date = new Date()) {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const last = first + 6; // Sunday

  const monday = new Date(curr.setDate(first));
  const sunday = new Date(curr.setDate(last));

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

// 템플릿 읽기
function readTemplate(templatePath) {
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`❌ 템플릿을 읽을 수 없습니다: ${templatePath}`);
    console.error(error.message);
    process.exit(1);
  }
}

// 파일 저장
function saveFile(filePath, content) {
  try {
    // 디렉토리가 없으면 생성
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 파일이 생성되었습니다: ${filePath}`);
  } catch (error) {
    console.error(`❌ 파일 저장 실패: ${filePath}`);
    console.error(error.message);
    process.exit(1);
  }
}

// 일일 작업 로그 생성
function generateDailyLog() {
  const date = formatDate();
  const logPath = path.join(DOCS_DIR, '00-project-status.md');
  
  // 기존 파일 읽기
  let content = '';
  if (fs.existsSync(logPath)) {
    content = fs.readFileSync(logPath, 'utf8');
  }

  // 오늘 날짜의 엔트리가 이미 있는지 확인
  if (content.includes(`### ${date}`)) {
    console.log(`ℹ️  오늘(${date})의 작업 로그가 이미 존재합니다.`);
    return;
  }

  // 새로운 일일 로그 엔트리 추가
  const dailyEntry = `

### ${date}

#### 완료된 작업
- [ ] [작업 내용]

#### 진행 중인 작업
- [ ] [작업 내용]

#### 발견된 이슈
- [ ] [이슈 내용]

#### 내일 계획
- [ ] [계획 내용]

---`;

  // 적절한 위치에 삽입 (## 📈 현재 진행 상황 섹션 뒤)
  const insertPosition = content.indexOf('## 🔄 진행 중인 작업');
  if (insertPosition > -1) {
    const before = content.substring(0, insertPosition);
    const after = content.substring(insertPosition);
    content = before + dailyEntry + '\n\n' + after;
  } else {
    content += dailyEntry;
  }

  // 최종 업데이트 날짜 수정
  content = content.replace(/\*최종 업데이트: \d{4}-\d{2}-\d{2}\*/, `*최종 업데이트: ${date}*`);

  saveFile(logPath, content);
}

// 주간 리뷰 문서 생성
function generateWeeklyReview() {
  const template = readTemplate(TEMPLATES_DIR.weeklyReport);
  const date = new Date();
  const weekNumber = getWeekNumber(date);
  const weekRange = getWeekRange(date);
  
  // 템플릿 변수 치환
  let content = template
    .replace(/Week \[N\]/g, `Week ${weekNumber}`)
    .replace(/YYYY-MM-DD ~ YYYY-MM-DD/g, `${weekRange.start} ~ ${weekRange.end}`)
    .replace(/Sprint #N/g, `Sprint #${Math.ceil(weekNumber / 2)}`)
    .replace(/YYYY-MM-DD/g, formatDate())
    .replace(/\[이름\]/g, 'Developer')
    .replace(/XX%/g, '0%')
    .replace(/XX/g, '0');

  const fileName = `week-${weekNumber}-${weekRange.start}.md`;
  const filePath = path.join(DOCS_DIR, '07-reviews', 'weekly', fileName);
  
  saveFile(filePath, content);
}

// 코드 리뷰 문서 생성
function generateCodeReview(prNumber) {
  const template = readTemplate(TEMPLATES_DIR.codeReview);
  const date = formatDate();
  
  // 템플릿 변수 치환
  let content = template
    .replace(/\[YYYY-MM-DD\]/g, date)
    .replace(/YYYY-MM-DD/g, date)
    .replace(/\[pr-number\]/g, prNumber || 'XX')
    .replace(/\[issue-number\]/g, 'XX')
    .replace(/\[이름\]/g, 'Reviewer')
    .replace(/HH:MM/g, new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

  const fileName = `code-review-${date}-${prNumber || 'draft'}.md`;
  const filePath = path.join(DOCS_DIR, '07-reviews', fileName);
  
  saveFile(filePath, content);
}

// API 문서 생성
function generateApiDoc(moduleName) {
  if (!moduleName) {
    console.error('❌ 모듈 이름을 제공해주세요: npm run doc:api [module-name]');
    process.exit(1);
  }

  const template = readTemplate(TEMPLATES_DIR.apiDoc);
  const date = formatDate();
  
  // 템플릿 변수 치환
  let content = template
    .replace(/\[모듈명\]/g, moduleName)
    .replace(/\[모듈 이름\]/g, moduleName)
    .replace(/\[module\]/g, moduleName.toLowerCase())
    .replace(/\[Module\]/g, moduleName)
    .replace(/\[EntityName\]/g, moduleName)
    .replace(/\[EnumName\]/g, `${moduleName}Status`)
    .replace(/YYYY-MM-DD/g, date)
    .replace(/\[이름\]/g, 'Developer');

  const fileName = `${moduleName.toLowerCase()}-api.md`;
  const filePath = path.join(DOCS_DIR, '05-api', fileName);
  
  saveFile(filePath, content);
}

// 스프린트 리뷰 문서 생성
function generateSprintReview(sprintNumber) {
  const date = formatDate();
  const content = `# 스프린트 ${sprintNumber} 회고 - ${date}

## 📊 스프린트 요약

| 항목 | 내용 |
|------|------|
| **스프린트 번호** | Sprint ${sprintNumber} |
| **기간** | YYYY-MM-DD ~ ${date} |
| **목표 달성률** | 0% |
| **벨로시티** | 0 points |

## ✅ 완료된 스토리

### User Stories
1. **[스토리 제목]** (X points)
   - 구현 내용: 
   - 담당자: 
   - 완료일: 

## ❌ 미완료 스토리

1. **[스토리 제목]** (X points)
   - 미완료 사유: 
   - 다음 스프린트 이관 여부: 

## 🎯 스프린트 목표 달성 여부

- 목표 1: ✅/❌
- 목표 2: ✅/❌
- 목표 3: ✅/❌

## 💡 회고

### 잘한 점 (What went well)
- 
- 

### 개선할 점 (What could be improved)
- 
- 

### 시도할 점 (What will we try)
- 
- 

## 📈 메트릭스

| 지표 | 계획 | 실제 | 차이 |
|------|------|------|------|
| 스토리 포인트 | 0 | 0 | 0 |
| 완료 스토리 수 | 0 | 0 | 0 |
| 버그 수 | 0 | 0 | 0 |
| 기술 부채 해결 | 0 | 0 | 0 |

## 🚀 다음 스프린트 액션 아이템

1. [ ] [액션 아이템 1]
2. [ ] [액션 아이템 2]
3. [ ] [액션 아이템 3]

---

**작성자**: Developer  
**작성일**: ${date}
`;

  const fileName = `sprint-${sprintNumber}-review-${date}.md`;
  const filePath = path.join(DOCS_DIR, '07-reviews', 'sprint', fileName);
  
  saveFile(filePath, content);
}

// CLI 명령 처리
const command = process.argv[2];
const arg = process.argv[3];

console.log('📝 문서 생성 도구 v1.0\n');

switch (command) {
  case 'daily':
    console.log('📅 일일 작업 로그 생성 중...');
    generateDailyLog();
    break;
    
  case 'weekly':
    console.log('📊 주간 리뷰 문서 생성 중...');
    generateWeeklyReview();
    break;
    
  case 'code-review':
    console.log('🔍 코드 리뷰 문서 생성 중...');
    generateCodeReview(arg);
    break;
    
  case 'api':
    console.log('🚀 API 문서 생성 중...');
    generateApiDoc(arg);
    break;
    
  case 'sprint':
    console.log('🏃 스프린트 리뷰 문서 생성 중...');
    generateSprintReview(arg || Math.ceil(getWeekNumber() / 2));
    break;
    
  default:
    console.log(`사용법:
  node doc-generator.js daily              - 일일 작업 로그 생성
  node doc-generator.js weekly             - 주간 리뷰 문서 생성
  node doc-generator.js code-review [PR#]  - 코드 리뷰 문서 생성
  node doc-generator.js api [module]       - API 문서 생성
  node doc-generator.js sprint [number]    - 스프린트 리뷰 문서 생성
    `);
    break;
}