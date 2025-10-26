import { protectedProcedure } from '../../../create-context';

export default protectedProcedure.query(async ({ ctx }) => {
  const { passwordHash, ...userWithoutPassword } = ctx.user;
  return userWithoutPassword;
});
