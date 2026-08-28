import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase, type AppSettings } from '@/lib/supabase';
import { VideoBackground } from '@/components/VideoBackground';
import { Church, Home, Trophy, Target, Gift, Settings, LogOut, Menu, X, BookOpen, Heart, CheckSquare, MapPin, Brain, User, GraduationCap } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as AppSettings);
    });
  }, []);

  const navItems = [
    { to: '/app', label: 'Início', icon: Home },
    { to: '/app/devocional', label: 'Devocional', icon: BookOpen },
    { to: '/app/oracao', label: 'Oração', icon: Heart },
    { to: '/app/tarefas', label: 'Tarefas', icon: CheckSquare },
    { to: '/app/entendimento', label: 'Entendimento', icon: Brain },
    { to: '/app/estudos', label: 'Estudos Bíblicos', icon: GraduationCap },
    { to: '/app/saidas', label: 'Saídas', icon: MapPin },
    { to: '/app/ranking', label: 'Ranking', icon: Trophy },
    { to: '/app/desafios', label: 'Desafios', icon: Target },
    { to: '/app/recompensas', label: 'Recompensas', icon: Gift },
    { to: '/app/perfil', label: 'Perfil', icon: User },
  ];

  if (profile?.is_admin) {
    navItems.push({ to: '/app/admin', label: 'Painel', icon: Settings });
  }

  return (
    <div className="min-h-screen relative">
      {/* Global video background behind all app content */}
      <VideoBackground source="app" overlayOpacity={0.92} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-primary-950/95 backdrop-blur-md text-white flex-col z-30 hidden lg:flex border-r border-primary-800/30">
        <div className="p-6 border-b border-primary-800/50">
          <Link to="/app" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center ring-1 ring-primary-400/20">
              <Church className="w-6 h-6 text-accent-300" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-xl leading-tight">{settings?.church_name || 'Terra Santa'}</h1>
              <p className="text-xs text-primary-300">{settings?.tagline || ''}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-primary-800 text-white shadow-lg'
                    : 'text-primary-200 hover:bg-primary-900/70 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-accent-300">{profile?.total_points} pts</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-primary-200 hover:bg-primary-900 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 bg-primary-950/95 backdrop-blur-md text-white px-4 py-3 flex items-center justify-between border-b border-primary-800/30">
        <Link to="/app" className="flex items-center gap-2">
          <Church className="w-6 h-6 text-accent-300" strokeWidth={1.5} />
          <span className="font-serif text-lg">{settings?.church_name || 'Terra Santa'}</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 pt-16 bg-primary-950/98 backdrop-blur-md animate-fade-in overflow-y-auto">
          <nav className="px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                    active ? 'bg-primary-800 text-white' : 'text-primary-200 hover:bg-primary-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-primary-800/50 pt-4 mt-4">
              <div className="flex items-center gap-3 px-4 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-accent-300">{profile?.total_points} pts</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-primary-200 hover:bg-primary-900"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen relative z-10">
        <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
