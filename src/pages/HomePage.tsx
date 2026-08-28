import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase, type AppSettings } from '@/lib/supabase';
import { Trophy, Target, Gift, Flame, TrendingUp, ChevronRight, Play, Church, BookOpen, Heart, CheckSquare, MapPin, Brain, GraduationCap, User } from 'lucide-react';

export default function HomePage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as AppSettings);
    });

    supabase
      .from('completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile?.id || '')
      .then(({ count }) => setCompletedCount(count || 0));

    supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setTotalActivities(count || 0));

    // Calculate rank
    supabase
      .from('profiles')
      .select('id, total_points')
      .then(({ data }) => {
        if (!data || !profile) return;
        const sorted = [...data].sort((a, b) => b.total_points - a.total_points);
        const idx = sorted.findIndex((p) => p.id === profile.id);
        setRank(idx + 1);
      });
  }, [profile]);

  return (
    <div className="min-h-screen">
      {/* Hero section with video/image background */}
      <section className="relative h-[420px] overflow-hidden">
        {settings?.hero_video_url ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={settings.hero_video_url} type="video/mp4" />
          </video>
        ) : settings?.hero_image_url ? (
          <img src={settings.hero_image_url} alt="Igreja" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-950 to-neutral-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/95 via-primary-950/60 to-primary-950/30" />

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
          <div className="animate-fade-in">
            <Church className="w-12 h-12 text-accent-300 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">
              {settings?.church_name || 'Terra Santa'}
            </h1>
            <p className="text-primary-100 text-lg max-w-md mx-auto">
              {settings?.tagline || 'Aproximando jovens de Deus'}
            </p>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Flame}
            label="Seus pontos"
            value={profile?.total_points?.toString() || '0'}
            color="from-accent-500 to-accent-700"
          />
          <StatCard
            icon={Trophy}
            label="Sua posição"
            value={rank ? `#${rank}` : '-'}
            color="from-primary-600 to-primary-800"
          />
          <StatCard
            icon={Target}
            label="Desafios concluídos"
            value={`${completedCount}/${totalActivities}`}
            color="from-primary-500 to-primary-700"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-serif text-2xl text-neutral-800 mb-6">Continue sua jornada</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <QuickAction to="/app/devocional" icon={BookOpen} title="Devocional do dia" desc="Mensagem e reflexão diária" color="bg-primary-600" />
          <QuickAction to="/app/oracao" icon={Heart} title="Mural de oração" desc="Compartilhe seus pedidos" color="bg-accent-600" />
          <QuickAction to="/app/tarefas" icon={CheckSquare} title="Tarefas diárias" desc="30 tarefas bíblicas com pontos" color="bg-primary-700" />
          <QuickAction to="/app/entendimento" icon={Brain} title="Entendimento do dia" desc="Resuma o que você aprendeu" color="bg-primary-600" />
          <QuickAction to="/app/estudos" icon={GraduationCap} title="Estudos bíblicos" desc="Estude e responda no app" color="bg-accent-600" />
          <QuickAction to="/app/saidas" icon={MapPin} title="Saídas" desc="Confirme presença via WhatsApp" color="bg-primary-700" />
          <QuickAction to="/app/desafios" icon={Target} title="Desafios" desc="Ganhe pontos com atividades" color="bg-primary-600" />
          <QuickAction to="/app/ranking" icon={TrendingUp} title="Ranking" desc="Compare seu progresso" color="bg-accent-600" />
          <QuickAction to="/app/recompensas" icon={Gift} title="Recompensas" desc="Troque pontos por prêmios" color="bg-primary-700" />
          <QuickAction to="/app/perfil" icon={User} title="Meu perfil" desc="Veja suas informações" color="bg-primary-600" />
        </div>
      </section>

      {/* Motivational section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-950 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Play className="w-10 h-10 text-accent-300 mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-white mb-4">Um compromisso diário</h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Cada desafio é uma oportunidade de crescer na fé e fortalecer o vínculo com a comunidade.
            Pequenos passos diários constroem uma vida de propósito.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 animate-slide-up">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-800">{value}</p>
        <p className="text-sm text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc, color }: { to: string; icon: any; title: string; desc: string; color: string }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-neutral-800 mb-1 flex items-center justify-between">
        {title}
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
      </h3>
      <p className="text-sm text-neutral-500">{desc}</p>
    </Link>
  );
}
