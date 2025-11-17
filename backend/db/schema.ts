export type UserPosition =
  | 'servis_personeli'
  | 'barista'
  | 'supervisor'
  | 'mudur_yardimcisi'
  | 'magaza_muduru'
  | 'bolge_muduru'
  | 'egitmen'
  | 'egitim_muduru'
  | 'insan_kaynaklari';

export type User = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone: string;
  store: string;
  region: string;
  position: UserPosition;
  startDate: string;
  birthDate?: string;
  isApproved: boolean;
  approvedBy: string[];
  isTerminated?: boolean;
  terminatedDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};
