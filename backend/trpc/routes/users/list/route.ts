import { protectedProcedure } from '../../../create-context';
import { db } from '../../../../db/database';

export const listUsersProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log('📋 Listing users for:', ctx.user?.email);

  const allUsers = await db.getAllUsers();
  
  const usersWithoutPasswords = allUsers.map(({ passwordHash, ...user }) => user);
  
  console.log('✅ Returning users count:', usersWithoutPasswords.length);
  return usersWithoutPasswords;
});

export default listUsersProcedure;
