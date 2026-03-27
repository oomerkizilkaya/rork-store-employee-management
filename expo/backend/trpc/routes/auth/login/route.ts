import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { db } from '../../../../db/database';
import { verifyPassword, generateJWT } from '../../../../lib/auth';
import { TRPCError } from '@trpc/server';

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    console.log('🔑 Login attempt for:', input.email);
    
    const { email, password } = input;

    const user = await db.getUserByEmail(email);

    if (!user) {
      console.log('❌ User not found:', email);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      console.log('❌ Invalid password for:', email);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email veya şifre hatalı',
      });
    }

    if (!user.isApproved) {
      console.log('❌ User not approved:', email);
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Hesabınız henüz onaylanmadı. Lütfen yöneticinizle iletişime geçin.',
      });
    }

    const token = generateJWT(user.id);
    const { passwordHash, ...userWithoutPassword } = user;
    
    const response = {
      token,
      user: userWithoutPassword,
    };
    
    console.log('✅ Login successful for:', email);
    console.log('📦 Response object:', JSON.stringify(response).substring(0, 100));
    
    return response;
  });

export default loginProcedure;
