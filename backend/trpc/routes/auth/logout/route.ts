import { protectedProcedure } from '../../../create-context';

export default protectedProcedure.mutation(async () => {
  return { success: true, message: 'Çıkış başarılı' };
});
