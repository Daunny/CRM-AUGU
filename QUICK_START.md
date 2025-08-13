# 🚀 Quick Start Guide - 즉시 개발 시작하기

## 📌 오늘 당장 시작할 수 있는 작업

### 🔥 Day 1: 30분 안에 첫 API 만들기

#### Step 1: Health Check API (5분)
```typescript
// backend/src/routes/health.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
```

#### Step 2: 첫 번째 CRUD - User (25분)

```typescript
// backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import prisma from '@/config/database';

export class UserController {
  // 사용자 목록 조회
  async getUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  }

  // 사용자 생성
  async createUser(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // 비밀번호 해싱
      const hashedPassword = await hashPassword(password);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName
        }
      });
      
      res.status(201).json({
        success: true,
        data: omit(user, ['password'])
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }
}
```

### 💡 Day 2: 인증 시스템 구현 (2시간)

#### Step 1: JWT 인증 미들웨어
```typescript
// backend/src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};
```

#### Step 2: 로그인 API
```typescript
// backend/src/controllers/auth.controller.ts
export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      // 사용자 찾기
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user || !await comparePassword(password, user.password)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      // 토큰 생성
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      const refreshToken = generateRefreshToken({
        userId: user.id,
        sessionId: uuid()
      });
      
      // 세션 저장
      await prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: addDays(new Date(), 7)
        }
      });
      
      res.json({
        success: true,
        data: {
          user: omit(user, ['password']),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }
}
```

### 🎨 Day 3: 첫 번째 React 페이지 (1시간)

#### Step 1: 로그인 페이지
```tsx
// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('로그인에 실패했습니다.');
    }
  };
  
  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>CRM AUGU 로그인</h1>
        
        {error && <div className="error">{error}</div>}
        
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}
```

#### Step 2: 대시보드 레이아웃
```tsx
// frontend/src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-content">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

## 🏃 첫 주 개발 체크리스트

### Monday: 프로젝트 셋업
- [ ] Docker 컨테이너 실행 확인
- [ ] 데이터베이스 연결 테스트
- [ ] 기본 API 구조 생성
- [ ] Health check 엔드포인트

### Tuesday: 인증 시스템
- [ ] User 모델 마이그레이션
- [ ] 로그인/로그아웃 API
- [ ] JWT 토큰 생성
- [ ] 인증 미들웨어

### Wednesday: 첫 번째 CRUD
- [ ] Customer 모델 생성
- [ ] Customer CRUD API
- [ ] 입력 검증 추가
- [ ] 에러 핸들링

### Thursday: Frontend 기초
- [ ] 라우팅 설정
- [ ] 로그인 페이지
- [ ] 기본 레이아웃
- [ ] API 서비스 레이어

### Friday: 통합 & 테스트
- [ ] Frontend-Backend 연동
- [ ] 로그인 플로우 테스트
- [ ] Customer 목록 페이지
- [ ] 코드 리뷰 & 정리

## 🎯 즉시 구현 가능한 기능들

### 1️⃣ 이번 주 목표: Authentication
```bash
✅ 로그인/로그아웃
✅ JWT 토큰 관리
✅ Protected Routes
✅ 사용자 프로필
```

### 2️⃣ 다음 주 목표: Customer CRUD
```bash
✅ 고객 목록 (검색, 필터, 정렬)
✅ 고객 상세 정보
✅ 고객 등록/수정
✅ 고객 삭제 (Soft Delete)
```

### 3️⃣ 3주차 목표: Sales Pipeline
```bash
✅ 기회 관리
✅ 파이프라인 단계
✅ 칸반 보드 UI
✅ 드래그 앤 드롭
```

## 🛠️ 개발 팁 & 트릭

### Backend 개발 순서
1. **Model 먼저**: Prisma 스키마 정의
2. **Repository**: 데이터 액세스 레이어
3. **Service**: 비즈니스 로직
4. **Controller**: HTTP 요청 처리
5. **Routes**: 엔드포인트 등록
6. **Test**: 유닛 테스트 작성

### Frontend 개발 순서
1. **Mock Data**: 가짜 데이터로 UI 먼저
2. **Component**: 재사용 가능한 컴포넌트
3. **Page**: 페이지 조립
4. **Service**: API 연동
5. **State**: 상태 관리 추가
6. **Polish**: 로딩, 에러 처리

## 📝 복사해서 바로 쓰는 코드 스니펫

### API Route 템플릿
```typescript
// backend/src/routes/[resource].routes.ts
import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validator.middleware';
import { ResourceController } from '@/controllers/[resource].controller';
import { createResourceSchema } from '@/schemas/[resource].schema';

const router = Router();
const controller = new ResourceController();

router.use(authenticate); // 모든 라우트에 인증 필요

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createResourceSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
```

### React Component 템플릿
```tsx
// frontend/src/components/[Component].tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface Props {
  // props definition
}

export default function Component({ ...props }: Props) {
  const [state, setState] = useState();
  
  const { data, loading, error } = useQuery({
    queryKey: ['resource'],
    queryFn: () => apiService.getResource()
  });
  
  useEffect(() => {
    // side effects
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error occurred</div>;
  
  return (
    <div>
      {/* UI implementation */}
    </div>
  );
}
```

### Service 템플릿
```typescript
// frontend/src/services/[resource].service.ts
import { api } from './api';

export class ResourceService {
  private baseUrl = '/api/resources';
  
  async getAll(params?: any) {
    return api.get(this.baseUrl, { params });
  }
  
  async getById(id: string) {
    return api.get(`${this.baseUrl}/${id}`);
  }
  
  async create(data: any) {
    return api.post(this.baseUrl, data);
  }
  
  async update(id: string, data: any) {
    return api.put(`${this.baseUrl}/${id}`, data);
  }
  
  async delete(id: string) {
    return api.delete(`${this.baseUrl}/${id}`);
  }
}

export const resourceService = new ResourceService();
```

## 🚨 자주 발생하는 문제 해결

### CORS 에러
```typescript
// backend/src/index.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Prisma 타입 에러
```bash
npx prisma generate  # Prisma Client 재생성
```

### Docker 연결 실패
```bash
docker-compose down -v  # 볼륨 포함 초기화
docker-compose up -d    # 재시작
```

### TypeScript 경로 에러
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## ✨ 오늘의 성과 체크

End of Day 1:
- [ ] API 서버 실행 중
- [ ] Health check 작동
- [ ] 첫 번째 엔드포인트 완성

End of Week 1:
- [ ] 로그인 기능 완성
- [ ] 고객 CRUD 작동
- [ ] 기본 UI 완성
- [ ] 10개 이상 커밋

---

**"Start small, iterate fast, deliver value daily!"** 🚀