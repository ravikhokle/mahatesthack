import type { ReactNode } from 'react';

import { StudentShell } from '@/features/student/components/student-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
