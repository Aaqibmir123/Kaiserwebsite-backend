import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.address.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.sellerApplication.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerStore.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('Seed complete. Demo records cleared. Add real data through the admin panel.');
}

main().finally(async () => prisma.$disconnect());
