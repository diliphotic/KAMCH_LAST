import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  FileText,
  Send,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Plus,
  Trash2,
  BellRing,
  Award,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Settings,
} from 'lucide-react';

export interface LeaveCategoryInfo {
  code: string;
  name: string;
  entitlementDays: number;
  maxDaysPerApp: number | null;
  minDaysPerApp: number | null;
  maxDailyCapacity: number | null;
  minGapMonths?: number;
  requiresReason: boolean;
  description: string;
}

export interface LeaveBalance {
  categoryCode: string;
  categoryName: string;
  entitlementDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  maxDaysPerApp: number | null;
  minDaysPerApp: number | null;
  maxDailyCapacity: number | null;
  requiresReason: boolean;
  description: string;
}

export interface LeaveApplication {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  teacher_designation?: string;
  department_name?: string;
  leave_category: 'CL' | 'EL' | 'SPECIAL_SL' | 'PATERNITY' | 'MATERNITY';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  submitted_at: string;
  decided_by: number | null;
  decided_at: string | null;
  decision_remarks: string | null;
}

export interface DailyTeacherStatus {
  teacherId: number;
  teacherName: string;
  employeeCode: string | null;
  designation: string;
  departmentName: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'UNRECORDED';
  recordedReason: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
  approvedLeave: {
    id: number;
    leaveCategory: string;
    startDate: string;
    endDate: string;
    reason: string;
    decisionRemarks: string | null;
    decidedByName: string | null;
  } | null;
  pendingLeave: {
    id: number;
    leaveCategory: string;
    startDate: string;
    endDate: string;
    reason: string;
  } | null;
  rejectedLeave: {
    id: number;
    leaveCategory: string;
    startDate: string;
    endDate: string;
    reason: string;
    decisionRemarks: string | null;
  } | null;
}

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export interface LeaveManagementViewProps {
  initialTab?: 'daily' | 'applications' | 'balances' | 'monthly';
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({ initialTab = 'daily' }) => {
  const { user, csrfToken } = useAuth();
  const isPrincipal = user?.role === 'PRINCIPAL' || user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'daily' | 'applications' | 'balances' | 'monthly'>(initialTab);

  // Notifications / Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Categories & Settings
  const [categories, setCategories] = useState<LeaveCategoryInfo[]>([]);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(20);
  const [minStartDate, setMinStartDate] = useState<string>('');
  const [maxStartDate, setMaxStartDate] = useState<string>('');

  // Tab 1: Daily Attendance States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<{
    date: string;
    summary: {
      totalTeachers: number;
      presentCount: number;
      absentCount: number;
      onLeaveCount: number;
      pendingLeaveCount: number;
      unrecordedCount: number;
    };
    teachers: DailyTeacherStatus[];
  } | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [dailySearch, setDailySearch] = useState('');
  const [dailyDeptFilter, setDailyDeptFilter] = useState('ALL');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('ALL');

  // Record Attendance Modal State
  const [recordModalTeacher, setRecordModalTeacher] = useState<DailyTeacherStatus | null>(null);
  const [recordStatus, setRecordStatus] = useState<'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE'>('PRESENT');
  const [recordReason, setRecordReason] = useState('');
  const [isSavingDaily, setIsSavingDaily] = useState(false);

  // Tab 2: Leave Applications States
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
  const [appCategoryFilter, setAppCategoryFilter] = useState('ALL');

  // Faculty Apply Form
  const [applyCategory, setApplyCategory] = useState<string>('CL');
  const [applyStartDate, setApplyStartDate] = useState<string>('');
  const [applyEndDate, setApplyEndDate] = useState<string>('');
  const [applyReason, setApplyReason] = useState<string>('');
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Decision Remarks
  const [decisionRemarksMap, setDecisionRemarksMap] = useState<Record<number, string>>({});
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<number | null>(null);

  // Tab 3: Leave Balances States
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Tab 4: Monthly Reports & Holidays States
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [calendarCalc, setCalendarCalc] = useState<any>(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [holidayNameInput, setHolidayNameInput] = useState('');
  const [holidayDateInput, setHolidayDateInput] = useState('');
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);

  // 1. Fetch Categories & Settings
  const fetchSettingsAndCategories = useCallback(async () => {
    try {
      const [catRes, setRes] = await Promise.all([
        fetch('/api/leave/categories'),
        fetch('/api/leave/settings'),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        setMaxAdvanceDays(setData.maxAdvanceDays || 20);
        setMinStartDate(setData.minStartDate || '');
        setMaxStartDate(setData.maxStartDate || '');
      }
    } catch (err) {
      console.error('Failed to load leave settings or categories:', err);
    }
  }, []);

  // 2. Fetch Daily Attendance
  const fetchDailyAttendance = useCallback(async (dateStr: string) => {
    setIsLoadingDaily(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/attendance/daily?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyData(data);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to fetch daily attendance');
      }
    } catch {
      setErrorMsg('Error loading daily teacher attendance records');
    } finally {
      setIsLoadingDaily(false);
    }
  }, []);

  // 3. Fetch Applications
  const fetchApplications = useCallback(async () => {
    setIsLoadingApps(true);
    try {
      const endpoint = isPrincipal ? '/api/leave/all-applications' : '/api/leave/my-applications';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setIsLoadingApps(false);
    }
  }, [isPrincipal]);

  // 4. Fetch Balances
  const fetchBalances = useCallback(async () => {
    setIsLoadingBalances(true);
    try {
      const res = await fetch('/api/leave/balances');
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error('Failed to fetch leave balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  // 5. Fetch Monthly Reports
  const fetchMonthlyReports = useCallback(async (year: number, month: number) => {
    setIsLoadingMonthly(true);
    try {
      const res = await fetch(`/api/attendance/reports?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyReports(data.reports || []);
        setCalendarCalc(data.calendar || null);
      }
    } catch (err) {
      console.error('Failed to fetch monthly reports:', err);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndCategories();
    fetchDailyAttendance(selectedDate);
    fetchApplications();
    fetchBalances();
    fetchMonthlyReports(selectedYear, selectedMonth);
  }, [
    fetchSettingsAndCategories,
    fetchDailyAttendance,
    fetchApplications,
    fetchBalances,
    fetchMonthlyReports,
    selectedDate,
    selectedYear,
    selectedMonth,
  ]);

  // Save Daily Attendance Entry
  const handleSaveDailyEntry = async () => {
    if (!recordModalTeacher || !selectedDate) return;
    setIsSavingDaily(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/attendance/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          attendanceDate: selectedDate,
          entries: [
            {
              teacherId: recordModalTeacher.teacherId,
              status: recordStatus,
              recordedReason: recordReason.trim() || null,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record attendance');

      setSuccessMsg(`Attendance updated for ${recordModalTeacher.teacherName}.`);
      setRecordModalTeacher(null);
      setRecordReason('');
      fetchDailyAttendance(selectedDate);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSavingDaily(false);
    }
  };

  // Submit Leave Application
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!applyStartDate || !applyEndDate || !applyReason.trim()) {
      setErrorMsg('Start date, end date, and reason are required.');
      return;
    }

    setIsSubmittingApply(true);
    try {
      const res = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          leaveCategory: applyCategory,
          startDate: applyStartDate,
          endDate: applyEndDate,
          reason: applyReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave application');

      setSuccessMsg(`Leave application submitted successfully for ${data.leaveCategory} (${data.durationDays} days).`);
      setApplyStartDate('');
      setApplyEndDate('');
      setApplyReason('');
      fetchApplications();
      fetchBalances();
      fetchDailyAttendance(selectedDate);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  // Decide Application (Approve / Reject)
  const handleDecideApplication = async (appId: number, status: 'APPROVED' | 'REJECTED') => {
    setIsSubmittingDecision(appId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const remarks = decisionRemarksMap[appId] || '';

    try {
      const res = await fetch(`/api/leave/${appId}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ status, remarks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process decision');

      setSuccessMsg(`Leave application ${status.toLowerCase()} successfully.`);
      fetchApplications();
      fetchDailyAttendance(selectedDate);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmittingDecision(null);
    }
  };

  // Save Holiday
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDateInput || !holidayNameInput.trim()) return;
    setIsSavingHoliday(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/attendance/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          holidayDate: holidayDateInput,
          holidayName: holidayNameInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save holiday');

      setSuccessMsg(`Institutional holiday "${holidayNameInput}" added for ${holidayDateInput}.`);
      setHolidayDateInput('');
      setHolidayNameInput('');
      fetchMonthlyReports(selectedYear, selectedMonth);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSavingHoliday(false);
    }
  };

  // Helper date shift
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    setSelectedDate(dt.toISOString().split('T')[0]);
  };

  // Filtered teachers list for daily tracker
  const filteredDailyTeachers = (dailyData?.teachers || []).filter((t) => {
    const matchesSearch =
      t.teacherName.toLowerCase().includes(dailySearch.toLowerCase()) ||
      (t.employeeCode && t.employeeCode.toLowerCase().includes(dailySearch.toLowerCase())) ||
      (t.departmentName && t.departmentName.toLowerCase().includes(dailySearch.toLowerCase()));

    const matchesDept = dailyDeptFilter === 'ALL' || t.departmentName === dailyDeptFilter;
    const matchesStatus =
      dailyStatusFilter === 'ALL' ||
      (dailyStatusFilter === 'ABSENT' && (t.status === 'ABSENT' || t.status === 'ON_LEAVE')) ||
      t.status === dailyStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const selectedCategoryObj = categories.find((c) => c.code === applyCategory);

  // Calculate requested duration
  let applyDurationDays = 0;
  if (applyStartDate && applyEndDate && applyStartDate <= applyEndDate) {
    const [sy, sm, sd] = applyStartDate.split('-').map(Number);
    const [ey, em, ed] = applyEndDate.split('-').map(Number);
    applyDurationDays = Math.round((new Date(Date.UTC(ey, em - 1, ed)).getTime() - new Date(Date.UTC(sy, sm - 1, sd)).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Teacher Attendance & Leave Workspace"
        kicker="FACULTY GOVERNANCE & ABSENCE TRACKER"
        description="Unified institutional workspace for daily teacher attendance, leave applications across five official categories, capacity checks, and monthly reports."
      />

      {errorMsg && (
        <Card accentTop>
          <CardContent className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 text-sm font-bold">
              &times;
            </button>
          </CardContent>
        </Card>
      )}

      {successMsg && (
        <Card accentTop>
          <CardContent className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-sm font-bold">
              &times;
            </button>
          </CardContent>
        </Card>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'daily'
              ? 'bg-[#4B2E2E] text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar &amp; Daily Absence Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'applications'
              ? 'bg-[#4B2E2E] text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Leave Applications &amp; Approvals</span>
          {applications.filter((a) => a.status === 'PENDING').length > 0 && isPrincipal && (
            <span className="bg-[#D4AF37] text-[#4B2E2E] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {applications.filter((a) => a.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'balances'
              ? 'bg-[#4B2E2E] text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Leave Categories &amp; Balances</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'monthly'
              ? 'bg-[#4B2E2E] text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Monthly Reports &amp; Holidays</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CALENDAR & DAILY ABSENCE TRACKER
          ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector Header Bar */}
          <Card accentTop>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Daily Teacher Attendance &amp; Absence Tracker</CardTitle>
                  <CardDescription>
                    Select any calendar date to view teachers recorded absent, approved leave details, pending applications, and record daily attendance.
                  </CardDescription>
                </div>

                {/* Date Control */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => shiftDate(-1)} title="Previous Day">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 border border-stone-300 rounded text-xs font-mono bg-white font-semibold text-stone-800 shadow-xs focus:ring-[#4B2E2E]"
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={() => shiftDate(1)} title="Next Day">
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="text-xs"
                  >
                    Today
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDailyAttendance(selectedDate)}
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDaily ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Daily Summary Cards */}
              {dailyData && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <div className="p-3 bg-[#FAF9F5] border border-stone-200 rounded">
                    <div className="text-[10px] uppercase font-bold text-stone-500">Total Teachers</div>
                    <div className="text-xl font-bold text-stone-900 mt-0.5">{dailyData.summary.totalTeachers}</div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Present</div>
                    <div className="text-xl font-bold text-emerald-900 mt-0.5">{dailyData.summary.presentCount}</div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded">
                    <div className="text-[10px] uppercase font-bold text-rose-800">Recorded Absences</div>
                    <div className="text-xl font-bold text-rose-900 mt-0.5">{dailyData.summary.absentCount}</div>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded">
                    <div className="text-[10px] uppercase font-bold text-purple-800">On Approved Leave</div>
                    <div className="text-xl font-bold text-purple-900 mt-0.5">{dailyData.summary.onLeaveCount}</div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded">
                    <div className="text-[10px] uppercase font-bold text-amber-800">Pending Requests</div>
                    <div className="text-xl font-bold text-amber-900 mt-0.5">{dailyData.summary.pendingLeaveCount}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Table Card */}
          <Card accentTop>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#4B2E2E]" />
                  <span className="font-semibold text-xs text-stone-800">
                    Faculty Attendance Roster for {formatDateDisplay(selectedDate)}
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                    <Input
                      placeholder="Search teacher or department..."
                      value={dailySearch}
                      onChange={(e) => setDailySearch(e.target.value)}
                      className="pl-8 text-xs py-1 w-48"
                    />
                  </div>

                  <Select
                    value={dailyStatusFilter}
                    onChange={(e) => setDailyStatusFilter(e.target.value)}
                    className="text-xs py-1"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ABSENT">Absent / On Leave Only</option>
                    <option value="PRESENT">Present</option>
                    <option value="ON_LEAVE">Approved Leave</option>
                    <option value="UNRECORDED">Unrecorded</option>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingDaily ? (
                <div className="py-12 text-center text-xs text-stone-500">Loading daily attendance records...</div>
              ) : filteredDailyTeachers.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  No teacher records match the selected date or filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF9F5] border-b border-stone-200 text-[11px] font-semibold uppercase text-stone-600">
                      <tr>
                        <th className="py-3 px-4">Faculty Member</th>
                        <th className="py-3 px-4">Department &amp; Designation</th>
                        <th className="py-3 px-4">Daily Status</th>
                        <th className="py-3 px-4">Leave Category &amp; Recorded Reason</th>
                        <th className="py-3 px-4">Recorded By</th>
                        {isPrincipal && <th className="py-3 px-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredDailyTeachers.map((t) => {
                        const isAbsentOrLeave = t.status === 'ABSENT' || t.status === 'ON_LEAVE';

                        return (
                          <tr key={t.teacherId} className={`hover:bg-stone-50/70 transition-colors ${isAbsentOrLeave ? 'bg-rose-50/20' : ''}`}>
                            <td className="py-3 px-4 font-medium text-stone-900">
                              <div>{t.teacherName}</div>
                              <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                                {t.employeeCode || `ID #${t.teacherId}`}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-800">{t.departmentName || 'General Dept'}</div>
                              <div className="text-[11px] text-stone-500">{t.designation}</div>
                            </td>
                            <td className="py-3 px-4">
                              {t.status === 'PRESENT' && (
                                <Badge variant="success" size="sm">
                                  PRESENT
                                </Badge>
                              )}
                              {t.status === 'ABSENT' && (
                                <Badge variant="warning" size="sm" className="bg-rose-100 text-rose-800 border-rose-300">
                                  ABSENT
                                </Badge>
                              )}
                              {t.status === 'ON_LEAVE' && (
                                <Badge variant="neutral" size="sm" className="bg-purple-100 text-purple-800 border-purple-300">
                                  ON LEAVE
                                </Badge>
                              )}
                              {t.status === 'HALF_DAY' && (
                                <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-800 border-amber-300">
                                  HALF DAY
                                </Badge>
                              )}
                              {t.status === 'UNRECORDED' && (
                                <Badge variant="neutral" size="sm" className="bg-stone-100 text-stone-600 border-stone-300">
                                  UNRECORDED
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              {t.approvedLeave ? (
                                <div className="space-y-0.5">
                                  <div className="inline-block px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                                    {t.approvedLeave.leaveCategory} — Approved Leave
                                  </div>
                                  <div className="text-[11px] text-stone-700 italic">
                                    &quot;{t.approvedLeave.reason}&quot;
                                  </div>
                                  {t.approvedLeave.decisionRemarks && (
                                    <div className="text-[10px] text-stone-500">
                                      Remarks: {t.approvedLeave.decisionRemarks}
                                    </div>
                                  )}
                                </div>
                              ) : t.pendingLeave ? (
                                <div className="space-y-0.5">
                                  <div className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                    {t.pendingLeave.leaveCategory} — Pending Application
                                  </div>
                                  <div className="text-[11px] text-stone-600 italic">
                                    &quot;{t.pendingLeave.reason}&quot;
                                  </div>
                                </div>
                              ) : t.rejectedLeave ? (
                                <div className="space-y-0.5">
                                  <div className="inline-block px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                    {t.rejectedLeave.leaveCategory} — Rejected Application
                                  </div>
                                  <div className="text-[10px] text-stone-500">
                                    {t.rejectedLeave.decisionRemarks || 'No remarks'}
                                  </div>
                                </div>
                              ) : t.recordedReason ? (
                                <span className="text-stone-700 italic">&quot;{t.recordedReason}&quot;</span>
                              ) : (
                                <span className="text-stone-400 italic">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-stone-600 font-mono">
                              {t.recordedBy ? (
                                <div>
                                  <div>{t.recordedBy}</div>
                                  <div className="text-[10px] text-stone-400">
                                    {t.recordedAt ? new Date(t.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">—</span>
                              )}
                            </td>
                            {isPrincipal && (
                              <td className="py-3 px-4 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRecordModalTeacher(t);
                                    setRecordStatus(t.status === 'UNRECORDED' ? 'PRESENT' : t.status);
                                    setRecordReason(t.recordedReason || '');
                                  }}
                                  className="text-xs"
                                >
                                  Record / Correct
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LEAVE APPLICATIONS & APPROVALS
          ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Apply Form Card (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            <Card accentTop>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#4B2E2E]" />
                  <div>
                    <CardTitle>Submit Leave Application</CardTitle>
                    <CardDescription>
                      Apply for leave under official institutional categories with real-time rule enforcement.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <FormField id="apply-cat" label="Leave Category" required>
                    <Select
                      id="apply-cat"
                      value={applyCategory}
                      onChange={(e) => setApplyCategory(e.target.value)}
                    >
                      <option value="CL">CL — Casual Leave (15 Days)</option>
                      <option value="EL">EL — Earned Leave (30 Days)</option>
                      <option value="SPECIAL_SL">Special SL (15 Days)</option>
                      <option value="PATERNITY">Paternity Leave (7 Days)</option>
                      <option value="MATERNITY">Maternity Leave (6 Months)</option>
                    </Select>
                  </FormField>

                  {/* Category Rule Information Card */}
                  {selectedCategoryObj && (
                    <div className="p-3 bg-[#FAF9F5] border border-stone-200 rounded text-xs space-y-1">
                      <div className="font-bold text-[#4B2E2E]">{selectedCategoryObj.name} Rules</div>
                      <div className="text-stone-600 text-[11px] leading-relaxed">
                        {selectedCategoryObj.description}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <FormField id="apply-start" label="Start Date" required>
                      <Input
                        id="apply-start"
                        type="date"
                        value={applyStartDate}
                        min={minStartDate || undefined}
                        max={maxStartDate || undefined}
                        onChange={(e) => setApplyStartDate(e.target.value)}
                      />
                    </FormField>

                    <FormField id="apply-end" label="End Date" required>
                      <Input
                        id="apply-end"
                        type="date"
                        value={applyEndDate}
                        min={applyStartDate || minStartDate || undefined}
                        onChange={(e) => setApplyEndDate(e.target.value)}
                      />
                    </FormField>
                  </div>

                  {applyDurationDays > 0 && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 font-medium flex items-center justify-between">
                      <span>Requested Duration:</span>
                      <span className="font-bold text-sm">{applyDurationDays} Calendar Day(s)</span>
                    </div>
                  )}

                  <FormField
                    id="apply-reason"
                    label={selectedCategoryObj?.requiresReason ? 'Detailed Mandatory Reason' : 'Reason for Leave'}
                    required
                  >
                    <Textarea
                      id="apply-reason"
                      rows={3}
                      placeholder={
                        selectedCategoryObj?.requiresReason
                          ? 'Provide explicit medical / personal justification...'
                          : 'State purpose of leave application...'
                      }
                      value={applyReason}
                      onChange={(e) => setApplyReason(e.target.value)}
                    />
                  </FormField>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingApply}
                    className="w-full bg-[#4B2E2E] hover:bg-[#3B2424] text-white"
                  >
                    {isSubmittingApply ? 'Validating & Submitting...' : 'Submit Leave Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Applications List / Pending Queue (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <Card accentTop>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>
                      {isPrincipal ? 'Institutional Leave Approvals Workspace' : 'My Leave Applications'}
                    </CardTitle>
                    <CardDescription>
                      {isPrincipal
                        ? 'Review pending faculty leave applications, evaluate daily category limits, and process approvals.'
                        : 'Track submitted leave applications, principal decisions, and decision remarks.'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="text-xs py-1"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </Select>

                    <Button variant="outline" size="sm" onClick={fetchApplications}>
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApps ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoadingApps ? (
                  <div className="py-12 text-center text-xs text-stone-500">Loading leave applications...</div>
                ) : applications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-500">
                    No leave applications found matching current criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {applications
                      .filter((a) => (appStatusFilter === 'ALL' ? true : a.status === appStatusFilter))
                      .map((app) => {
                        const isPending = app.status === 'PENDING';

                        return (
                          <div key={app.id} className="p-4 hover:bg-stone-50/70 transition-colors space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                {isPrincipal && app.teacher_name && (
                                  <div className="font-bold text-stone-900 text-sm">{app.teacher_name}</div>
                                )}
                                <div className="text-xs text-stone-600 flex items-center gap-2 mt-0.5">
                                  <span className="font-semibold text-[#4B2E2E] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                    {app.leave_category || 'CL'}
                                  </span>
                                  <span>
                                    {formatDateDisplay(app.start_date)} — {formatDateDisplay(app.end_date)}
                                  </span>
                                  {app.department_name && (
                                    <span className="text-stone-400">• {app.department_name}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {app.status === 'APPROVED' && (
                                  <Badge variant="success" size="sm">
                                    APPROVED
                                  </Badge>
                                )}
                                {app.status === 'REJECTED' && (
                                  <Badge variant="warning" size="sm" className="bg-rose-100 text-rose-800 border-rose-300">
                                    REJECTED
                                  </Badge>
                                )}
                                {app.status === 'PENDING' && (
                                  <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-800 border-amber-300">
                                    PENDING APPROVAL
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="p-3 bg-[#FAF9F5] border border-stone-200 rounded text-xs text-stone-700">
                              <span className="font-semibold text-stone-900 block mb-0.5">Reason:</span>
                              &quot;{app.reason}&quot;
                            </div>

                            {app.decision_remarks && (
                              <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-200">
                                <span className="font-semibold text-stone-800">Decision Remarks:</span> {app.decision_remarks}
                              </div>
                            )}

                            {/* Principal Decision Action Box */}
                            {isPrincipal && isPending && (
                              <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                                <Input
                                  placeholder="Enter optional decision remarks..."
                                  value={decisionRemarksMap[app.id] || ''}
                                  onChange={(e) =>
                                    setDecisionRemarksMap({ ...decisionRemarksMap, [app.id]: e.target.value })
                                  }
                                  className="text-xs py-1 flex-1"
                                />

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDecideApplication(app.id, 'APPROVED')}
                                    disabled={isSubmittingDecision === app.id}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={() => handleDecideApplication(app.id, 'REJECTED')}
                                    disabled={isSubmittingDecision === app.id}
                                    className="bg-rose-700 hover:bg-rose-800 text-white text-xs"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LEAVE CATEGORIES & BALANCES
          ========================================================================= */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          <Card accentTop>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Official Leave Entitlements &amp; Balances</CardTitle>
                  <CardDescription>
                    Summary of annual leave entitlements, approved days used, pending days, and remaining available balances.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchBalances}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                  Refresh Balances
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isLoadingBalances ? (
                <div className="py-12 text-center text-xs text-stone-500">Loading leave balances...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {balances.map((b) => (
                    <div key={b.categoryCode} className="p-4 bg-[#FAF9F5] border border-stone-300 rounded-lg space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <span className="font-bold text-sm text-[#4B2E2E]">{b.categoryName}</span>
                        <span className="font-mono text-xs font-bold bg-stone-200 px-2 py-0.5 rounded text-stone-800">
                          {b.categoryCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded border border-stone-200">
                          <span className="text-[10px] text-stone-500 uppercase block font-semibold">Entitlement</span>
                          <span className="font-bold text-sm text-stone-900 mt-0.5 block">{b.entitlementDays}d</span>
                        </div>

                        <div className="p-2 bg-purple-50 rounded border border-purple-200">
                          <span className="text-[10px] text-purple-800 uppercase block font-semibold">Used</span>
                          <span className="font-bold text-sm text-purple-900 mt-0.5 block">{b.usedDays}d</span>
                        </div>

                        <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 uppercase block font-semibold">Remaining</span>
                          <span className="font-bold text-sm text-emerald-900 mt-0.5 block">{b.remainingDays}d</span>
                        </div>
                      </div>

                      {b.pendingDays > 0 && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                          Note: {b.pendingDays} day(s) currently pending approval.
                        </div>
                      )}

                      <div className="text-[10px] text-stone-500 italic leading-normal border-t border-stone-200 pt-2">
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MONTHLY REPORTS & INSTITUTIONAL HOLIDAYS
          ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <Card accentTop>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Monthly Teacher Attendance Reports &amp; Working Days</CardTitle>
                  <CardDescription>
                    Calculate working days, configure institutional holidays, finalize monthly attendance reports, and generate low-attendance notices.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Select
                    value={String(selectedMonth)}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="text-xs py-1"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((m, idx) => (
                      <option key={m} value={String(idx + 1)}>
                        {m}
                      </option>
                    ))}
                  </Select>

                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-20 text-xs py-1 font-mono"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMonthlyReports(selectedYear, selectedMonth)}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMonthly ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Working Days Calculation Summary */}
              {calendarCalc && (
                <div className="p-4 bg-[#FAF9F5] border border-stone-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Calendar Days</span>
                    <span className="text-lg font-bold text-stone-900 mt-0.5 block">{calendarCalc.daysInMonth} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Sundays Off</span>
                    <span className="text-lg font-bold text-stone-800 mt-0.5 block">{calendarCalc.sundaysCount} Sundays</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Declared Holidays</span>
                    <span className="text-lg font-bold text-purple-800 mt-0.5 block">{calendarCalc.additionalHolidaysCount} Holidays</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#4B2E2E] block">Net Working Days</span>
                    <span className="text-xl font-bold text-[#4B2E2E] mt-0.5 block">{calendarCalc.workingDays} Days</span>
                  </div>
                </div>
              )}

              {/* Add Holiday Form (Principal / Admin) */}
              {isPrincipal && (
                <form onSubmit={handleSaveHoliday} className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
                  <div className="font-bold text-xs text-stone-900">Declare Institutional Holiday</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField id="hol-date" label="Holiday Date" required>
                      <Input
                        id="hol-date"
                        type="date"
                        value={holidayDateInput}
                        onChange={(e) => setHolidayDateInput(e.target.value)}
                      />
                    </FormField>

                    <FormField id="hol-name" label="Holiday Name" required>
                      <Input
                        id="hol-name"
                        placeholder="e.g. Rajyotsava / Kannada Festival"
                        value={holidayNameInput}
                        onChange={(e) => setHolidayNameInput(e.target.value)}
                      />
                    </FormField>

                    <div className="flex items-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSavingHoliday}
                        className="w-full bg-[#4B2E2E] hover:bg-[#3B2424] text-white text-xs"
                      >
                        {isSavingHoliday ? 'Saving...' : 'Add Institutional Holiday'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Monthly Reports Table */}
              <div>
                <div className="font-bold text-xs text-stone-900 mb-3">
                  Faculty Monthly Attendance Summary ({monthlyReports.length} Records)
                </div>

                {isLoadingMonthly ? (
                  <div className="py-8 text-center text-xs text-stone-500">Loading monthly reports...</div>
                ) : monthlyReports.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500">No monthly attendance records for this period.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF9F5] border-b border-stone-200 text-[11px] font-semibold uppercase text-stone-600">
                        <tr>
                          <th className="py-2.5 px-3">Faculty Member</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3">Working Days</th>
                          <th className="py-2.5 px-3">Days Present</th>
                          <th className="py-2.5 px-3">Approved Leave</th>
                          <th className="py-2.5 px-3">Attendance %</th>
                          <th className="py-2.5 px-3">Report Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {monthlyReports.map((r) => (
                          <tr key={r.teacher_id} className="hover:bg-stone-50/70">
                            <td className="py-2.5 px-3 font-medium text-stone-900">
                              <div>{r.teacher_name}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{r.employee_code}</div>
                            </td>
                            <td className="py-2.5 px-3 text-stone-700">{r.department_name}</td>
                            <td className="py-2.5 px-3 font-mono">{r.total_working_days}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{r.days_present}</td>
                            <td className="py-2.5 px-3 font-mono text-purple-800">{r.approved_leave_days}d</td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              <span className={r.attendance_percentage < 75 ? 'text-rose-700 font-extrabold' : 'text-emerald-800'}>
                                {r.attendance_percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {r.status === 'FINALIZED' ? (
                                <Badge variant="success" size="sm">FINALIZED</Badge>
                              ) : (
                                <Badge variant="neutral" size="sm">PENDING</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Daily Attendance Modal */}
      {recordModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-stone-300 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#4B2E2E]">Record Daily Attendance</h3>
                <div className="text-[11px] text-stone-500">
                  {recordModalTeacher.teacherName} • {formatDateDisplay(selectedDate)}
                </div>
              </div>
              <button onClick={() => setRecordModalTeacher(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <FormField id="mod-status" label="Attendance Status" required>
              <Select
                id="mod-status"
                value={recordStatus}
                onChange={(e) => setRecordStatus(e.target.value as any)}
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="ON_LEAVE">ON LEAVE</option>
              </Select>
            </FormField>

            <FormField id="mod-reason" label="Recorded Reason / Explanation">
              <Input
                id="mod-reason"
                placeholder="e.g. Official OD duty / Personal absence"
                value={recordReason}
                onChange={(e) => setRecordReason(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setRecordModalTeacher(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDailyEntry}
                disabled={isSavingDaily}
                className="bg-[#4B2E2E] hover:bg-[#3B2424] text-white"
              >
                {isSavingDaily ? 'Saving...' : 'Save Daily Attendance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
