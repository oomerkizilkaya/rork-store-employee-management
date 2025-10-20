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
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  store: string;
  position: UserPosition;
  startDate: string;
  profilePhoto?: string;
  region?: string;
  isApproved?: boolean;
  approvedBy?: string[];
  isTerminated?: boolean;
  terminatedDate?: string;
  terminationReason?: string;
  hasTraining?: boolean;
};

export type MediaFile = {
  id: string;
  uri: string;
  type: 'image' | 'video';
  thumbnail?: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  media?: MediaFile[];
};

export type Region = {
  id: string;
  name: string;
  stores: string[];
  regionalManager?: string;
  regionalManagerName?: string;
  trainer?: string;
  trainerName?: string;
  createdBy: string;
  createdAt: string;
};

export type DaySchedule = {
  date: string;
  startTime?: string;
  endTime?: string;
  isLeave?: boolean;
  leaveType?: 'sick' | 'vacation' | 'personal';
  leaveReason?: string;
  checkIn?: string;
  checkOut?: string;
  checkInStatus?: 'done' | 'not_done';
  checkOutStatus?: 'done' | 'not_done';
  checkInReason?: string;
  checkOutReason?: string;
};

export type EmployeeShift = {
  employeeId: string;
  employeeName: string;
  position: UserPosition;
  profilePhoto?: string;
  days: DaySchedule[];
};

export type Shift = {
  id: string;
  storeId: string;
  storeName: string;
  weekStart: string;
  weekEnd: string;
  employees: EmployeeShift[];
  createdBy: string;
  createdAt: string;
};

export type OvertimeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  storeName: string;
  region?: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type FileCategory = 'videos' | 'photos' | 'documents' | 'recipes';

export type FileItem = {
  id: string;
  name: string;
  category: FileCategory;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
};

export type ExamType = 'sicak' | 'soguk' | 'genel';

export type ExamScore = {
  id: string;
  employeeId: string;
  employeeName: string;
  examType: ExamType;
  score: number;
  maxScore: number;
  passed: boolean;
  examinerId: string;
  examinerName: string;
  examDate: string;
  notes?: string;
};

export type PendingApproval = {
  id: string;
  userId: string;
  userName: string;
  userStore: string;
  userRegion?: string;
  userPosition: UserPosition;
  type: 'registration' | 'position_change';
  oldPosition?: UserPosition;
  newPosition?: UserPosition;
  requestedAt: string;
  approvedBy: string[];
  rejectedBy: string[];
  status: 'pending' | 'approved' | 'rejected';
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  store: string;
  region?: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkIn?: string;
  checkOut?: string;
  checkInStatus: 'done' | 'not_done' | 'pending';
  checkOutStatus: 'done' | 'not_done' | 'pending';
  checkInReason?: string;
  checkOutReason?: string;
};
