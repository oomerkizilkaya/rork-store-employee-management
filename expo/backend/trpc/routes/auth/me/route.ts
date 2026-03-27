import { protectedProcedure } from '../../../create-context';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { passwordHash, ...userWithoutPassword } = ctx.user;
  return userWithoutPassword;
});

export default meProcedure;
