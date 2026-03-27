import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { db } from '../../../../db/database';
import { TRPCError } from '@trpc/server';
import { canApproveEmployees } from '../../../../utils/permissions';

export const rejectUserProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('❌ Rejecting user:', input.userId, 'by:', ctx.user?.email);

    if (!ctx.user || !canApproveEmployees(ctx.user.position)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok',
      });
    }

    const userToReject = await db.getUserById(input.userId);

    if (!userToReject) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    if (userToReject.isApproved) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Onaylı kullanıcılar reddedilemez',
      });
    }

    await db.updateUser(input.userId, {
      isApproved: false,
      approvedBy: [],
    });

    console.log('✅ User rejected:', userToReject.email);

    return { success: true };
  });

export default rejectUserProcedure;
