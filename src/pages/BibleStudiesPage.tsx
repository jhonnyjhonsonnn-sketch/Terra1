import { useState, useEffect } from 'react';
import { supabase, type BibleStudy, type BibleStudyAnswer } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Send, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function BibleStudiesPage() {
  const { profile, refreshProfile } = useAuth();
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [answers, setAnswers] = useState<Record<string, BibleStudyAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    const [{ data: studiesData }, { data: answersData }] = await Promise.all([
      supabase.from('bible_studies').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('bible_study_answers').select('*').eq('user_id', profile.id),
    ]);

    setStudies((studiesData || []) as BibleStudy[]);
    const ansMap: Record<string, BibleStudyAnswer> = {};
    (answersData || []).forEach((a: any) => { ansMap[a.study_id] = a; });
    setAnswers(ansMap);
    setLoading(false);
  }

  async function submitAnswer(study: BibleStudy) {
    if (!profile) return;
    const text = responseTexts[study.id];
    if (!text || !text.trim()) return;
    setSubmittingId(study.id);

    const { data, error } = await supabase.from('bible_study_answers').insert({
      user_id: profile.id,
      study_id: study.id,
      answer_text: text,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        // Already answered
      } else {
        console.error(error);
      }
      setSubmittingId(null);
      return;
    }

    setAnswers((prev) => ({ ...prev, [study.id]: data as BibleStudyAnswer }));
    setSubmittingId(null);
    await refreshProfile();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Estudos Bíblicos</h1>
        <p className="text-neutral-500">Estude em casa e responda no app para ganhar pontos</p>
      </div>

      <div className="space-y-4">
        {studies.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-400">Nenhum estudo disponível ainda</p>
          </div>
        )}

        {studies.map((study) => {
          const answered = answers[study.id];
          const isExpanded = expandedId === study.id;
          return (
            <div key={study.id} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-slide-up">
              <button
                onClick={() => setExpandedId(isExpanded ? null : study.id)}
                className="w-full bg-gradient-to-r from-primary-700 to-primary-900 p-6 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-accent-300" />
                    <div>
                      <h2 className="font-serif text-xl text-white">{study.title}</h2>
                      {study.bible_ref && <p className="text-accent-300 text-sm">{study.bible_ref}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {answered && <CheckCircle2 className="w-5 h-5 text-accent-300" />}
                    <span className="text-accent-300 text-sm font-medium">+{study.points} pts</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 space-y-4">
                  {study.description && <p className="text-neutral-600">{study.description}</p>}
                  {study.content && (
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{study.content}</p>
                    </div>
                  )}

                  <div className="bg-primary-50 rounded-xl p-4">
                    <h3 className="font-semibold text-primary-800 mb-2">Pergunta:</h3>
                    <p className="text-neutral-700">{study.question}</p>
                  </div>

                  {answered ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary-700 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        Sua resposta:
                      </div>
                      <p className="text-neutral-700 bg-neutral-50 rounded-xl p-4">{answered.answer_text}</p>
                      <p className="text-sm text-accent-700 font-medium">+{study.points} pontos ganhos!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={responseTexts[study.id] || ''}
                        onChange={(e) => setResponseTexts((prev) => ({ ...prev, [study.id]: e.target.value }))}
                        rows={4}
                        placeholder="Escreva sua resposta..."
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                      />
                      <button
                        onClick={() => submitAnswer(study)}
                        disabled={submittingId === study.id || !(responseTexts[study.id] || '').trim()}
                        className="w-full py-3 bg-primary-800 text-white font-medium rounded-xl hover:bg-primary-900 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submittingId === study.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar resposta (+{study.points} pts)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
