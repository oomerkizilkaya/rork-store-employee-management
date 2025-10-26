import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { db } from '../../../../db/database';
import { hashPassword, validateEmail, validatePassword } from '../../../../lib/auth';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().min(1),
      store: z.string().min(1),
      region: z.string().min(1),
      position: z.string().min(1),
      startDate: z.string(),
      birthDate: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password, ...userData } = input;

    console.log('🔵 Registration attempt:', email);

    if (!validateEmail(email)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Geçerli bir email adresi girin',
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: passwordValidation.message || 'Geçersiz şifre',
      });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Bu email adresi zaten kayıtlı',
      });
    }

    const allUsers = await db.getAllUsers();
    const nextEmployeeNumber = allUsers.length + 1;
    const employeeId = `MKL${nextEmployeeNumber.toString().padStart(4, '0')}`;

    const passwordHash = await hashPassword(password);

    const newUser = await db.createUser({
      employeeId,
      email,
      passwordHash,
      ...userData,
      isApproved: false,
      approvedBy: [],
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    console.log('✅ Registration successful:', email);

    return {
      user: userWithoutPassword,
      message: 'Kaydınız alındı. Onaylandığında bildirim alacaksınız.',
    };
  });
