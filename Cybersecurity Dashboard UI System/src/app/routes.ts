import { createBrowserRouter } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { MainDashboard } from './pages/MainDashboard';
import { AuthLogsPage } from './pages/AuthLogsPage';
import { SuspiciousActivityPage } from './pages/SuspiciousActivityPage';
import { IPIntelligencePage } from './pages/IPIntelligencePage';
import { AlertsPage } from './pages/AlertsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/dashboard',
    Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: MainDashboard,
      },
      {
        path: 'auth-logs',
        Component: AuthLogsPage,
      },
      {
        path: 'suspicious-activity',
        Component: SuspiciousActivityPage,
      },
      {
        path: 'ip-intelligence',
        Component: IPIntelligencePage,
      },
      {
        path: 'alerts',
        Component: AlertsPage,
      },
      {
        path: 'system-health',
        Component: SystemHealthPage,
      },
      {
        path: 'settings',
        Component: SettingsPage,
      },
    ],
  },
]);
