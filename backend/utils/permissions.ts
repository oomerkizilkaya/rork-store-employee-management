import { UserPosition } from '../db/schema';

export function canSeeAllStores(position: UserPosition): boolean {
  return ['insan_kaynaklari', 'egitim_muduru', 'bolge_muduru'].includes(position);
}

export function canSeePhoneNumbers(position: UserPosition): boolean {
  return [
    'insan_kaynaklari',
    'egitim_muduru',
    'bolge_muduru',
    'magaza_muduru',
    'mudur_yardimcisi',
  ].includes(position);
}

export function canApproveEmployees(position: UserPosition): boolean {
  return [
    'insan_kaynaklari',
    'egitim_muduru',
    'bolge_muduru',
    'magaza_muduru',
    'mudur_yardimcisi',
    'supervisor',
    'egitmen',
  ].includes(position);
}

export function canManageShifts(position: UserPosition): boolean {
  return [
    'insan_kaynaklari',
    'magaza_muduru',
    'mudur_yardimcisi',
    'supervisor',
  ].includes(position);
}

export function canApproveOvertime(position: UserPosition): boolean {
  return [
    'insan_kaynaklari',
    'magaza_muduru',
    'mudur_yardimcisi',
  ].includes(position);
}
