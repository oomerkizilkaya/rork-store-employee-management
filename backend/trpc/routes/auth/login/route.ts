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
    console.log('🔐 Login attempt for:', input.email);
    const { email, password } = input;

    const user = await db.getUserByEmail(email);
    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    console.log('🔒 Password valid:', passwordValid);

    if (!passwordValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    if (!user.isApproved) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Hesabınız henüz onaylanmadı. Lütfen yöneticinizle iletişime geçin.',
      });
    }

    const token = generateJWT(user.id);
    console.log('✅ JWT generated successfully');

    const { passwordHash, ...userWithoutPassword } = user;
    
    const result = {
      token,
      user: userWithoutPassword,
    };
    
    console.log('✅ Login successful, returning response');
    return result;
  });
