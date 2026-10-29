import React from 'react';
import { LeaveManagementView } from './LeaveManagementView';

export const AttendanceManagementView: React.FC = () => {
  return <LeaveManagementView initialTab="monthly" />;
};
