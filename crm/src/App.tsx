import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { CrmLayout } from '@/components/layout/CrmLayout';
import { PermissionRoute } from '@/components/auth/PermissionRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { LeadsPage } from '@/pages/LeadsPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { EstimatesPage } from '@/pages/EstimatesPage';
import { JobsPage } from '@/pages/JobsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { InspectionsPage } from '@/pages/InspectionsPage';
import { FinancesPage } from '@/pages/FinancesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TasksPage } from '@/pages/TasksPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { WarrantiesPage } from '@/pages/WarrantiesPage';
import { MarketingPage } from '@/pages/MarketingPage';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary fallbackTitle="CRM Application Error">
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

          <Route element={<CrmLayout />}>
            <Route index element={<DashboardPage />} />
            
            <Route
              path="pipeline"
              element={
                <PermissionRoute permission="pipeline.view">
                  <PipelinePage />
                </PermissionRoute>
              }
            />
            <Route
              path="leads"
              element={
                <PermissionRoute permission="leads.view">
                  <LeadsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="clients"
              element={
                <PermissionRoute permission="leads.view">
                  <ClientsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="estimates"
              element={
                <PermissionRoute permission="estimates.view">
                  <EstimatesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <PermissionRoute permission="jobs.view">
                  <JobsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="calendar"
              element={
                <PermissionRoute permission="calendar.view">
                  <CalendarPage />
                </PermissionRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <PermissionRoute permission="calendar.view">
                  <TasksPage />
                </PermissionRoute>
              }
            />
            <Route
              path="reports"
              element={
                <PermissionRoute permission="reports.view">
                  <ReportsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="marketing"
              element={
                <PermissionRoute permission="reports.view">
                  <MarketingPage />
                </PermissionRoute>
              }
            />
            <Route
              path="inspections"
              element={
                <PermissionRoute permission="inspections.view">
                  <InspectionsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="finances"
              element={
                <PermissionRoute permission="finances.view">
                  <FinancesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="warranties"
              element={
                <PermissionRoute permission="warranties.view">
                  <WarrantiesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PermissionRoute permission="roles.view">
                  <SettingsPage />
                </PermissionRoute>
              }
            />
            <Route path="users" element={<Navigate to="/settings?tab=users" replace />} />
            <Route path="team" element={<Navigate to="/settings?tab=users" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
