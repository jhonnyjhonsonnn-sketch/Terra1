import { useState, useEffect } from 'react';
import { supabase, type Devotional } from '@/lib/supabase';
import { BookOpen, Calendar } from 'lucide-react';

export default function DevotionalPage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('devotionals')
      .select('*')
      .order('display_date', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (data) setDevotional(data as Devotional);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  if (!devotional) {
    return (
      <div className="min-h-screen p-6 lg:p-10 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-400">Nenhum devocional disponível ainda. Volte amanhã!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Devocional do Dia</h1>
        <p className="text-neutral-500 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(devotional.display_date || devotional.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-br from-primary-700 to-primary-950 p-8">
          <BookOpen className="w-10 h-10 text-accent-300 mb-3" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl text-white mb-2">{devotional.title}</h2>
          {devotional.bible_ref && <p className="text-accent-300 font-medium">{devotional.bible_ref}</p>}
        </div>

        <div className="p-8 space-y-6">
          {devotional.verse_text && (
            <blockquote className="border-l-4 border-primary-400 pl-4 italic text-neutral-700 text-lg leading-relaxed">
              "{devotional.verse_text}"
            </blockquote>
          )}

          {devotional.message && (
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">Mensagem</h3>
              <p className="text-neutral-600 leading-relaxed">{devotional.message}</p>
            </div>
          )}

          {devotional.reflection_question && (
            <div className="bg-primary-50 rounded-xl p-5">
              <h3 className="font-semibold text-primary-800 mb-2">Reflexão</h3>
              <p className="text-neutral-700">{devotional.reflection_question}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
