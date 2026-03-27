import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { db } from '../../../../db/database';
import { TRPCError } from '@trpc/server';
import { canApproveEmployees } from '../../../../utils/permissions';

export const approveUserProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('✅ Approving user:', input.userId, 'by:', ctx.user?.email);

    if (!ctx.user || !canApproveEmployees(ctx.user.position)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok',
      });
    }

    const userToApprove = await db.getUserById(input.userId);

    if (!userToApprove) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    if (userToApprove.isApproved) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Kullanıcı zaten onaylı',
      });
    }

    const approvedBy = userToApprove.approvedBy || [];
    if (!approvedBy.includes(ctx.user.id)) {
      approvedBy.push(ctx.user.id);
    }

    const updatedUser = await db.updateUser(input.userId, {
      isApproved: true,
      approvedBy,
    });

    if (!updatedUser) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı güncellenemedi',
      });
    }

    console.log('✅ User approved:', updatedUser.email);

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  });

export default approveUserProcedure;
