import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { Calendar, Gift, PartyPopper, Users, Lock, DollarSign, Clock, Briefcase } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LeaveBalance, Holiday, CompanyEvent, OvertimeRequest, EmployeeShift } from '@/types';

type UpcomingLeave = {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
};

type UpcomingBirthday = {
  employeeName: string;
  birthDate: string;
  daysUntil: number;
};

type EmployeeStats = {
  totalEmployees: number;
  withSalary: number;
  withoutSalary: number;
  totalOvertime: number;
  totalOffDays: number;
};

type EmployeeInfo = {
  id: string;
  name: string;
  position: string;
  store: string;
  salary?: number;
  overtimeHours: number;
  offDayHours: number;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [upcomingLeaves, setUpcomingLeaves] = useState<UpcomingLeave[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{ position: string; count: number }[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [topEmployees, setTopEmployees] = useState<EmployeeInfo[]>([]);

  const loadLeaveBalance = useCallback(async () => {
    try {
      const balancesStr = await AsyncStorage.getItem('@mikel_leave_balances');
      const balances: LeaveBalance[] = balancesStr ? JSON.parse(balancesStr) : [];
      
      let balance = balances.find(b => b.employeeId === user?.id && b.year === new Date().getFullYear());
      
      if (!balance && user) {
        balance = {
          employeeId: user.id,
          year: new Date().getFullYear(),
          totalDays: 14,
          usedDays: 0,
          remainingDays: 14,
        };
        balances.push(balance);
        await AsyncStorage.setItem('@mikel_leave_balances', JSON.stringify(balances));
      }
      
      setLeaveBalance(balance || null);
    } catch (error) {
      console.error('Leave balance yükleme hatası:', error);
    }
  }, [user]);

  const loadUpcomingLeaves = useCallback(async () => {
    try {
      setUpcomingLeaves([]);
    } catch (error) {
      console.error('Yaklaşan izinler yükleme hatası:', error);
    }
  }, []);

  const loadUpcomingBirthdays = useCallback(async () => {
    try {
      setUpcomingBirthdays([]);
    } catch (error) {
      console.error('Yaklaşan doğum günleri yükleme hatası:', error);
    }
  }, []);

  const loadHolidays = useCallback(async () => {
    try {
      let holidaysStr = await AsyncStorage.getItem('@mikel_holidays');
      let holidaysList: Holiday[] = [];
      
      if (!holidaysStr) {
        const currentYear = new Date().getFullYear();
        holidaysList = [
          { id: '1', name: 'Yılbaşı', date: `${currentYear}-01-01`, type: 'national' },
          { id: '2', name: 'Ulusal Egemenlik ve Çocuk Bayramı', date: `${currentYear}-04-23`, type: 'national' },
          { id: '3', name: 'İşçi Bayramı', date: `${currentYear}-05-01`, type: 'national' },
          { id: '4', name: 'Gençlik ve Spor Bayramı', date: `${currentYear}-05-19`, type: 'national' },
          { id: '5', name: 'Ramazan Bayramı 1. Gün', date: `${currentYear}-04-10`, type: 'religious' },
          { id: '6', name: 'Ramazan Bayramı 2. Gün', date: `${currentYear}-04-11`, type: 'religious' },
          { id: '7', name: 'Ramazan Bayramı 3. Gün', date: `${currentYear}-04-12`, type: 'religious' },
          { id: '8', name: 'Demokrasi ve Milli Birlik Günü', date: `${currentYear}-07-15`, type: 'national' },
          { id: '9', name: 'Kurban Bayramı 1. Gün', date: `${currentYear}-06-16`, type: 'religious' },
          { id: '10', name: 'Kurban Bayramı 2. Gün', date: `${currentYear}-06-17`, type: 'religious' },
          { id: '11', name: 'Kurban Bayramı 3. Gün', date: `${currentYear}-06-18`, type: 'religious' },
          { id: '12', name: 'Kurban Bayramı 4. Gün', date: `${currentYear}-06-19`, type: 'religious' },
          { id: '13', name: 'Zafer Bayramı', date: `${currentYear}-08-30`, type: 'national' },
          { id: '14', name: 'Cumhuriyet Bayramı', date: `${currentYear}-10-29`, type: 'national' },
        ];
        await AsyncStorage.setItem('@mikel_holidays', JSON.stringify(holidaysList));
      } else {
        holidaysList = JSON.parse(holidaysStr);
      }
      
      const today = new Date();
      const upcoming = holidaysList
        .filter(h => new Date(h.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      
      setHolidays(upcoming);
    } catch (error) {
      console.error('Resmi tatiller yükleme hatası:', error);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const eventsStr = await AsyncStorage.getItem('@mikel_events');
      const eventsList: CompanyEvent[] = eventsStr ? JSON.parse(eventsStr) : [];
      
      const today = new Date();
      const upcoming = eventsList
        .filter(e => {
          const eventDate = new Date(e.date);
          return eventDate >= today && (!e.storeId || e.storeId === user?.store);
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      
      setEvents(upcoming);
    } catch (error) {
      console.error('Etkinlikler yükleme hatası:', error);
    }
  }, [user]);

  const calculateOvertimeHours = async (employeeId: string): Promise<number> => {
    try {
      const overtimeStr = await AsyncStorage.getItem('@mikel_overtime_requests');
      if (!overtimeStr) return 0;

      const requests: OvertimeRequest[] = JSON.parse(overtimeStr);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const approvedHours = requests
        .filter(req => {
          const reqDate = new Date(req.date);
          return req.employeeId === employeeId && 
                 req.status === 'approved' && 
                 reqDate.getMonth() === currentMonth &&
                 reqDate.getFullYear() === currentYear;
        })
        .reduce((sum, req) => sum + req.hours, 0);

      return approvedHours;
    } catch (error) {
      console.error('Ekstra mesai hesaplama hatası:', error);
      return 0;
    }
  };

  const calculateOffDayHours = async (employeeId: string): Promise<number> => {
    try {
      const shiftsStr = await AsyncStorage.getItem('@mikel_shifts');
      if (!shiftsStr) return 0;

      const allShifts: any[] = JSON.parse(shiftsStr);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let offDayHours = 0;

      for (const shift of allShifts) {
        const weekStart = new Date(shift.weekStart);
        if (weekStart.getMonth() !== currentMonth || weekStart.getFullYear() !== currentYear) {
          continue;
        }

        const employeeShift = shift.employees?.find((emp: EmployeeShift) => emp.employeeId === employeeId);
        if (!employeeShift) continue;

        employeeShift.days?.forEach((day: any) => {
          const dayDate = new Date(day.date);
          const dayOfWeek = dayDate.getDay();
          
          if (dayOfWeek === 0 && day.startTime && day.endTime && !day.isLeave) {
            const [startHour, startMin] = day.startTime.split(':').map(Number);
            const [endHour, endMin] = day.endTime.split(':').map(Number);
            const hours = (endHour - startHour) + (endMin - startMin) / 60;
            offDayHours += hours;
          }
        });
      }

      return offDayHours;
    } catch (error) {
      console.error('Off günü hesaplama hatası:', error);
      return 0;
    }
  };

  const loadDepartmentStats = useCallback(async () => {
    try {
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      const allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [];
      
      const activeUsers = allUsers.filter(u => !u.isTerminated && u.isApproved);
      
      const positionCounts: Record<string, number> = {};
      activeUsers.forEach(u => {
        positionCounts[u.position] = (positionCounts[u.position] || 0) + 1;
      });
      
      const stats = Object.entries(positionCounts).map(([position, count]) => ({
        position: getPositionLabel(position),
        count,
      }));
      
      setDepartmentStats(stats);

      const withSalary = activeUsers.filter(u => u.salary && u.salary > 0).length;
      const withoutSalary = activeUsers.length - withSalary;

      let totalOvertime = 0;
      let totalOffDays = 0;

      const employeeInfoPromises = activeUsers.map(async (u) => {
        const overtime = await calculateOvertimeHours(u.id);
        const offDay = await calculateOffDayHours(u.id);
        totalOvertime += overtime;
        totalOffDays += offDay;
        
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          position: getPositionLabel(u.position),
          store: u.store,
          salary: u.salary,
          overtimeHours: overtime,
          offDayHours: offDay,
        };
      });

      const employeeInfos = await Promise.all(employeeInfoPromises);

      const sortedByOvertime = [...employeeInfos]
        .filter(e => e.overtimeHours > 0 || e.offDayHours > 0)
        .sort((a, b) => (b.overtimeHours + b.offDayHours) - (a.overtimeHours + a.offDayHours))
        .slice(0, 5);

      setTopEmployees(sortedByOvertime);
      setEmployeeStats({
        totalEmployees: activeUsers.length,
        withSalary,
        withoutSalary,
        totalOvertime,
        totalOffDays,
      });
    } catch (error) {
      console.error('Departman istatistikleri yükleme hatası:', error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    await loadLeaveBalance();
    await loadUpcomingLeaves();
    await loadUpcomingBirthdays();
    await loadHolidays();
    await loadEvents();
    await loadDepartmentStats();
  }, [user, loadLeaveBalance, loadUpcomingLeaves, loadUpcomingBirthdays, loadHolidays, loadEvents, loadDepartmentStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getPositionLabel = (position: string): string => {
    const labels: Record<string, string> = {
      servis_personeli: 'Servis',
      barista: 'Barista',
      supervisor: 'Süpervizör',
      mudur_yardimcisi: 'Müdür Yrd.',
      magaza_muduru: 'Mağaza Müdürü',
      bolge_muduru: 'Bölge Müdürü',
      egitmen: 'Eğitmen',
      egitim_muduru: 'Eğitim Müdürü',
      insan_kaynaklari: 'İK',
    };
    return labels[position] || position;
  };

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  if (!user) return null;

  if (user.position !== 'insan_kaynaklari') {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.headerBackground, { height: insets.top }]} />
          <View style={styles.topBar}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yk40w2bqfr6oa4yc8w2q3' }} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.topBarTitle}>Dashboard</Text>
          </View>
        </View>
        
        <View style={styles.noAccessContainer}>
          <Lock size={48} color={colors.gray[400]} />
          <Text style={styles.noAccessTitle}>Erişim Yetkiniz Yok</Text>
          <Text style={styles.noAccessText}>Dashboard'a sadece İnsan Kaynakları yetkileri erişebilir.</Text>
        </View>
      </View>
    );
  }

  const progressPercentage = leaveBalance 
    ? (leaveBalance.usedDays / leaveBalance.totalDays) * 100 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.topBar}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yk40w2bqfr6oa4yc8w2q3' }} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.topBarTitle}>Dashboard</Text>
        </View>
      </View>
      
      <Image 
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/52mk5c717uw2fbnlwljam' }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Hoş geldin,</Text>
          <Text style={styles.welcomeName}>{user.firstName}! 👋</Text>
        </View>

        <View style={styles.leaveBalanceCard}>
          <View style={styles.leaveHeader}>
            <View style={styles.leaveHeaderLeft}>
              <Calendar size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>İzin Bilgileri</Text>
            </View>
          </View>
          
          {leaveBalance && (
            <>
              <View style={styles.leaveStats}>
                <View style={styles.leaveStat}>
                  <Text style={styles.leaveStatValue}>{leaveBalance.totalDays}</Text>
                  <Text style={styles.leaveStatLabel}>Toplam Hak</Text>
                </View>
                <View style={styles.leaveStat}>
                  <Text style={[styles.leaveStatValue, { color: colors.error }]}>
                    {leaveBalance.usedDays}
                  </Text>
                  <Text style={styles.leaveStatLabel}>Kullanılan</Text>
                </View>
                <View style={styles.leaveStat}>
                  <Text style={[styles.leaveStatValue, { color: colors.success }]}>
                    {leaveBalance.remainingDays}
                  </Text>
                  <Text style={styles.leaveStatLabel}>Kalan</Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressPercentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  %{progressPercentage.toFixed(0)} kullanıldı
                </Text>
              </View>
            </>
          )}
        </View>

        {upcomingLeaves.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Yaklaşan İzinler</Text>
            </View>
            {upcomingLeaves.map((leave, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <Text style={styles.listItemName}>{leave.employeeName}</Text>
                  <Text style={styles.listItemDetail}>
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </Text>
                </View>
                <View style={styles.leaveTypeBadge}>
                  <Text style={styles.leaveTypeText}>{leave.leaveType}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {upcomingBirthdays.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Gift size={20} color={colors.secondary} />
              <Text style={styles.cardTitle}>Yaklaşan Doğum Günleri</Text>
            </View>
            {upcomingBirthdays.map((birthday, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <Text style={styles.listItemName}>{birthday.employeeName}</Text>
                  <Text style={styles.listItemDetail}>
                    {formatDate(birthday.birthDate)}
                  </Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysText}>
                    {birthday.daysUntil === 0 ? 'Bugün! 🎉' : `${birthday.daysUntil} gün`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {holidays.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <PartyPopper size={20} color={colors.success} />
              <Text style={styles.cardTitle}>Resmi Tatiller</Text>
            </View>
            {holidays.map((holiday) => {
              const daysUntil = getDaysUntil(holiday.date);
              return (
                <View key={holiday.id} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemName}>{holiday.name}</Text>
                    <Text style={styles.listItemDetail}>{formatDate(holiday.date)}</Text>
                  </View>
                  <View style={styles.daysBadge}>
                    <Text style={styles.daysText}>
                      {daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {events.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Yaklaşan Etkinlikler</Text>
            </View>
            {events.map((event) => {
              const daysUntil = getDaysUntil(event.date);
              return (
                <View key={event.id} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemName}>{event.title}</Text>
                    <Text style={styles.listItemDetail}>
                      {formatDate(event.date)} • {event.location}
                    </Text>
                  </View>
                  <View style={styles.daysBadge}>
                    <Text style={styles.daysText}>
                      {daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {employeeStats && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Briefcase size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Genel İstatistikler</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Users size={24} color={colors.primary} />
                <Text style={styles.statBoxValue}>{employeeStats.totalEmployees}</Text>
                <Text style={styles.statBoxLabel}>Toplam Çalışan</Text>
              </View>
              <View style={styles.statBox}>
                <DollarSign size={24} color={colors.success} />
                <Text style={styles.statBoxValue}>{employeeStats.withSalary}</Text>
                <Text style={styles.statBoxLabel}>Maaş Tanımlı</Text>
              </View>
              <View style={styles.statBox}>
                <Clock size={24} color={colors.warning} />
                <Text style={styles.statBoxValue}>{employeeStats.totalOvertime.toFixed(1)}</Text>
                <Text style={styles.statBoxLabel}>Toplam Mesai (sa)</Text>
              </View>
              <View style={styles.statBox}>
                <Calendar size={24} color={colors.secondary} />
                <Text style={styles.statBoxValue}>{employeeStats.totalOffDays.toFixed(1)}</Text>
                <Text style={styles.statBoxLabel}>Toplam Off (sa)</Text>
              </View>
            </View>
          </View>
        )}

        {topEmployees.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={20} color={colors.warning} />
              <Text style={styles.cardTitle}>En Çok Mesai Yapanlar</Text>
            </View>
            {topEmployees.map((emp) => (
              <View key={emp.id} style={styles.employeeRow}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{emp.name}</Text>
                  <Text style={styles.employeeDetail}>{emp.position} • {emp.store}</Text>
                </View>
                <View style={styles.employeeHours}>
                  {emp.overtimeHours > 0 && (
                    <Text style={[styles.hoursText, { color: colors.warning }]}>
                      +{emp.overtimeHours.toFixed(1)}sa mesai
                    </Text>
                  )}
                  {emp.offDayHours > 0 && (
                    <Text style={[styles.hoursText, { color: colors.secondary }]}>
                      +{emp.offDayHours.toFixed(1)}sa off
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {departmentStats.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Pozisyon Dağılımı</Text>
            </View>
            <View style={styles.statsContainer}>
              {departmentStats.map((stat, index) => {
                const totalEmployees = departmentStats.reduce((sum, s) => sum + s.count, 0);
                const percentage = (stat.count / totalEmployees) * 100;
                
                return (
                  <View key={index} style={styles.statRow}>
                    <View style={styles.statLeft}>
                      <Text style={styles.statLabel}>{stat.position}</Text>
                      <Text style={styles.statValue}>{stat.count} kişi</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View 
                        style={[
                          styles.statBar, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundLogo: {
    position: 'absolute' as const,
    width: 300,
    height: 300,
    alignSelf: 'center',
    top: '40%',
    opacity: 0.08,
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  headerWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerBackground: {
    backgroundColor: colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.white + 'CC',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.white,
  },
  leaveBalanceCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leaveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaveStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  leaveStat: {
    alignItems: 'center',
  },
  leaveStatValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  leaveStatLabel: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600' as const,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  listItemLeft: {
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 4,
  },
  listItemDetail: {
    fontSize: 13,
    color: colors.gray[600],
  },
  leaveTypeBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaveTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  daysBadge: {
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    gap: 8,
  },
  statLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  statValue: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600' as const,
  },
  statBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.gray[900],
  },
  statBoxLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 4,
  },
  employeeDetail: {
    fontSize: 13,
    color: colors.gray[600],
  },
  employeeHours: {
    alignItems: 'flex-end',
    gap: 4,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginTop: 20,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});
