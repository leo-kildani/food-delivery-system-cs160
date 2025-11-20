import prisma from "@/lib/prisma";

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    const count = await prisma.user.count();
    console.log(`Found ${count} users`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();