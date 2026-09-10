import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Seeding Employees & Warehouse Managers ---');

  // 1. Get or create a default branch
  let branch = await prisma.branch.findFirst({ where: { isArchived: false } });
  if (!branch) {
    let region = await prisma.region.findFirst({ where: { isActive: true } });
    if (!region) {
      region = await prisma.region.create({
        data: { name: 'Addis Ababa', code: 'ADD', isActive: true },
      });
    }
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Wholesale Distribution Corp', regionId: region.id, status: 'ACTIVE' },
      });
    }
    branch = await prisma.branch.create({
      data: {
        name: 'Headquarters Main Branch',
        branchCode: 'BR-HQ-01',
        companyId: company.id,
        regionId: region.id,
        status: 'ACTIVE',
      },
    });
  }

  // 2. Create Job Specifications
  const jobSpecs = [
    { code: 'JS-WHM-01', title: 'Warehouse Manager', department: 'Logistics & Warehousing' },
    { code: 'JS-INC-01', title: 'Inventory Controller', department: 'Inventory Management' },
    { code: 'JS-OPS-01', title: 'Operations Supervisor', department: 'Operations' },
    { code: 'JS-LGC-01', title: 'Logistics Coordinator', department: 'Supply Chain' },
  ];

  const createdJobSpecs = {};
  for (const js of jobSpecs) {
    const record = await prisma.jobSpecification.upsert({
      where: { code: js.code },
      update: { title: js.title, department: js.department, status: 'ACTIVE' },
      create: { code: js.code, title: js.title, department: js.department, status: 'ACTIVE' },
    });
    createdJobSpecs[js.code] = record;
  }
  console.log(`Created/Verified ${Object.keys(createdJobSpecs).length} Job Specifications`);

  // 3. Create Persons & Employees
  const employeeData = [
    {
      code: 'EMP-WHM-001',
      firstName: 'Abebe',
      middleName: 'Kebede',
      lastName: 'Bikila',
      email: 'abebe.bikila@wholesaledist.com',
      phone: '+251911234567',
      department: 'Logistics & Warehousing',
      jobCode: 'JS-WHM-01',
      hireDate: new Date('2023-01-15'),
    },
    {
      code: 'EMP-WHM-002',
      firstName: 'Selamawit',
      middleName: 'Haile',
      lastName: 'Desta',
      email: 'selamawit.desta@wholesaledist.com',
      phone: '+251912345678',
      department: 'Logistics & Warehousing',
      jobCode: 'JS-WHM-01',
      hireDate: new Date('2023-03-20'),
    },
    {
      code: 'EMP-WHM-003',
      firstName: 'Dawit',
      middleName: 'Solomon',
      lastName: 'Tadesse',
      email: 'dawit.tadesse@wholesaledist.com',
      phone: '+251913456789',
      department: 'Inventory Management',
      jobCode: 'JS-INC-01',
      hireDate: new Date('2023-06-10'),
    },
    {
      code: 'EMP-WHM-004',
      firstName: 'Tigist',
      middleName: 'Mulugeta',
      lastName: 'Alemu',
      email: 'tigist.alemu@wholesaledist.com',
      phone: '+251914567890',
      department: 'Operations',
      jobCode: 'JS-OPS-01',
      hireDate: new Date('2023-08-01'),
    },
    {
      code: 'EMP-WHM-005',
      firstName: 'Yonas',
      middleName: 'Bekele',
      lastName: 'Hailu',
      email: 'yonas.hailu@wholesaledist.com',
      phone: '+251915678901',
      department: 'Supply Chain',
      jobCode: 'JS-LGC-01',
      hireDate: new Date('2024-01-10'),
    },
  ];

  const createdEmployees = [];
  for (const emp of employeeData) {
    let person = await prisma.person.findFirst({ where: { email: emp.email } });
    if (!person) {
      person = await prisma.person.create({
        data: {
          firstName: emp.firstName,
          middleName: emp.middleName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone,
          status: 'ACTIVE',
        },
      });
    }

    let employee = await prisma.employee.findFirst({ where: { employeeCode: emp.code } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          employeeCode: emp.code,
          personId: person.id,
          department: emp.department,
          hireDate: emp.hireDate,
          status: 'ACTIVE',
          branchId: branch.id,
          isAvailableForSales: true,
        },
      });

      const js = createdJobSpecs[emp.jobCode];
      if (js) {
        await prisma.employeeJobSpecification.create({
          data: {
            employeeId: employee.id,
            jobSpecificationId: js.id,
          },
        });
      }
    }
    createdEmployees.push(employee);
    console.log(`Employee ready: ${emp.firstName} ${emp.lastName} (${emp.code})`);
  }

  // 4. Assign initial managers to warehouses if unassigned
  const warehouses = await prisma.warehouse.findMany({ where: { isArchived: false } });
  for (let i = 0; i < warehouses.length; i++) {
    const wh = warehouses[i];
    if (!wh.managerId && createdEmployees[i % createdEmployees.length]) {
      const assignedEmp = createdEmployees[i % createdEmployees.length];
      await prisma.warehouse.update({
        where: { id: wh.id },
        data: { managerId: assignedEmp.id },
      });

      // Also create WarehouseManager record
      await prisma.warehouseManager.create({
        data: {
          warehouseId: wh.id,
          employeeId: assignedEmp.id,
          isCurrent: true,
          assignedAt: new Date(),
          notes: 'Initial seed manager assignment',
        },
      });
      console.log(`Assigned manager ${assignedEmp.employeeCode} to warehouse ${wh.name}`);
    }
  }

  console.log('--- Employee & Warehouse Manager Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
