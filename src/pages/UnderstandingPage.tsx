import { useState, useEffect } from 'react';
import { supabase, type Understanding } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Brain, Send, Loader2, CheckCircle2, Calendar } from 'lucide-react';

export default function UnderstandingPage() {
  const { profile, refreshProfile } = useAuth();
  const [todayEntry, setTodayEntry] = useState<Understanding | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('understandings')
      .select('*')
      .eq('user_id', profile.id)
      .eq('understanding_date', today)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (data) {
          setTodayEntry(data as Understanding);
          setSummary(data.summary);
        }
        setLoading(false);
      });
  }, [profile]);

  async function handleSubmit() {
    if (!profile || !summary.trim()) return;
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('understandings').insert({
      user_id: profile.id,
      summary,
      understanding_date: today,
      points_awarded: 15,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        // Already submitted today
      } else {
        console.error(error);
      }
      setSubmitting(false);
      return;
    }

    setTodayEntry(data as Understanding);
    setSubmitting(false);
    await refreshProfile();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Entendimento do Dia</h1>
        <p className="text-neutral-500 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-neutral-800">Resumo do seu dia</h2>
            <p className="text-sm text-neutral-500">Vale 15 pontos para o ranking</p>
          </div>
        </div>

        {todayEntry ? (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-2 text-primary-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Você já registrou seu entendimento hoje!</span>
            </div>
            <div>
              <h3 className="font-medium text-neutral-800 mb-2">Seu resumo:</h3>
              <p className="text-neutral-700 leading-relaxed bg-neutral-50 rounded-xl p-4">{todayEntry.summary}</p>
            </div>
            <p className="text-sm text-accent-700 font-medium">+{todayEntry.points_awarded} pontos ganhos!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-neutral-600">Faça um resumo geral do que você entendeu hoje — sobre o devocional, as tarefas, os estudos bíblicos, ou o que Deus te falou.</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              placeholder="Escreva aqui o que você entendeu e aprendeu hoje..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !summary.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-primary-700 to-primary-900 text-white font-medium rounded-xl hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Registrar entendimento (+15 pts)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
