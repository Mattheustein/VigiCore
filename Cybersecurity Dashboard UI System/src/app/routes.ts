/**
 * Application Route Definitions
 * ==============================
 * Defines the full client-side routing tree using React Router v7.
 *
 * Route Hierarchy:
 *   /                    → LoginPage (public, unauthenticated entry)
 *   /dashboard           → DashboardLayout (sidebar + topbar shell)
 *     /dashboard         → MainDashboard (index route)
 *     /dashboard/auth-logs           → AuthLogsPage
 *     /dashboard/suspicious-activity → SuspiciousActivityPage
 *     /dashboard/ip-intelligence     → IPIntelligencePage
 *     /dashboard/alerts              → AlertsPage
 *     /dashboard/system-health       → SystemHealthPage
 *     /dashboard/network             → NetworkTrafficPage
 *     /dashboard/rules               → DetectionRulesPage
 *     /dashboard/settings            → SettingsPage
 *
 * NOTE: No route guards are currently implemented. All dashboard routes
 * are accessible without authentication checks at the router level.
 */
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
import { NetworkTrafficPage } from './pages/NetworkTrafficPage';
import { DetectionRulesPage } from './pages/DetectionRulesPage';

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
        path: 'network',
        Component: NetworkTrafficPage,
      },
      {
        path: 'rules',
        Component: DetectionRulesPage,
      },
      {
        path: 'settings',
        Component: SettingsPage,
      },
    ],
  },
]);
