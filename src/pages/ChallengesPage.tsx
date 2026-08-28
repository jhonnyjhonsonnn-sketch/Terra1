import { useEffect, useState } from 'react';
import { supabase, type Section, type Activity } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Plus, Loader2 } from 'lucide-react';

type ActivityWithCompletion = Activity & { completed: boolean };

export default function ChallengesPage() {
  const { profile } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [activitiesBySection, setActivitiesBySection] = useState<Record<string, ActivityWithCompletion[]>>({});
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    const [{ data: sectionsData }, { data: activitiesData }, { data: completions }] = await Promise.all([
      supabase.from('sections').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('activities').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('completions').select('activity_id').eq('user_id', profile?.id || ''),
    ]);

    const completedIds = new Set((completions || []).map((c) => c.activity_id));
    const sections = (sectionsData || []) as Section[];
    const grouped: Record<string, ActivityWithCompletion[]> = {};

    (activitiesData || []).forEach((a) => {
      const act = a as Activity;
      const sectionId = act.section_id || 'uncategorized';
      if (!grouped[sectionId]) grouped[sectionId] = [];
      grouped[sectionId].push({ ...act, completed: completedIds.has(act.id) });
    });

    setSections(sections);
    setActivitiesBySection(grouped);
    setLoading(false);
  }

  async function toggleActivity(activity: ActivityWithCompletion) {
    if (activity.completed || !profile) return;
    setCompletingId(activity.id);

    const { error } = await supabase
      .from('completions')
      .insert({ user_id: profile.id, activity_id: activity.id });

    if (error) {
      console.error(error);
      setCompletingId(null);
      return;
    }

    // Update local state
    setActivitiesBySection((prev) => {
      const next = { ...prev };
      const sectionId = activity.section_id || 'uncategorized';
      next[sectionId] = (next[sectionId] || []).map((a) =>
        a.id === activity.id ? { ...a, completed: true } : a
      );
      return next;
    });
    setCompletingId(null);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Desafios</h1>
        <p className="text-neutral-500">Complete atividades e ganhe pontos para subir no ranking</p>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 mb-4">Nenhum desafio disponível ainda</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            const acts = activitiesBySection[section.id] || [];
            if (acts.length === 0) return null;

            const done = acts.filter((a) => a.completed).length;
            const totalPts = acts.reduce((sum, a) => sum + a.points, 0);
            const earnedPts = acts.filter((a) => a.completed).reduce((sum, a) => sum + a.points, 0);

            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-slide-up">
                <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-xl text-white">{section.title}</h2>
                      {section.description && <p className="text-primary-200 text-sm mt-1">{section.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-accent-300 font-bold text-lg">{earnedPts}/{totalPts}</p>
                      <p className="text-primary-200 text-xs">pontos</p>
                    </div>
                  </div>
                  {totalPts > 0 && (
                    <div className="mt-3 h-1.5 bg-primary-950/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-400 rounded-full transition-all duration-500"
                        style={{ width: `${(earnedPts / totalPts) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="divide-y divide-neutral-100">
                  {acts.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity)}
                      disabled={activity.completed || completingId === activity.id}
                      className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                        activity.completed ? 'bg-primary-50/50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {completingId === activity.id ? (
                          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                        ) : activity.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-primary-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-neutral-300 hover:text-primary-500 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${activity.completed ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-neutral-500 mt-0.5">{activity.description}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        activity.completed ? 'bg-primary-100 text-primary-600' : 'bg-accent-50 text-accent-700'
                      }`}>
                        <Plus className="w-3 h-3" />
                        {activity.points}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
