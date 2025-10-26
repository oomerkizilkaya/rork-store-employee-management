import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { db } from '../../../../db/database';
import { verifyPassword, generateJWT } from '../../../../lib/auth';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password } = input;

    console.log('🔵 Login attempt:', email);

    const user = await db.getUserByEmail(email);

    if (!user) {
      console.log('❌ User not found');
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      console.log('❌ Invalid password');
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    if (!user.isApproved) {
      console.log('❌ User not approved');
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Hesabınız henüz onaylanmadı. Lütfen yöneticinizle iletişime geçin.',
      });
    }

    const token = generateJWT(user.id);

    const { passwordHash, ...userWithoutPassword } = user;

    console.log('✅ Login successful:', user.email);

    return {
      token,
      user: userWithoutPassword,
    };
  });
