import { PrismaClient, UserRole, UserTier, CompanySize, CustomerTier, CustomerStatus, BranchType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data - simplified
  try {
    await prisma.contact.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();
    await prisma.department.deleteMany();
    await prisma.industry.deleteMany();
  } catch (error) {
    console.log('Some tables may not exist yet, continuing...');
  }

  console.log('✨ Cleaned existing data');

  // Create Industries
  const industries = await Promise.all([
    prisma.industry.create({
      data: {
        code: 'TECH',
        name: '정보기술',
        description: 'IT 및 소프트웨어 개발',
      },
    }),
    prisma.industry.create({
      data: {
        code: 'MFG',
        name: '제조업',
        description: '제조 및 생산업',
      },
    }),
    prisma.industry.create({
      data: {
        code: 'FIN',
        name: '금융',
        description: '금융 및 보험업',
      },
    }),
    prisma.industry.create({
      data: {
        code: 'EDU',
        name: '교육',
        description: '교육 서비스업',
      },
    }),
  ]);

  console.log(`✅ Created ${industries.length} industries`);

  // Create Departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        code: 'SALES',
        name: '영업부',
        description: '영업 및 사업개발',
      },
    }),
    prisma.department.create({
      data: {
        code: 'MGMT',
        name: '경영지원부',
        description: '경영지원 및 관리',
      },
    }),
    prisma.department.create({
      data: {
        code: 'DEV',
        name: '개발부',
        description: '소프트웨어 개발',
      },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Create Teams
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        code: 'SALES-1',
        name: '영업 1팀',
        description: '수도권 영업',
        departmentId: departments[0].id,
      },
    }),
    prisma.team.create({
      data: {
        code: 'SALES-2',
        name: '영업 2팀',
        description: '지방 영업',
        departmentId: departments[0].id,
      },
    }),
    prisma.team.create({
      data: {
        code: 'DEV-1',
        name: '개발 1팀',
        description: '백엔드 개발',
        departmentId: departments[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${teams.length} teams`);

  // Create Users
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@crmaugu.com',
        password: hashedPassword,
        firstName: '관리자',
        lastName: '시스템',
        phone: '010-1111-1111',
        userTier: UserTier.EXECUTIVE,
        role: UserRole.ADMIN,
        departmentId: departments[1].id,
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
    }),
    // Sales Manager
    prisma.user.create({
      data: {
        email: 'sales.manager@crmaugu.com',
        password: hashedPassword,
        firstName: '영업',
        lastName: '팀장',
        phone: '010-2222-2222',
        userTier: UserTier.MANAGER,
        role: UserRole.MANAGER,
        departmentId: departments[0].id,
        teamId: teams[0].id,
        position: '팀장',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
    }),
    // Sales Staff
    prisma.user.create({
      data: {
        email: 'sales1@crmaugu.com',
        password: hashedPassword,
        firstName: '김',
        lastName: '영업',
        phone: '010-3333-3333',
        userTier: UserTier.OPERATOR,
        role: UserRole.OPERATOR,
        departmentId: departments[0].id,
        teamId: teams[0].id,
        position: '대리',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
    }),
    // Developer
    prisma.user.create({
      data: {
        email: 'dev1@crmaugu.com',
        password: hashedPassword,
        firstName: '이',
        lastName: '개발',
        phone: '010-4444-4444',
        userTier: UserTier.OPERATOR,
        role: UserRole.OPERATOR,
        departmentId: departments[2].id,
        teamId: teams[2].id,
        position: '과장',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        code: 'COMP001',
        name: '삼성전자',
        businessNumber: '124-81-00998',
        representative: '한종희',
        industryId: industries[0].id,
        companySize: CompanySize.ENTERPRISE,
        annualRevenue: 302231000000000,
        employeeCount: 267937,
        website: 'https://www.samsung.com',
        description: '글로벌 전자제품 제조업체',
        tier: CustomerTier.VIP,
        status: CustomerStatus.ACTIVE,
        accountManagerId: users[1].id,
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    prisma.company.create({
      data: {
        code: 'COMP002',
        name: 'LG전자',
        businessNumber: '107-86-14075',
        representative: '조주완',
        industryId: industries[0].id,
        companySize: CompanySize.ENTERPRISE,
        annualRevenue: 84225000000000,
        employeeCount: 74000,
        website: 'https://www.lge.co.kr',
        description: '생활가전 및 전자제품 제조업체',
        tier: CustomerTier.GOLD,
        status: CustomerStatus.ACTIVE,
        accountManagerId: users[1].id,
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    prisma.company.create({
      data: {
        code: 'COMP003',
        name: '네이버',
        businessNumber: '220-81-62517',
        representative: '최수연',
        industryId: industries[0].id,
        companySize: CompanySize.ENTERPRISE,
        annualRevenue: 9671000000000,
        employeeCount: 4936,
        website: 'https://www.navercorp.com',
        description: '대한민국 대표 인터넷 포털',
        tier: CustomerTier.GOLD,
        status: CustomerStatus.ACTIVE,
        accountManagerId: users[2].id,
        createdBy: users[2].id,
        updatedBy: users[2].id,
      },
    }),
    prisma.company.create({
      data: {
        code: 'COMP004',
        name: '카카오',
        businessNumber: '120-81-47521',
        representative: '홍은택',
        industryId: industries[0].id,
        companySize: CompanySize.ENTERPRISE,
        annualRevenue: 7982000000000,
        employeeCount: 11082,
        website: 'https://www.kakaocorp.com',
        description: '모바일 플랫폼 및 인터넷 서비스',
        tier: CustomerTier.SILVER,
        status: CustomerStatus.ACTIVE,
        accountManagerId: users[2].id,
        createdBy: users[2].id,
        updatedBy: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Create Branches
  const branches = await Promise.all([
    // Samsung branches
    prisma.branch.create({
      data: {
        code: 'BR001',
        name: '삼성전자 서울사무소',
        companyId: companies[0].id,
        branchType: BranchType.HEADQUARTERS,
        addressStreet: '서초구 서초대로74길 11',
        addressCity: '서울특별시',
        addressState: '서울',
        addressPostal: '06620',
        phone: '02-2055-0000',
        email: 'seoul@samsung.com',
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    prisma.branch.create({
      data: {
        code: 'BR002',
        name: '삼성전자 수원사업장',
        companyId: companies[0].id,
        branchType: BranchType.FACTORY,
        addressStreet: '영통구 삼성로 129',
        addressCity: '수원시',
        addressState: '경기도',
        addressPostal: '16677',
        phone: '031-200-1114',
        email: 'suwon@samsung.com',
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    // LG branches
    prisma.branch.create({
      data: {
        code: 'BR003',
        name: 'LG트윈타워',
        companyId: companies[1].id,
        branchType: BranchType.HEADQUARTERS,
        addressStreet: '영등포구 여의대로 128',
        addressCity: '서울특별시',
        addressState: '서울',
        addressPostal: '07336',
        phone: '02-3777-1114',
        email: 'hq@lge.com',
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    // Naver branch
    prisma.branch.create({
      data: {
        code: 'BR004',
        name: '네이버 그린팩토리',
        companyId: companies[2].id,
        branchType: BranchType.HEADQUARTERS,
        addressStreet: '불정로 6',
        addressCity: '성남시 분당구',
        addressState: '경기도',
        addressPostal: '13561',
        phone: '1588-3830',
        email: 'contact@navercorp.com',
        createdBy: users[2].id,
        updatedBy: users[2].id,
      },
    }),
    // Kakao branch
    prisma.branch.create({
      data: {
        code: 'BR005',
        name: '카카오 판교아지트',
        companyId: companies[3].id,
        branchType: BranchType.HEADQUARTERS,
        addressStreet: '판교역로 166',
        addressCity: '성남시 분당구',
        addressState: '경기도',
        addressPostal: '13529',
        phone: '1577-3321',
        email: 'contact@kakaocorp.com',
        createdBy: users[2].id,
        updatedBy: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${branches.length} branches`);

  // Create Contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: '철수',
        lastName: '김',
        position: '구매팀장',
        department: '구매부',
        email: 'cs.kim@samsung.com',
        phone: '02-2055-1234',
        mobile: '010-5555-1234',
        isPrimary: true,
        branchId: branches[0].id,
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: '영희',
        lastName: '이',
        position: '인사팀장',
        department: '인사부',
        email: 'yh.lee@lge.com',
        phone: '02-3777-5678',
        mobile: '010-6666-5678',
        isPrimary: true,
        branchId: branches[2].id,
        createdBy: users[1].id,
        updatedBy: users[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: '민수',
        lastName: '박',
        position: '개발팀 리더',
        department: '개발부',
        email: 'ms.park@navercorp.com',
        phone: '031-784-1234',
        mobile: '010-7777-1234',
        isPrimary: true,
        branchId: branches[3].id,
        createdBy: users[2].id,
        updatedBy: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);

  console.log('🎉 Database seed completed successfully!');
  
  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`- Industries: ${industries.length}`);
  console.log(`- Departments: ${departments.length}`);
  console.log(`- Teams: ${teams.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Companies: ${companies.length}`);
  console.log(`- Branches: ${branches.length}`);
  console.log(`- Contacts: ${contacts.length}`);
  
  console.log('\n🔑 Test Accounts:');
  console.log('- Admin: admin@crmaugu.com / Password123!');
  console.log('- Sales Manager: sales.manager@crmaugu.com / Password123!');
  console.log('- Sales Staff: sales1@crmaugu.com / Password123!');
  console.log('- Developer: dev1@crmaugu.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });