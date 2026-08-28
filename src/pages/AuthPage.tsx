import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { VideoBackground } from '@/components/VideoBackground';
import { Church, Loader2, Lock, Mail, User, Target } from 'lucide-react';

export default function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dailyGoal, setDailyGoal] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [churchName, setChurchName] = useState('');
  const [tagline, setTagline] = useState('');

  useEffect(() => {
    supabase.from('app_settings').select('church_name, tagline').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setChurchName((data as any).church_name || '');
        setTagline((data as any).tagline || '');
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (Number(dailyGoal) < 1) {
          setError('A meta diária deve ser de pelo menos 1 tarefa');
          setLoading(false);
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              daily_goal: Number(dailyGoal),
            },
          },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          await supabase.from('profiles').update({ daily_goal: Number(dailyGoal) }).eq('id', data.user.id);
          setError('Conta criada! Faça login para continuar.');
          setMode('signin');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <VideoBackground source="login" overlayOpacity={0.88} />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-2xl mb-4 ring-1 ring-primary-400/30">
            <Church className="w-10 h-10 text-accent-300" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl text-white tracking-wide">{churchName || 'Terra Santa'}</h1>
          <p className="text-primary-200 mt-2 text-sm">{tagline || 'Aproximando jovens de Deus'}</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 animate-slide-up">
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-white text-primary-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-primary-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Meta diária (tarefas por dia)</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="30"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                      placeholder="Quantas tarefas quer fazer por dia?"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="voce@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 animate-scale-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-700 to-primary-900 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-900/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          Compromisso com Deus e com a comunidade
        </p>
      </div>
    </div>
  );
}
