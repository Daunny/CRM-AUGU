# API 문서 - [모듈명]

## 📌 개요

**모듈명**: [모듈 이름]  
**버전**: v1.0  
**기본 경로**: `/api/v1/[module]`  
**인증 필요**: Yes/No  

### 모듈 설명
[이 모듈의 목적과 기능에 대한 간단한 설명]

## 🔐 인증

이 모듈의 API를 사용하기 위해서는 다음과 같은 인증이 필요합니다:

```http
Authorization: Bearer {access_token}
```

### 필요 권한
- `[permission:read]` - 읽기 권한
- `[permission:write]` - 쓰기 권한
- `[permission:delete]` - 삭제 권한

## 📊 데이터 모델

### [Entity Name]

```typescript
interface [EntityName] {
  id: string;                    // UUID
  field1: string;                // 필드 설명
  field2: number;                // 필드 설명
  field3?: boolean;              // 선택적 필드
  createdAt: string;             // ISO 8601 format
  updatedAt: string;             // ISO 8601 format
}
```

### Enum 정의

```typescript
enum [EnumName] {
  VALUE1 = 'value1',
  VALUE2 = 'value2',
  VALUE3 = 'value3'
}
```

## 🚀 API 엔드포인트

### 1. [기능명] - [메소드] [경로]

**목적**: [이 엔드포인트의 목적 설명]

#### Request

```http
[METHOD] /api/v1/[module]/[path]
Content-Type: application/json
Authorization: Bearer {access_token}
```

##### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | Yes | 리소스 ID |

##### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | number | No | 1 | 페이지 번호 |
| `limit` | number | No | 20 | 페이지당 항목 수 |
| `sort` | string | No | 'createdAt' | 정렬 기준 |
| `order` | string | No | 'desc' | 정렬 순서 (asc/desc) |

##### Request Body

```json
{
  "field1": "value1",
  "field2": 123,
  "field3": true
}
```

##### Request Body Schema

| 필드 | 타입 | 필수 | 설명 | 검증 규칙 |
|-----|------|------|------|----------|
| `field1` | string | Yes | 필드 설명 | Min: 1, Max: 100 |
| `field2` | number | Yes | 필드 설명 | Min: 0, Max: 1000 |
| `field3` | boolean | No | 필드 설명 | - |

#### Response

##### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "field1": "value1",
    "field2": 123,
    "field3": true,
    "createdAt": "2025-01-13T10:00:00Z",
    "updatedAt": "2025-01-13T10:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-13T10:00:00Z",
    "version": "1.0"
  }
}
```

##### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "field1",
        "message": "field1 is required"
      }
    ]
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

#### 예제

##### cURL
```bash
curl -X POST https://api.example.com/api/v1/[module]/[path] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "field1": "value1",
    "field2": 123
  }'
```

##### JavaScript (Fetch)
```javascript
const response = await fetch('https://api.example.com/api/v1/[module]/[path]', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    field1: 'value1',
    field2: 123
  })
});

const data = await response.json();
```

##### TypeScript (Axios)
```typescript
import axios from 'axios';

interface RequestData {
  field1: string;
  field2: number;
}

interface ResponseData {
  id: string;
  field1: string;
  field2: number;
  createdAt: string;
  updatedAt: string;
}

const { data } = await axios.post<ResponseData>(
  'https://api.example.com/api/v1/[module]/[path]',
  {
    field1: 'value1',
    field2: 123
  } as RequestData,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

### 2. 목록 조회 - GET /api/v1/[module]

[다음 엔드포인트 문서...]

## 🔄 Pagination

목록 조회 API는 다음과 같은 페이지네이션을 지원합니다:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Filtering & Sorting

### 필터링 옵션

| 필터 | 설명 | 예제 |
|------|------|------|
| `status` | 상태별 필터링 | `?status=active` |
| `dateFrom` | 시작 날짜 | `?dateFrom=2025-01-01` |
| `dateTo` | 종료 날짜 | `?dateTo=2025-01-31` |

### 정렬 옵션

| 필드 | 설명 |
|------|------|
| `createdAt` | 생성일 기준 |
| `updatedAt` | 수정일 기준 |
| `name` | 이름 기준 |

## ⚠️ Rate Limiting

- **Rate Limit**: 1000 requests per hour
- **Rate Limit Window**: 1 hour (rolling)
- **Headers**:
  - `X-RateLimit-Limit`: 1000
  - `X-RateLimit-Remaining`: 999
  - `X-RateLimit-Reset`: 1642000000

## 🔧 Error Codes

| 코드 | 설명 | HTTP Status |
|------|------|-------------|
| `VALIDATION_ERROR` | 입력 값 검증 실패 | 400 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `FORBIDDEN` | 권한 부족 | 403 |
| `NOT_FOUND` | 리소스 없음 | 404 |
| `CONFLICT` | 리소스 충돌 | 409 |
| `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 | 429 |
| `INTERNAL_ERROR` | 서버 내부 오류 | 500 |

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2025-01-13 | 초기 버전 | [이름] |

## 🔗 관련 문서

- [인증 가이드](../authentication.md)
- [에러 처리 가이드](../error-handling.md)
- [API 사용 가이드](../api-guide.md)

---

**최종 업데이트**: YYYY-MM-DD  
**문서 관리자**: [이름]