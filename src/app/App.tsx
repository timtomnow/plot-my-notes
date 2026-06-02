import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { NewEntry } from '@/pages/NewEntry';
import { Entries } from '@/pages/Entries';
import { Charts } from '@/pages/Charts';
import { Axes } from '@/pages/Axes';
import { TrackingTypes } from '@/pages/TrackingTypes';
import { Settings } from '@/pages/Settings';
import { Reminders } from '@/pages/Reminders';
import { HelpIndex, HelpAll, HelpSectionPage, GuidePage } from '@/pages/Help';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from './theme';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewEntry />} />
            <Route path="/new/:trackingTypeId" element={<NewEntry />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/axes" element={<Axes />} />
            <Route path="/settings/tracking-types" element={<TrackingTypes />} />
            <Route path="/settings/reminders" element={<Reminders />} />
            <Route path="/help" element={<HelpIndex />} />
            <Route path="/help/all" element={<HelpAll />} />
            <Route path="/help/section/:section" element={<HelpSectionPage />} />
            <Route path="/help/:slug" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}
