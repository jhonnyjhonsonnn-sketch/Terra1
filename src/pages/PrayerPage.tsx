import { useState, useEffect } from 'react';
import { supabase, type PrayerType, type PrayerRequest, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Heart, Send, Loader2, CheckCircle2, Plus, X } from 'lucide-react';

export default function PrayerPage() {
  const { profile } = useAuth();
  const [types, setTypes] = useState<PrayerType[]>([]);
  const [requests, setRequests] = useState<(PrayerRequest & { full_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [requestText, setRequestText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: typesData }, { data: reqData }] = await Promise.all([
      supabase.from('prayer_types').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('prayer_requests').select('*, profiles!inner(full_name)').order('created_at', { ascending: false }).limit(50),
    ]);

    setTypes((typesData || []) as PrayerType[]);
    const formatted = (reqData || []).map((r: any) => ({
      ...r,
      full_name: r.is_anonymous ? 'Anônimo' : (r.profiles?.full_name || 'Anônimo'),
    }));
    setRequests(formatted);
    if (typesData && typesData.length > 0) setSelectedType((typesData[0] as PrayerType).id);
    setLoading(false);
  }

  async function submitRequest() {
    if (!requestText.trim() || !profile) return;
    setSubmitting(true);
    const { error } = await supabase.from('prayer_requests').insert({
      user_id: profile.id,
      prayer_type_id: selectedType || null,
      request_text: requestText,
      is_anonymous: isAnonymous,
    });
    if (error) { console.error(error); setSubmitting(false); return; }
    setRequestText('');
    setIsAnonymous(false);
    setShowForm(false);
    setSubmitting(false);
    loadData();
  }

  async function toggleAnswered(req: PrayerRequest) {
    await supabase.from('prayer_requests').update({ is_answered: !req.is_answered }).eq('id', req.id);
    loadData();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  const typeMap = new Map(types.map((t) => [t.id, t]));

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl text-neutral-800 mb-2">Mural de Oração</h1>
          <p className="text-neutral-500">Compartilhe seus pedidos e ore pelos irmãos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-medium hover:bg-primary-900">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Fechar' : 'Novo pedido'}
        </button>
      </div>

      {/* Prayer type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {types.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-2">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <p className="font-medium text-neutral-800 text-sm">{t.name}</p>
            {t.description && <p className="text-xs text-neutral-400 mt-1">{t.description}</p>}
          </div>
        ))}
      </div>

      {/* New request form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-scale-in">
          <h3 className="font-semibold text-neutral-800 mb-4">Novo pedido de oração</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo de oração</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none">
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Seu pedido</label>
              <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} rows={4} placeholder="Escreva seu pedido de oração..." className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none resize-none" />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded" />
              Postar como anônimo
            </label>
            <button onClick={submitRequest} disabled={submitting || !requestText.trim()} className="w-full py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar pedido
            </button>
          </div>
        </div>
      )}

      {/* Prayer requests list */}
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-center text-neutral-400 py-10">Nenhum pedido de oração ainda</p>}
        {requests.map((r) => {
          const type = r.prayer_type_id ? typeMap.get(r.prayer_type_id) : null;
          return (
            <div key={r.id} className={`bg-white rounded-xl shadow-sm p-5 ${r.is_answered ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {type && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{type.name}</span>}
                    <span className="text-xs text-neutral-400">{r.full_name}</span>
                    {r.is_answered && <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Respondido</span>}
                  </div>
                  <p className="text-neutral-700">{r.request_text}</p>
                  <p className="text-xs text-neutral-400 mt-2">{new Date(r.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {r.user_id === profile?.id && (
                  <button onClick={() => toggleAnswered(r)} className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap">
                    {r.is_answered ? 'Reabrir' : 'Marcar respondido'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
