import { useState, useEffect } from 'react';
import { supabase, type DailyTask, type DailyTaskCompletion } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Loader2, Target, Calendar } from 'lucide-react';

type TaskWithCompletion = DailyTask & { completed: boolean; completion_id: string | null };

export default function TasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [writtenResponses, setWrittenResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];

    const [{ data: tasksData }, { data: completions }] = await Promise.all([
      supabase.from('daily_tasks').select('*').eq('is_active', true),
      supabase.from('daily_task_completions').select('id, task_id, written_response').eq('user_id', profile.id).eq('completion_date', today),
    ]);

    const completedMap = new Map((completions || []).map((c: any) => [c.task_id, c]));
    const allTasks = (tasksData || []) as DailyTask[];

    // Select 30 tasks for today using deterministic rotation based on day
    const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const startIndex = dayOffset % Math.max(allTasks.length, 1);
    const selected: DailyTask[] = [];
    for (let i = 0; i < Math.min(30, allTasks.length); i++) {
      selected.push(allTasks[(startIndex + i) % allTasks.length]);
    }

    const mapped = selected.map((t) => {
      const comp = completedMap.get(t.id);
      return { ...t, completed: !!comp, completion_id: comp?.id || null };
    });

    setTasks(mapped);
    setLoading(false);
  }

  async function completeTask(task: TaskWithCompletion) {
    if (task.completed || !profile) return;
    setCompletingId(task.id);

    const today = new Date().toISOString().split('T')[0];
    const response = writtenResponses[task.id] || null;

    const { error } = await supabase.from('daily_task_completions').insert({
      user_id: profile.id,
      task_id: task.id,
      completion_date: today,
      written_response: response,
    });

    if (error) {
      if (error.code === '23505') {
        // Already completed today
      } else {
        console.error(error);
      }
      setCompletingId(null);
      return;
    }

    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: true } : t));
    setCompletingId(null);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  const doneCount = tasks.filter((t) => t.completed).length;
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Tarefas Diárias</h1>
        <p className="text-neutral-500 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-neutral-800">Progresso de hoje</span>
          </div>
          <span className="text-sm text-neutral-500">{doneCount}/{tasks.length} tarefas • {earnedPoints}/{totalPoints} pts</span>
        </div>
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-500" style={{ width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={`bg-white rounded-xl shadow-sm p-5 ${task.completed ? 'bg-primary-50/50' : ''}`}>
            <div className="flex items-start gap-4">
              <button
                onClick={() => completeTask(task)}
                disabled={task.completed || completingId === task.id}
                className="flex-shrink-0 mt-0.5"
              >
                {completingId === task.id ? (
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                ) : task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary-600" />
                ) : (
                  <Circle className="w-6 h-6 text-neutral-300 hover:text-primary-500 transition-colors" />
                )}
              </button>

              <div className="flex-1">
                <p className={`font-medium ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                  {task.task_text}
                </p>

                {task.task_type === 'written' && !task.completed && (
                  <textarea
                    value={writtenResponses[task.id] || ''}
                    onChange={(e) => setWrittenResponses((prev) => ({ ...prev, [task.id]: e.target.value }))}
                    placeholder="Escreva sua resposta..."
                    rows={2}
                    className="w-full mt-3 px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary-500 outline-none text-sm resize-none"
                  />
                )}

                {task.task_type === 'written' && task.completed && writtenResponses[task.id] && (
                  <p className="text-sm text-neutral-500 mt-2 italic">{writtenResponses[task.id]}</p>
                )}
              </div>

              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-50 text-accent-700 whitespace-nowrap">
                +{task.points} pts
              </span>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-neutral-400 py-10">Nenhuma tarefa disponível</p>}
      </div>
    </div>
  );
}
