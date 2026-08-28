import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthPage from '@/pages/AuthPage';
import AppLayout from '@/components/AppLayout';
import HomePage from '@/pages/HomePage';
import RankingPage from '@/pages/RankingPage';
import ChallengesPage from '@/pages/ChallengesPage';
import RewardsPage from '@/pages/RewardsPage';
import AdminPanel from '@/pages/AdminPanel';
import ProfilePage from '@/pages/ProfilePage';
import DevotionalPage from '@/pages/DevotionalPage';
import PrayerPage from '@/pages/PrayerPage';
import TasksPage from '@/pages/TasksPage';
import OutingsPage from '@/pages/OutingsPage';
import UnderstandingPage from '@/pages/UnderstandingPage';
import BibleStudiesPage from '@/pages/BibleStudiesPage';
import { Loader2 } from 'lucide-react';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/app" element={<HomePage />} />
        <Route path="/app/devocional" element={<DevotionalPage />} />
        <Route path="/app/oracao" element={<PrayerPage />} />
        <Route path="/app/tarefas" element={<TasksPage />} />
        <Route path="/app/entendimento" element={<UnderstandingPage />} />
        <Route path="/app/estudos" element={<BibleStudiesPage />} />
        <Route path="/app/saidas" element={<OutingsPage />} />
        <Route path="/app/ranking" element={<RankingPage />} />
        <Route path="/app/desafios" element={<ChallengesPage />} />
        <Route path="/app/recompensas" element={<RewardsPage />} />
        <Route path="/app/perfil" element={<ProfilePage />} />
        <Route path="/app/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <PWAInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
