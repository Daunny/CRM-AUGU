import { PrismaClient, UserTier, UserRole, CompanySize, BranchType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting data initialization...');

  // Create Department
  const department = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      code: 'SALES',
      name: '영업팀',
      description: '영업 및 비즈니스 개발',
      isActive: true,
    }
  });
  console.log('✅ Department created:', department.name);

  // Create Team
  const team = await prisma.team.upsert({
    where: { code: 'SALES-1' },
    update: {},
    create: {
      code: 'SALES-1',
      name: '영업1팀',
      description: 'B2B 영업팀',
      departmentId: department.id,
      isActive: true,
    }
  });
  console.log('✅ Team created:', team.name);

  // Create Admin User
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crmaugu.com' },
    update: {},
    create: {
      email: 'admin@crmaugu.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '010-1234-5678',
      departmentId: department.id,
      teamId: team.id,
      position: '매니저',
      userTier: UserTier.EXECUTIVE,
      role: UserRole.ADMIN,
      isActive: true,
    }
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create Test User
  const testUser = await prisma.user.upsert({
    where: { email: 'test@crmaugu.com' },
    update: {},
    create: {
      email: 'test@crmaugu.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: '010-2345-6789',
      departmentId: department.id,
      teamId: team.id,
      position: '사원',
      userTier: UserTier.OPERATOR,
      role: UserRole.OPERATOR,
      isActive: true,
    }
  });
  console.log('✅ Test user created:', testUser.email);

  // Create Industry
  const industry = await prisma.industry.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      code: 'IT',
      name: 'Information Technology',
      description: 'IT 및 소프트웨어 산업',
    }
  });
  console.log('✅ Industry created:', industry.name);

  // Create Company
  const company = await prisma.company.upsert({
    where: { code: 'COMP001' },
    update: {},
    create: {
      code: 'COMP001',
      name: '삼성전자',
      businessNumber: '124-81-00998',
      industryId: industry.id,
      companySize: CompanySize.ENTERPRISE,
      website: 'https://www.samsung.com',
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    }
  });
  console.log('✅ Company created:', company.name);

  // Create Branch
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      code: 'BR001',
      name: '본사',
      branchType: BranchType.HEADQUARTERS,
      phone: '02-2053-3000',
      email: 'hq@samsung.com',
      addressStreet: '서울특별시 서초구 서초대로74길 11',
      addressCity: '서울',
      addressState: '서울특별시',
      addressCountry: '대한민국',
      addressPostal: '06620',
      isPrimary: true,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    }
  });
  console.log('✅ Branch created:', branch.name);

  // Create Contact
  const contact = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Kim',
      email: 'john.kim@samsung.com',
      phone: '02-2053-3001',
      mobile: '010-3456-7890',
      position: 'Manager',
      department: 'Sales',
      branchId: branch.id,
      isPrimary: true,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    }
  });
  console.log('✅ Contact created:', contact.firstName, contact.lastName);

  console.log('\n✨ Data initialization completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@crmaugu.com / Admin123!@#');
  console.log('Test: test@crmaugu.com / Admin123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error during initialization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });