import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing data 
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.technicianProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('Cleaned up previous data.');

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const customerPassword = await bcrypt.hash('customer123', 12);
  const technicianPassword = await bcrypt.hash('tech123', 12);

  // 3. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@fixitnow.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Seeded admin user: ${admin.email}`);

  // 4. Create Customers
  const customer = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'customer@fixitnow.com',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log(`Seeded customer user: ${customer.email}`);

  // 5. Create Technician User and Profile
  const techUser = await prisma.user.create({
    data: {
      name: 'Alex Smith',
      email: 'technician@fixitnow.com',
      password: technicianPassword,
      role: 'TECHNICIAN',
    },
  });

  const techProfile = await prisma.technicianProfile.create({
    data: {
      userId: techUser.id,
      skills: ['Plumbing', 'Pipe Repair', 'Drain Cleaning'],
      experience: '5 years',
      pricing: 45.0,
      location: 'New York',
      availability: ['Mon 09:00-17:00', 'Wed 09:00-17:00', 'Fri 09:00-17:00'],
      rating: 4.8,
    },
  });
  console.log(`Seeded technician profile for: ${techUser.email}`);

  // 6. Create Categories
  const plumbing = await prisma.category.create({
    data: { name: 'Plumbing', slug: 'plumbing' },
  });
  const electrical = await prisma.category.create({
    data: { name: 'Electrical Services', slug: 'electrical' },
  });
  const cleaning = await prisma.category.create({
    data: { name: 'Home Cleaning', slug: 'cleaning' },
  });
  const painting = await prisma.category.create({
    data: { name: 'Painting & Decorating', slug: 'painting' },
  });
  console.log('Seeded service categories.');

  // 7. Create Services
  const plumbingService = await prisma.service.create({
    data: {
      name: 'Standard Leaky Pipe Repair',
      description: 'Fixing leaks in bathroom or kitchen pipes, including basic material inspection.',
      price: 60.0,
      categoryId: plumbing.id,
      technicianId: techProfile.id,
    },
  });

  const drainService = await prisma.service.create({
    data: {
      name: 'Advanced Drain Clog Cleaning',
      description: 'Clearing tough clogs from main lines using specialized equipment.',
      price: 95.0,
      categoryId: plumbing.id,
      technicianId: techProfile.id,
    },
  });

  console.log('Seeded sample services.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
