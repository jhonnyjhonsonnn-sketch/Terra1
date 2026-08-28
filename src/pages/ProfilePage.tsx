import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { uploadFile } from '@/lib/upload';
import { Camera, Save, Loader2, Target, Phone, Award, Calendar, CheckCircle2, User } from 'lucide-react';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [dailyGoal, setDailyGoal] = useState(String(profile?.daily_goal || 1));
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ completions: 0, understandings: 0, bibleStudies: 0, dailyTasks: 0, prayers: 0, claims: 0, rank: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      setDailyGoal(String(profile.daily_goal || 1));
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('completions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('understandings').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('bible_study_answers').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('daily_task_completions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('prayer_requests').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('claims').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('profiles').select('id, total_points'),
    ]).then((results) => {
      setStats({
        completions: results[0].count || 0,
        understandings: results[1].count || 0,
        bibleStudies: results[2].count || 0,
        dailyTasks: results[3].count || 0,
        prayers: results[4].count || 0,
        claims: results[5].count || 0,
        rank: 0,
      });
      const allProfiles = results[6].data as { id: string; total_points: number }[];
      if (allProfiles) {
        const sorted = [...allProfiles].sort((a, b) => b.total_points - a.total_points);
        const idx = sorted.findIndex((p) => p.id === profile.id);
        setStats((prev) => ({ ...prev, rank: idx + 1 }));
      }
    });
  }, [profile]);

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    const url = await uploadFile(file, 'avatars');
    if (url) setAvatarUrl(url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, daily_goal: Number(dailyGoal), avatar_url: avatarUrl })
      .eq('id', profile?.id);
    if (error) { console.error(error); setSaving(false); return; }
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!profile) return null;

  const statCards = [
    { label: 'Pontos', value: profile.total_points, icon: Award, color: 'from-accent-500 to-accent-700' },
    { label: 'Posição', value: `#${stats.rank}`, icon: Target, color: 'from-primary-600 to-primary-800' },
    { label: 'Desafios', value: stats.completions, icon: CheckCircle2, color: 'from-primary-500 to-primary-700' },
    { label: 'Tarefas diárias', value: stats.dailyTasks, icon: Calendar, color: 'from-primary-600 to-primary-800' },
    { label: 'Entendimentos', value: stats.understandings, icon: CheckCircle2, color: 'from-accent-500 to-accent-700' },
    { label: 'Estudos bíblicos', value: stats.bibleStudies, icon: CheckCircle2, color: 'from-primary-500 to-primary-700' },
    { label: 'Pedidos de oração', value: stats.prayers, icon: Target, color: 'from-primary-600 to-primary-800' },
    { label: 'Resgates', value: stats.claims, icon: Award, color: 'from-accent-500 to-accent-700' },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Meu Perfil</h1>
        <p className="text-neutral-500">Suas informações e estatísticas</p>
      </div>

      {/* Avatar + edit form */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : fullName?.charAt(0).toUpperCase() || '?'}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center shadow-lg hover:bg-primary-800"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-neutral-800">{profile.full_name || 'Anônimo'}</h2>
            <p className="text-sm text-neutral-500">{profile.total_points} pontos • {stats.rank > 0 ? `#${stats.rank}` : '-'} no ranking</p>
            {profile.is_admin && <span className="inline-block mt-1 text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full font-medium">Administrador</span>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Meta diária (tarefas por dia)</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input type="number" min="1" max="30" value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-primary-700 to-primary-900 text-white font-medium rounded-xl hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-neutral-800">{s.value}</p>
              <p className="text-xs text-neutral-500">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
