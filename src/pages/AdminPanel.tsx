import { useEffect, useState, useRef } from 'react';
import { supabase, type Section, type Activity, type Reward, type Profile, type AppSettings, type Devotional, type PrayerType, type DailyTask, type Outing, type BibleStudy } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { uploadFile } from '@/lib/upload';
import {
  LayoutDashboard, FolderTree, Target, Gift, Users, Settings, Film, FileUp,
  Plus, Pencil, Trash2, X, Save, Loader2, CheckCircle2, Clock, XCircle, Package,
  BookOpen, Heart, CheckSquare, MapPin, Brain, GraduationCap, Camera, Eye,
} from 'lucide-react';

type Tab = 'overview' | 'sections' | 'activities' | 'rewards' | 'users' | 'claims' | 'settings' | 'devotionals' | 'prayer' | 'tasks' | 'outings' | 'bible';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Acesso restrito a administradores
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'devotionals', label: 'Devocionais', icon: BookOpen },
    { id: 'sections', label: 'Cabeçalhos', icon: FolderTree },
    { id: 'activities', label: 'Desafios', icon: Target },
    { id: 'tasks', label: 'Tarefas Diárias', icon: CheckSquare },
    { id: 'prayer', label: 'Oração', icon: Heart },
    { id: 'bible', label: 'Estudos Bíblicos', icon: GraduationCap },
    { id: 'outings', label: 'Saídas', icon: MapPin },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'claims', label: 'Resgates', icon: Package },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Painel de Administração</h1>
        <p className="text-neutral-500">Gerencie tudo da igreja em um só lugar</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active ? 'bg-primary-800 text-white shadow-md' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'devotionals' && <DevotionalsTab />}
        {tab === 'sections' && <SectionsTab />}
        {tab === 'activities' && <ActivitiesTab />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'prayer' && <PrayerTab />}
        {tab === 'bible' && <BibleTab />}
        {tab === 'outings' && <OutingsTab />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'claims' && <ClaimsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW
// ============================================================
function OverviewTab() {
  const [stats, setStats] = useState({ users: 0, sections: 0, activities: 0, rewards: 0, completions: 0, claims: 0, devotionals: 0, tasks: 0, outings: 0, bible: 0, prayers: 0, understandings: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('sections').select('id', { count: 'exact', head: true }),
      supabase.from('activities').select('id', { count: 'exact', head: true }),
      supabase.from('rewards').select('id', { count: 'exact', head: true }),
      supabase.from('completions').select('id', { count: 'exact', head: true }),
      supabase.from('claims').select('id', { count: 'exact', head: true }),
      supabase.from('devotionals').select('id', { count: 'exact', head: true }),
      supabase.from('daily_tasks').select('id', { count: 'exact', head: true }),
      supabase.from('outings').select('id', { count: 'exact', head: true }),
      supabase.from('bible_studies').select('id', { count: 'exact', head: true }),
      supabase.from('prayer_requests').select('id', { count: 'exact', head: true }),
      supabase.from('understandings').select('id', { count: 'exact', head: true }),
    ]).then((r) => {
      setStats({
        users: r[0].count || 0, sections: r[1].count || 0, activities: r[2].count || 0,
        rewards: r[3].count || 0, completions: r[4].count || 0, claims: r[5].count || 0,
        devotionals: r[6].count || 0, tasks: r[7].count || 0, outings: r[8].count || 0,
        bible: r[9].count || 0, prayers: r[10].count || 0, understandings: r[11].count || 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Usuários', value: stats.users, icon: Users, color: 'from-primary-500 to-primary-700' },
    { label: 'Devocionais', value: stats.devotionals, icon: BookOpen, color: 'from-primary-600 to-primary-800' },
    { label: 'Cabeçalhos', value: stats.sections, icon: FolderTree, color: 'from-primary-600 to-primary-800' },
    { label: 'Desafios', value: stats.activities, icon: Target, color: 'from-accent-500 to-accent-700' },
    { label: 'Tarefas diárias', value: stats.tasks, icon: CheckSquare, color: 'from-primary-500 to-primary-700' },
    { label: 'Estudos bíblicos', value: stats.bible, icon: GraduationCap, color: 'from-primary-600 to-primary-800' },
    { label: 'Saídas', value: stats.outings, icon: MapPin, color: 'from-accent-500 to-accent-700' },
    { label: 'Recompensas', value: stats.rewards, icon: Gift, color: 'from-primary-400 to-primary-600' },
    { label: 'Pedidos de oração', value: stats.prayers, icon: Heart, color: 'from-primary-500 to-primary-700' },
    { label: 'Entendimentos', value: stats.understandings, icon: Brain, color: 'from-accent-400 to-accent-600' },
    { label: 'Atividades concluídas', value: stats.completions, icon: CheckCircle2, color: 'from-primary-600 to-primary-800' },
    { label: 'Resgates', value: stats.claims, icon: Package, color: 'from-accent-400 to-accent-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-800">{c.value}</p>
              <p className="text-sm text-neutral-500">{c.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// DEVOTIONALS TAB
// ============================================================
function DevotionalsTab() {
  const [items, setItems] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Devotional | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('devotionals').select('*').order('display_date', { ascending: false, nullsFirst: false });
    setItems((data || []) as Devotional[]);
    setLoading(false);
  }
  async function save(d: Partial<Devotional>) {
    const { error } = await supabase.rpc('admin_upsert_devotional', {
      p_id: editing?.id || null, p_title: d.title || '', p_bible_ref: d.bible_ref || null,
      p_verse_text: d.verse_text || null, p_message: d.message || null,
      p_reflection_question: d.reflection_question || null, p_display_date: d.display_date || null,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir este devocional?')) return;
    const { error } = await supabase.rpc('admin_delete_devotional', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Devocionais" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <DevotionalForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(d) => { setEditing(d); setShowForm(true); }} onDelete={del}
        render={(d) => (
          <div>
            <h3 className="font-medium text-neutral-800">{d.title}</h3>
            {d.bible_ref && <p className="text-sm text-primary-600">{d.bible_ref}</p>}
            <p className="text-xs text-neutral-400 mt-1">{d.display_date ? new Date(d.display_date).toLocaleDateString('pt-BR') : 'Sem data'}</p>
          </div>
        )} />
    </div>
  );
}

function DevotionalForm({ item, onSave, onCancel }: { item: Devotional | null; onSave: (d: Partial<Devotional>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [bibleRef, setBibleRef] = useState(item?.bible_ref || '');
  const [verseText, setVerseText] = useState(item?.verse_text || '');
  const [message, setMessage] = useState(item?.message || '');
  const [reflectionQuestion, setReflectionQuestion] = useState(item?.reflection_question || '');
  const [displayDate, setDisplayDate] = useState(item?.display_date || '');

  return (
    <FormCard title={`${item ? 'Editar' : 'Novo'} devocional`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} />
      <FormInput label="Referência bíblica" value={bibleRef} onChange={setBibleRef} placeholder="Ex: João 3:16" />
      <FormTextarea label="Texto do versículo" value={verseText} onChange={setVerseText} />
      <FormTextarea label="Mensagem" value={message} onChange={setMessage} />
      <FormTextarea label="Pergunta de reflexão" value={reflectionQuestion} onChange={setReflectionQuestion} />
      <FormInput label="Data de exibição" type="date" value={displayDate} onChange={setDisplayDate} />
      <SaveButton onClick={() => onSave({ title, bible_ref: bibleRef || null, verse_text: verseText || null, message: message || null, reflection_question: reflectionQuestion || null, display_date: displayDate || null })} />
    </FormCard>
  );
}

// ============================================================
// SECTIONS TAB
// ============================================================
function SectionsTab() {
  const [items, setItems] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('sections').select('*').order('sort_order');
    setItems((data || []) as Section[]); setLoading(false);
  }
  async function save(d: Partial<Section>) {
    const { error } = await supabase.rpc('admin_upsert_section', {
      p_id: editing?.id || null, p_title: d.title || '', p_description: d.description || null,
      p_icon: d.icon || null, p_sort_order: d.sort_order ?? 0, p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir este cabeçalho e todos os seus desafios?')) return;
    const { error } = await supabase.rpc('admin_delete_section', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Cabeçalhos" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <SectionForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(s) => { setEditing(s); setShowForm(true); }} onDelete={del}
        render={(s) => (
          <div>
            <h3 className="font-medium text-neutral-800">{s.title}</h3>
            {s.description && <p className="text-sm text-neutral-500">{s.description}</p>}
            <p className="text-xs text-neutral-400 mt-1">Ordem: {s.sort_order} {s.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function SectionForm({ item, onSave, onCancel }: { item: Section | null; onSave: (d: Partial<Section>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [icon, setIcon] = useState(item?.icon || '');
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Novo'} cabeçalho`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} placeholder="Ex: Vida Espiritual" />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Ícone (Lucide)" value={icon} onChange={setIcon} placeholder="Ex: BookOpen" />
        <FormInput label="Ordem" type="number" value={String(sortOrder)} onChange={(v) => setSortOrder(Number(v))} />
      </div>
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ title, description: description || null, icon: icon || null, sort_order: sortOrder, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// ACTIVITIES TAB
// ============================================================
function ActivitiesTab() {
  const [items, setItems] = useState<Activity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const [{ data: acts }, { data: secs }] = await Promise.all([
      supabase.from('activities').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
    ]);
    setItems((acts || []) as Activity[]); setSections((secs || []) as Section[]); setLoading(false);
  }
  async function save(d: Partial<Activity>) {
    const { error } = await supabase.rpc('admin_upsert_activity', {
      p_id: editing?.id || null, p_section_id: d.section_id || null, p_title: d.title || '',
      p_description: d.description || null, p_points: d.points ?? 10, p_sort_order: d.sort_order ?? 0, p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir este desafio?')) return;
    const { error } = await supabase.rpc('admin_delete_activity', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Desafios" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <ActivityForm item={editing} sections={sections} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(a) => { setEditing(a); setShowForm(true); }} onDelete={del}
        render={(a) => (
          <div>
            <h3 className="font-medium text-neutral-800">{a.title}</h3>
            {a.description && <p className="text-sm text-neutral-500">{a.description}</p>}
            <p className="text-xs text-neutral-400 mt-1">{a.points} pts • Ordem: {a.sort_order} {a.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function ActivityForm({ item, sections, onSave, onCancel }: { item: Activity | null; sections: Section[]; onSave: (d: Partial<Activity>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [sectionId, setSectionId] = useState(item?.section_id || sections[0]?.id || '');
  const [points, setPoints] = useState(item?.points ?? 10);
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Novo'} desafio`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} placeholder="Ex: Ler a Bíblia 15 min" />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Cabeçalho</label>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none">
          <option value="">Sem cabeçalho</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Pontos" type="number" value={String(points)} onChange={(v) => setPoints(Number(v))} />
        <FormInput label="Ordem" type="number" value={String(sortOrder)} onChange={(v) => setSortOrder(Number(v))} />
      </div>
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ title, description: description || null, section_id: sectionId || null, points, sort_order: sortOrder, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// DAILY TASKS TAB
// ============================================================
function TasksTab() {
  const [items, setItems] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('daily_tasks').select('*').order('created_at', { ascending: false });
    setItems((data || []) as DailyTask[]); setLoading(false);
  }
  async function save(d: Partial<DailyTask>) {
    const { error } = await supabase.rpc('admin_upsert_daily_task', {
      p_id: editing?.id || null, p_task_text: d.task_text || '', p_task_type: d.task_type || 'written',
      p_points: d.points ?? 5, p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir esta tarefa?')) return;
    const { error } = await supabase.rpc('admin_delete_daily_task', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Tarefas Diárias" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <TaskForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(t) => { setEditing(t); setShowForm(true); }} onDelete={del}
        render={(t) => (
          <div>
            <h3 className="font-medium text-neutral-800">{t.task_text}</h3>
            <p className="text-xs text-neutral-400 mt-1">{t.points} pts • {t.task_type === 'written' ? 'Escrita' : 'Check'} {t.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function TaskForm({ item, onSave, onCancel }: { item: DailyTask | null; onSave: (d: Partial<DailyTask>) => void; onCancel: () => void }) {
  const [taskText, setTaskText] = useState(item?.task_text || '');
  const [taskType, setTaskType] = useState<'written' | 'check'>(item?.task_type || 'written');
  const [points, setPoints] = useState(item?.points ?? 5);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Nova'} tarefa`} onCancel={onCancel}>
      <FormTextarea label="Texto da tarefa" value={taskText} onChange={setTaskText} placeholder="Ex: Ler um capítulo da Bíblia..." />
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo</label>
        <select value={taskType} onChange={(e) => setTaskType(e.target.value as 'written' | 'check')} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none">
          <option value="written">Escrita (resposta em texto)</option>
          <option value="check">Check (marcar como feito)</option>
        </select>
      </div>
      <FormInput label="Pontos" type="number" value={String(points)} onChange={(v) => setPoints(Number(v))} />
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ task_text: taskText, task_type: taskType, points, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// PRAYER TYPES TAB
// ============================================================
function PrayerTab() {
  const [items, setItems] = useState<PrayerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PrayerType | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('prayer_types').select('*').order('sort_order');
    setItems((data || []) as PrayerType[]); setLoading(false);
  }
  async function save(d: Partial<PrayerType>) {
    const { error } = await supabase.rpc('admin_upsert_prayer_type', {
      p_id: editing?.id || null, p_name: d.name || '', p_description: d.description || null,
      p_icon: d.icon || null, p_sort_order: d.sort_order ?? 0, p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir este tipo de oração?')) return;
    const { error } = await supabase.rpc('admin_delete_prayer_type', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Tipos de Oração" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <PrayerTypeForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(t) => { setEditing(t); setShowForm(true); }} onDelete={del}
        render={(t) => (
          <div>
            <h3 className="font-medium text-neutral-800">{t.name}</h3>
            {t.description && <p className="text-sm text-neutral-500">{t.description}</p>}
            <p className="text-xs text-neutral-400 mt-1">Ordem: {t.sort_order} {t.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function PrayerTypeForm({ item, onSave, onCancel }: { item: PrayerType | null; onSave: (d: Partial<PrayerType>) => void; onCancel: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [icon, setIcon] = useState(item?.icon || '');
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Novo'} tipo de oração`} onCancel={onCancel}>
      <FormInput label="Nome" value={name} onChange={setName} placeholder="Ex: Gratidão" />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Ícone (Lucide)" value={icon} onChange={setIcon} placeholder="Ex: Heart" />
        <FormInput label="Ordem" type="number" value={String(sortOrder)} onChange={(v) => setSortOrder(Number(v))} />
      </div>
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ name, description: description || null, icon: icon || null, sort_order: sortOrder, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// BIBLE STUDIES TAB
// ============================================================
function BibleTab() {
  const [items, setItems] = useState<BibleStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BibleStudy | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('bible_studies').select('*').order('created_at', { ascending: false });
    setItems((data || []) as BibleStudy[]); setLoading(false);
  }
  async function save(d: Partial<BibleStudy>) {
    const { error } = await supabase.rpc('admin_upsert_bible_study', {
      p_id: editing?.id || null, p_title: d.title || '', p_description: d.description || null,
      p_bible_ref: d.bible_ref || null, p_content: d.content || null, p_question: d.question || '',
      p_points: d.points ?? 20, p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir este estudo?')) return;
    const { error } = await supabase.rpc('admin_delete_bible_study', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Estudos Bíblicos" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <BibleForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(b) => { setEditing(b); setShowForm(true); }} onDelete={del}
        render={(b) => (
          <div>
            <h3 className="font-medium text-neutral-800">{b.title}</h3>
            {b.bible_ref && <p className="text-sm text-primary-600">{b.bible_ref}</p>}
            <p className="text-xs text-neutral-400 mt-1">{b.points} pts {b.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function BibleForm({ item, onSave, onCancel }: { item: BibleStudy | null; onSave: (d: Partial<BibleStudy>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [bibleRef, setBibleRef] = useState(item?.bible_ref || '');
  const [content, setContent] = useState(item?.content || '');
  const [question, setQuestion] = useState(item?.question || '');
  const [points, setPoints] = useState(item?.points ?? 20);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Novo'} estudo bíblico`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <FormInput label="Referência bíblica" value={bibleRef} onChange={setBibleRef} placeholder="Ex: Mateus 5:1-12" />
      <FormTextarea label="Conteúdo do estudo" value={content} onChange={setContent} />
      <FormTextarea label="Pergunta para responder" value={question} onChange={setQuestion} />
      <FormInput label="Pontos" type="number" value={String(points)} onChange={(v) => setPoints(Number(v))} />
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ title, description: description || null, bible_ref: bibleRef || null, content: content || null, question, points, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// OUTINGS TAB
// ============================================================
function OutingsTab() {
  const [items, setItems] = useState<Outing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Outing | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('outings').select('*').order('meeting_date', { ascending: true });
    setItems((data || []) as Outing[]); setLoading(false);
  }
  async function save(d: Partial<Outing>) {
    const { error } = await supabase.rpc('admin_upsert_outing', {
      p_id: editing?.id || null, p_title: d.title || '', p_description: d.description || null,
      p_location: d.location || null, p_meeting_date: d.meeting_date || null,
      p_whatsapp_number: d.whatsapp_number || '', p_is_active: d.is_active ?? true,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir esta saída?')) return;
    const { error } = await supabase.rpc('admin_delete_outing', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Saídas" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <OutingForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(o) => { setEditing(o); setShowForm(true); }} onDelete={del}
        render={(o) => (
          <div>
            <h3 className="font-medium text-neutral-800">{o.title}</h3>
            {o.location && <p className="text-sm text-neutral-500">{o.location}</p>}
            <p className="text-xs text-neutral-400 mt-1">{new Date(o.meeting_date).toLocaleDateString('pt-BR')} • WhatsApp: {o.whatsapp_number} {o.is_active ? '' : '• Inativo'}</p>
          </div>
        )} />
    </div>
  );
}

function OutingForm({ item, onSave, onCancel }: { item: Outing | null; onSave: (d: Partial<Outing>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [location, setLocation] = useState(item?.location || '');
  const [meetingDate, setMeetingDate] = useState(item?.meeting_date ? item.meeting_date.slice(0, 16) : '');
  const [whatsappNumber, setWhatsappNumber] = useState(item?.whatsapp_number || '');
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  return (
    <FormCard title={`${item ? 'Editar' : 'Nova'} saída`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} placeholder="Ex: Acampamento de Jovens" />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <FormInput label="Local" value={location} onChange={setLocation} />
      <FormInput label="Data e hora" type="datetime-local" value={meetingDate} onChange={setMeetingDate} />
      <FormInput label="Número do WhatsApp (com DDI)" value={whatsappNumber} onChange={setWhatsappNumber} placeholder="Ex: 5511999999999" />
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ title, description: description || null, location: location || null, meeting_date: meetingDate ? new Date(meetingDate).toISOString() : undefined, whatsapp_number: whatsappNumber, is_active: isActive })} />
    </FormCard>
  );
}

// ============================================================
// REWARDS TAB (with image upload)
// ============================================================
function RewardsTab() {
  const [items, setItems] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('rewards').select('*').order('points_required');
    setItems((data || []) as Reward[]); setLoading(false);
  }
  async function save(d: Partial<Reward>) {
    const { error } = await supabase.rpc('admin_upsert_reward', {
      p_id: editing?.id || null, p_title: d.title || '', p_description: d.description || null,
      p_points_required: d.points_required ?? 100, p_stock: d.stock ?? null,
      p_is_active: d.is_active ?? true, p_image_url: d.image_url || null,
    });
    if (error) { console.error(error); return; }
    setShowForm(false); setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm('Excluir esta recompensa?')) return;
    const { error } = await supabase.rpc('admin_delete_reward', { p_id: id });
    if (error) { console.error(error); return; }
    load();
  }

  if (loading) return <Loading />;
  return (
    <div>
      <Header title="Recompensas" onNew={() => { setEditing(null); setShowForm(true); }} />
      {showForm && <RewardForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      <List items={items} onEdit={(r) => { setEditing(r); setShowForm(true); }} onDelete={del}
        render={(r) => (
          <div className="flex items-center gap-3">
            {r.image_url && <img src={r.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
            <div>
              <h3 className="font-medium text-neutral-800">{r.title}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{r.points_required} pts • Estoque: {r.stock === null ? 'Ilimitado' : r.stock} {r.is_active ? '' : '• Inativo'}</p>
            </div>
          </div>
        )} />
    </div>
  );
}

function RewardForm({ item, onSave, onCancel }: { item: Reward | null; onSave: (d: Partial<Reward>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [pointsRequired, setPointsRequired] = useState(item?.points_required ?? 100);
  const [stock, setStock] = useState(item?.stock === null ? '' : String(item?.stock ?? ''));
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const url = await uploadFile(file, 'rewards');
    if (url) setImageUrl(url);
    setUploading(false);
  }

  return (
    <FormCard title={`${item ? 'Editar' : 'Nova'} recompensa`} onCancel={onCancel}>
      <FormInput label="Título" value={title} onChange={setTitle} placeholder="Ex: Camiseta Terra Santa" />
      <FormInput label="Descrição" value={description} onChange={setDescription} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Pontos necessários" type="number" value={String(pointsRequired)} onChange={(v) => setPointsRequired(Number(v))} />
        <FormInput label="Estoque (vazio = ilimitado)" type="number" value={stock} onChange={setStock} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Foto da recompensa</label>
        {imageUrl && <img src={imageUrl} alt="" className="w-full h-32 rounded-xl object-cover mb-2" />}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-6 cursor-pointer hover:border-primary-400 transition-colors">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          {uploading ? <Loader2 className="w-6 h-6 text-primary-500 animate-spin" /> : <Camera className="w-6 h-6 text-neutral-400 mb-1" />}
          <span className="text-xs text-neutral-500">{uploading ? 'Enviando...' : 'Enviar foto'}</span>
        </label>
        <FormInput label="Ou cole uma URL" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
      </div>
      <Checkbox label="Ativo" checked={isActive} onChange={setIsActive} />
      <SaveButton onClick={() => onSave({ title, description: description || null, points_required: pointsRequired, stock: stock === '' ? null : Number(stock), is_active: isActive, image_url: imageUrl || null })} />
    </FormCard>
  );
}

// ============================================================
// USERS TAB (with detail view)
// ============================================================
function UsersTab() {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers((data || []) as Profile[]); setLoading(false);
    });
  }, []);

  async function toggleAdmin(user: Profile) {
    if (user.id === me?.id) { alert('Você não pode remover seu próprio acesso de admin'); return; }
    const { error } = await supabase.rpc('admin_set_user_admin', { p_user_id: user.id, p_is_admin: !user.is_admin });
    if (error) { console.error(error); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
  }

  if (detailUser) {
    return <UserDetail userId={detailUser} onBack={() => setDetailUser(null)} />;
  }

  if (loading) return <Loading />;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">Nome</th>
            <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600 hidden sm:table-cell">Pontos</th>
            <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">Admin</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-neutral-50">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name?.charAt(0).toUpperCase() || '?')}
                  </div>
                  <span className="font-medium text-neutral-800">{u.full_name || 'Anônimo'}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-neutral-600 hidden sm:table-cell">{u.total_points}</td>
              <td className="px-5 py-3">
                {u.is_admin ? <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full font-medium">Admin</span> : <span className="text-xs text-neutral-400">Usuário</span>}
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setDetailUser(u.id)} className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Ver
                  </button>
                  <button onClick={() => toggleAdmin(u)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.is_admin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}>
                    {u.is_admin ? 'Remover' : 'Tornar admin'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="text-center text-neutral-400 py-10">Nenhum usuário cadastrado</p>}
    </div>
  );
}

function UserDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('admin_get_user_detail', { p_user_id: userId }).then(({ data, error }) => {
      if (error) { console.error(error); }
      setDetail(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <Loading />;
  if (!detail) return <div className="text-center text-neutral-400 py-10">Usuário não encontrado</div>;

  const d = Array.isArray(detail) ? detail[0] : detail;
  if (!d) return <div className="text-center text-neutral-400 py-10">Usuário não encontrado</div>;

  const statItems = [
    { label: 'Pontos totais', value: d.total_points },
    { label: 'Meta diária', value: d.daily_goal || 1 },
    { label: 'Desafios concluídos', value: d.completions_count },
    { label: 'Tarefas diárias', value: d.daily_tasks_count },
    { label: 'Entendimentos', value: d.understandings_count },
    { label: 'Estudos bíblicos', value: d.bible_studies_count },
    { label: 'Pedidos de oração', value: d.prayer_requests_count },
    { label: 'Resgates', value: d.claims_count },
  ];

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1">
        <X className="w-4 h-4" /> Voltar
      </button>
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {d.avatar_url ? <img src={d.avatar_url} alt="" className="w-full h-full object-cover" /> : (d.full_name?.charAt(0).toUpperCase() || '?')}
          </div>
          <div>
            <h2 className="font-serif text-2xl text-neutral-800">{d.full_name || 'Anônimo'}</h2>
            <p className="text-sm text-neutral-500">{d.email}</p>
            {d.is_admin && <span className="inline-block mt-1 text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium">Administrador</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500">Telefone:</span> <span className="text-neutral-800">{d.phone || 'Não informado'}</span></div>
          <div><span className="text-neutral-500">Cadastro:</span> <span className="text-neutral-800">{new Date(d.created_at).toLocaleDateString('pt-BR')}</span></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-neutral-800">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CLAIMS TAB
// ============================================================
function ClaimsTab() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data, error } = await supabase.rpc('admin_list_claims');
    if (error) { console.error(error); }
    setClaims(data || []); setLoading(false);
  }
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.rpc('admin_update_claim_status', { p_claim_id: id, p_status: status });
    if (error) { console.error(error); return; }
    setClaims((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  }

  if (loading) return <Loading />;

  const cfg: Record<string, { label: string; icon: any; color: string }> = {
    pending: { label: 'Pendente', icon: Clock, color: 'bg-amber-100 text-amber-700' },
    fulfilled: { label: 'Entregue', icon: CheckCircle2, color: 'bg-primary-100 text-primary-700' },
    rejected: { label: 'Rejeitado', icon: XCircle, color: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="space-y-3">
      {claims.length === 0 && <p className="text-center text-neutral-400 py-10">Nenhum resgate solicitado</p>}
      {claims.map((c) => {
        const sc = cfg[c.status] || cfg.pending;
        const Icon = sc.icon;
        return (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-neutral-800">{c.reward_title}</h3>
              <p className="text-sm text-neutral-500">Solicitado por {c.full_name}</p>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium mt-2 ${sc.color}`}>
                <Icon className="w-3 h-3" /> {sc.label}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus(c.id, 'fulfilled')} className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium">Entregar</button>
              <button onClick={() => updateStatus(c.id, 'rejected')} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Rejeitar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// SETTINGS TAB (with login + app video)
// ============================================================
function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [churchName, setChurchName] = useState('');
  const [tagline, setTagline] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [loginVideoUrl, setLoginVideoUrl] = useState('');
  const [loginImageUrl, setLoginImageUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1a5631');

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        const s = data as AppSettings;
        setSettings(s);
        setChurchName(s.church_name); setTagline(s.tagline || '');
        setHeroVideoUrl(s.hero_video_url || ''); setHeroImageUrl(s.hero_image_url || '');
        setLoginVideoUrl(s.login_video_url || ''); setLoginImageUrl(s.login_image_url || '');
        setPrimaryColor(s.primary_color);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_settings', {
      p_church_name: churchName, p_tagline: tagline, p_hero_video_url: heroVideoUrl,
      p_hero_image_url: heroImageUrl, p_primary_color: primaryColor,
      p_login_video_url: loginVideoUrl, p_login_image_url: loginImageUrl,
    });
    if (error) { console.error(error); setSaving(false); return; }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Login screen video */}
      <VideoCard
        title="Vídeo de fundo da tela de LOGIN"
        desc="Vídeo que aparece antes do usuário entrar no app"
        videoUrl={loginVideoUrl} setVideoUrl={setLoginVideoUrl}
        imageUrl={loginImageUrl} setImageUrl={setLoginImageUrl}
      />

      {/* App home screen video */}
      <VideoCard
        title="Vídeo de fundo da tela do APP"
        desc="Vídeo que aparece na página inicial após o login"
        videoUrl={heroVideoUrl} setVideoUrl={setHeroVideoUrl}
        imageUrl={heroImageUrl} setImageUrl={setHeroImageUrl}
      />

      {/* General settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-neutral-800 mb-4">Informações gerais</h3>
        <div className="space-y-4">
          <FormInput label="Nome da igreja" value={churchName} onChange={setChurchName} />
          <FormInput label="Slogan / frase" value={tagline} onChange={setTagline} />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Cor principal</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer" />
              <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 bg-gradient-to-r from-primary-700 to-primary-900 text-white font-medium rounded-xl hover:shadow-lg flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
      </button>
    </div>
  );
}

function VideoCard({ title, desc, videoUrl, setVideoUrl, imageUrl, setImageUrl }: {
  title: string; desc: string; videoUrl: string; setVideoUrl: (v: string) => void; imageUrl: string; setImageUrl: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const url = await uploadFile(file, 'videos');
    if (url) setVideoUrl(url);
    setUploading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-semibold text-neutral-800 mb-1 flex items-center gap-2">
        <Film className="w-5 h-5 text-primary-600" /> {title}
      </h3>
      <p className="text-sm text-neutral-500 mb-4">{desc}</p>

      {videoUrl && <video src={videoUrl} controls className="w-full rounded-xl max-h-48 object-cover mb-4" />}

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-8 cursor-pointer hover:border-primary-400 transition-colors mb-4">
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        {uploading ? <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" /> : <FileUp className="w-8 h-8 text-neutral-400 mb-2" />}
        <span className="text-sm text-neutral-600">{uploading ? 'Enviando...' : 'Clique para enviar um vídeo'}</span>
        <span className="text-xs text-neutral-400 mt-1">MP4, WebM - máx 50MB</span>
      </label>

      <FormInput label="Ou cole uma URL de vídeo" value={videoUrl} onChange={setVideoUrl} placeholder="https://exemplo.com/video.mp4" />

      <button onClick={() => setVideoUrl('')} className="mt-2 text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
        <X className="w-4 h-4" /> Remover vídeo
      </button>

      <div className="mt-4 pt-4 border-t border-neutral-100">
        <FormInput label="Imagem de fundo (alternativa)" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
        {imageUrl && <img src={imageUrl} alt="" className="mt-2 w-full rounded-xl max-h-32 object-cover" />}
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Loading() { return <div className="text-center py-10 text-neutral-400">Carregando...</div>; }

function Header({ title, onNew }: { title: string; onNew: () => void }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
      <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-medium hover:bg-primary-900">
        <Plus className="w-4 h-4" /> Novo
      </button>
    </div>
  );
}

function List<T>({ items, onEdit, onDelete, render }: { items: T[]; onEdit: (item: T) => void; onDelete: (id: string) => void; render: (item: T) => React.ReactNode }) {
  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          {render(item)}
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <button onClick={() => onEdit(item)} className="p-2 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-neutral-100">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-neutral-400 py-10">Nenhum item criado</p>}
    </div>
  );
}

function FormCard({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 animate-scale-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        <button onClick={onCancel} className="p-1 text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none" />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded" />
      {label}
    </label>
  );
}

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 flex items-center justify-center gap-2">
      <Save className="w-4 h-4" /> Salvar
    </button>
  );
}
