import { UserPosition } from '@/types';

export function canSeeAllStores(position: UserPosition): boolean {
  return position === 'bolge_muduru' || 
         position === 'egitmen' || 
         position === 'egitim_muduru' || 
         position === 'insan_kaynaklari';
}

export function canSeePhoneNumbers(position: UserPosition): boolean {
  return position === 'bolge_muduru' || 
         position === 'egitmen' || 
         position === 'egitim_muduru' || 
         position === 'insan_kaynaklari';
}

export function canApproveOvertime(position: UserPosition): boolean {
  return position === 'magaza_muduru' || 
         position === 'mudur_yardimcisi' || 
         position === 'supervisor';
}

export function canCreateOvertime(position: UserPosition): boolean {
  return position !== 'bolge_muduru';
}

export function canCreateAttendance(position: UserPosition): boolean {
  return position !== 'bolge_muduru';
}

export function canViewRegionalData(position: UserPosition): boolean {
  return position === 'bolge_muduru' || 
         position === 'egitmen' || 
         position === 'egitim_muduru';
}

export function hasStoreManagerPermissions(position: UserPosition): boolean {
  return position === 'magaza_muduru' || 
         position === 'mudur_yardimcisi' || 
         position === 'supervisor';
}

export function canApproveRegistrations(position: UserPosition): boolean {
  return position === 'magaza_muduru' || 
         position === 'mudur_yardimcisi' || 
         position === 'supervisor' || 
         position === 'egitim_muduru' || 
         position === 'egitmen' ||
         position === 'insan_kaynaklari';
}

export function canApproveEmployees(position: UserPosition): boolean {
  return canApproveRegistrations(position);
}

export function canApprovePositionChange(position: UserPosition): boolean {
  return position === 'egitmen' || 
         position === 'egitim_muduru' || 
         position === 'insan_kaynaklari';
}
