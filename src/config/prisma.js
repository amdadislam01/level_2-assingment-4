import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Optional: log queries or handle database connection events
// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query);
//   console.log('Params: ' + e.params);
// });
