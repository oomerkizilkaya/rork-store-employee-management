import { protectedProcedure } from '../../../create-context';

export const logoutProcedure = protectedProcedure.mutation(async () => {
  return { success: true, message: 'Çıkış başarılı' };
});

export default logoutProcedure;
