import React, { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  ArrowRight,
  LogIn,
  Award,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { NavigationItemKey } from '../types';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../config/permissions';
import { CollegeLogo } from '../components/ui/CollegeLogo';

export interface WelcomeViewProps {
  onNavigate: (tab: NavigationItemKey) => void;
}

interface DashboardStats {
  studentCount?: number;
  teacherCount?: number;
  departmentCount?: number;
  userCount?: number;
  feeStats?: {
    totalCollected: number;
    pendingTransfersCount: number;
  };
  iaPendingOfficeApprovals?: number;
  univExamResultsCount?: number;
  libraryStats?: {
    totalBooks: number;
    availableCopies: number;
    activeIssues: number;
    overdueCount: number;
  };
  leaveStats?: {
    pendingLeaves: number;
    todayAbsences: number;
  };
  facultyStats?: {
    pendingApplications: number;
  };
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate }) => {
  const { user, openLoginModal } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const showUsers = Boolean(user && canAccessModule(user.role, 'user_mgmt'));
  const showFees = Boolean(user && canAccessModule(user.role, 'fees_mgmt'));
  const showStudents = Boolean(user && canAccessModule(user.role, 'student_records'));
  const showTeachers = Boolean(user && canAccessModule(user.role, 'teacher_records'));
  const showMarks = Boolean(user && canAccessModule(user.role, 'marks_mgmt'));
  const showUnivExams = Boolean(user && canAccessModule(user.role, 'univ_exams'));
  const showDept = Boolean(user && canAccessModule(user.role, 'dept_portal'));
  const showLibrary = Boolean(user && canAccessModule(user.role, 'library_mgmt'));
  const showLeave = Boolean(user && canAccessModule(user.role, 'leave_mgmt'));
  const showAttendance = Boolean(user && canAccessModule(user.role, 'attendance_mgmt'));

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      setIsLoadingStats(true);
      fetch('/api/dashboard/stats')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStats(data);
          }
        })
        .catch(() => {
          // Ignore background stats load errors gracefully
        })
        .finally(() => {
          setIsLoadingStats(false);
        });
    } else {
      setStats(null);
    }
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Institutional Banner Header */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-[#D4AF37]/40 shadow-xs">
            <CollegeLogo size="md" className="w-full h-full" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-tight">
              Krishna Ayurvedic Medical College &amp; Hospital
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Institutional Enterprise Resource Planning
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <a
            href="/library-catalogue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Public Book Catalogue</span>
          </a>

          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant="institutional" size="sm">
                {user.roleName}
              </Badge>
              {user.departmentName && (
                <Badge variant="gold" size="sm">
                  {user.departmentName}
                </Badge>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />}
              onClick={openLoginModal}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Unauthenticated Landing Card */}
      {!user && (
        <Card accentTop>
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h2 className="font-serif text-base font-bold text-[#4B2E2E]">
                Authorized Institutional Access
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Sign in with your assigned institutional username or email address to access permitted administrative and academic modules.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<LogIn className="w-4 h-4 text-[#D4AF37]" />}
              onClick={openLoginModal}
            >
              Sign In to KAMCH ERP
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Faculty Profile Card & Quick Actions */}
      {user && user.role === 'FACULTY' && !user.mustChangePassword && (
        <Card accentTop className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Faculty Member Workspace</CardTitle>
                <p className="text-xs text-stone-500">
                  Linked Institutional Teacher Account
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-[#FAF9F5] rounded-xl border border-stone-200/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    {user.fullName}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {user.teacherDesignation || 'Faculty Member'}
                    {user.departmentName ? ` · Department of ${user.departmentName}` : ''}
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Active Profile
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Username</span>
                  <span className="font-mono text-stone-800 font-semibold">{user.username}</span>
                </div>
                {user.teacherEmployeeCode && (
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">Employee Code</span>
                    <span className="font-mono text-stone-800 font-semibold">{user.teacherEmployeeCode}</span>
                  </div>
                )}
                {user.teacherCode && (
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">Teacher Code (NCISM)</span>
                    <span className="font-mono text-stone-800 font-semibold">{user.teacherCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions for Faculty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {showLeave && (
                <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-stone-900 font-bold text-xs font-serif">
                      <Calendar className="w-4 h-4 text-[#4B2E2E]" />
                      <span>Leave Management</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      Apply for leave, check leave balances, and track approval status.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    onClick={() => onNavigate('leave_mgmt')}
                  >
                    Open Leave Portal
                  </Button>
                </div>
              )}

              {showAttendance && (
                <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-stone-900 font-bold text-xs font-serif">
                      <Clock className="w-4 h-4 text-[#4B2E2E]" />
                      <span>Attendance Reports</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      Review recorded daily attendance, absence logs, and monthly reports.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    onClick={() => onNavigate('attendance_mgmt')}
                  >
                    View Attendance Logs
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authenticated Operational Module Cards */}
      {user && user.role !== 'FACULTY' && !user.mustChangePassword && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Fees Management */}
          {showFees && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Fees Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Student fee assessments, cash and bank-transfer collections, passbook verification, receipts, and financial reports.
                  </p>
                  {stats?.feeStats && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Verified Collected</span>
                        <span className="text-xs font-bold text-emerald-800">
                          {formatCurrency(stats.feeStats.totalCollected)}
                        </span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Pending Transfers</span>
                        <span className="text-xs font-bold text-amber-800">
                          {stats.feeStats.pendingTransfersCount} Pending
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('fees_mgmt')}
                >
                  Open Fees Management
                </Button>
              </div>
            </Card>
          )}

          {/* User Management */}
          {showUsers && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>User Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Account creation, bulk teacher/dept provisioning, role assignment, suspension, password resets, and security audit logs.
                  </p>
                  {typeof stats?.userCount === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">Active Accounts</span>
                      <span className="font-bold text-stone-900 font-mono">{stats.userCount} Users</span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('user_mgmt')}
                >
                  Open User Management
                </Button>
              </div>
            </Card>
          )}

          {/* Student Management */}
          {showStudents && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <GraduationCap className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Student Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Central student registry across RS6 and RS7 cohorts, roll numbers, academic progression, internship tracking, and fee summaries.
                  </p>
                  {typeof stats?.studentCount === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">Active Enrolled Students</span>
                      <span className="font-bold text-stone-900 font-mono">{stats.studentCount} Students</span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('student_records')}
                >
                  Open Student Management
                </Button>
              </div>
            </Card>
          )}

          {/* Teacher Records */}
          {showTeachers && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <Briefcase className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Teacher Records</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Institutional registry of faculty and teaching staff across college departments.
                  </p>
                  {typeof stats?.teacherCount === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">Active Faculty Members</span>
                      <span className="font-bold text-stone-900 font-mono">{stats.teacherCount} Teachers</span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('teacher_records')}
                >
                  Open Teacher Records
                </Button>
              </div>
            </Card>
          )}

          {/* Internal Assessment */}
          {showMarks && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Internal Assessment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Internal examination mark entry, NCISM 20%/80% rules, departmental verification, and office approvals.
                  </p>
                  {typeof stats?.iaPendingOfficeApprovals === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">Pending Office Approvals</span>
                      <span className="font-bold text-amber-800 font-mono">
                        {stats.iaPendingOfficeApprovals} Pending
                      </span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('marks_mgmt')}
                >
                  Open Internal Assessment
                </Button>
              </div>
            </Card>
          )}

          {/* University Exams */}
          {showUnivExams && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>University Examinations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Professional year examination records, university result entry, finalization, promotion preview, and batch-wise mark sheets.
                  </p>
                  {typeof stats?.univExamResultsCount === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">Exam Results Recorded</span>
                      <span className="font-bold text-stone-900 font-mono">{stats.univExamResultsCount} Records</span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('univ_exams')}
                >
                  Open University Exams
                </Button>
              </div>
            </Card>
          )}

          {/* Department Workspace */}
          {showDept && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Department Workspace</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Departmental overview, subject assignments, and assigned department faculty records.
                  </p>
                  {typeof stats?.departmentCount === 'number' && (
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">College Departments</span>
                      <span className="font-bold text-stone-900 font-mono">{stats.departmentCount} Depts</span>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('dept_portal')}
                >
                  Open Department Workspace
                </Button>
              </div>
            </Card>
          )}

          {/* Library */}
          {showLibrary && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Library Workspace</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Accession register, category cataloging, book issuance and returns, overdue tracking, and student library history.
                  </p>
                  {stats?.libraryStats && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Total Volumes</span>
                        <span className="font-bold text-stone-900 font-mono">{stats.libraryStats.totalBooks}</span>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Active Issues</span>
                        <span className="font-bold text-amber-800 font-mono">{stats.libraryStats.activeIssues}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onNavigate('library_mgmt')}
                >
                  Open Library Workspace
                </Button>
              </div>
            </Card>
          )}

          {/* Teacher Attendance & Leave */}
          {(showLeave || showAttendance) && (
            <Card accentTop className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4B2E2E]/10 flex items-center justify-center text-[#4B2E2E]">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle>Teacher Attendance &amp; Leave</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Unified workspace for teacher leave application approvals, balance tracking, and daily attendance recording.
                  </p>
                  {stats?.leaveStats && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Pending Approvals</span>
                        <span className="font-bold text-amber-800 font-mono">{stats.leaveStats.pendingLeaves}</span>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                        <span className="text-[10px] text-stone-500 font-medium block">Today's Absences</span>
                        <span className="font-bold text-stone-900 font-mono">{stats.leaveStats.todayAbsences}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-5 pt-0 flex flex-col gap-2">
                {showLeave && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    onClick={() => onNavigate('leave_mgmt')}
                  >
                    Open Leave Management
                  </Button>
                )}
                {showAttendance && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => onNavigate('attendance_mgmt')}
                  >
                    View Attendance Reports
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
