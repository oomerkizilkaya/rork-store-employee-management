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
  position: string;
  startDate: string;
  birthDate?: string;
  isApproved: boolean;
  approvedBy: string[];
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
