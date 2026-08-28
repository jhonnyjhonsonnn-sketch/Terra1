import { useState, useEffect } from 'react';
import { supabase, type Outing, type OutingConfirmation } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Calendar, MessageCircle, Check, Loader2 } from 'lucide-react';

export default function OutingsPage() {
  const { profile } = useAuth();
  const [outings, setOutings] = useState<Outing[]>([]);
  const [confirmations, setConfirmations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    const [{ data: outingsData }, { data: confData }] = await Promise.all([
      supabase.from('outings').select('*').eq('is_active', true).order('meeting_date', { ascending: true }),
      profile ? supabase.from('outing_confirmations').select('outing_id, status').eq('user_id', profile.id) : Promise.resolve({ data: [] }),
    ]);

    setOutings((outingsData || []) as Outing[]);
    const confMap: Record<string, string> = {};
    (confData || []).forEach((c: any) => { confMap[c.outing_id] = c.status; });
    setConfirmations(confMap);
    setLoading(false);
  }

  async function confirmOuting(outing: Outing) {
    if (!profile) return;
    setConfirmingId(outing.id);

    const { error } = await supabase.from('outing_confirmations').insert({
      user_id: profile.id,
      outing_id: outing.id,
      status: 'confirmed',
    });

    if (error) {
      if (error.code === '23505') {
        // Already confirmed
      } else {
        console.error(error);
      }
      setConfirmingId(null);
      return;
    }

    setConfirmations((prev) => ({ ...prev, [outing.id]: 'confirmed' }));
    setConfirmingId(null);

    // Open WhatsApp with pre-filled message
    const message = `Olá! Sou ${profile.full_name} e confirmo minha presença na saída "${outing.title}" ${outing.meeting_date ? `no dia ${new Date(outing.meeting_date).toLocaleDateString('pt-BR')}` : ''}${outing.location ? ` em ${outing.location}` : ''}.`;
    const phone = outing.whatsapp_number.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Saídas</h1>
        <p className="text-neutral-500">Confirme sua presença nas saídas da igreja via WhatsApp</p>
      </div>

      <div className="space-y-4">
        {outings.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-400">Nenhuma saída programada</p>
          </div>
        )}

        {outings.map((outing) => {
          const confirmed = confirmations[outing.id] === 'confirmed';
          return (
            <div key={outing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-slide-up">
              <div className="bg-gradient-to-r from-primary-700 to-primary-900 p-6">
                <h2 className="font-serif text-xl text-white mb-2">{outing.title}</h2>
                {outing.description && <p className="text-primary-100 text-sm">{outing.description}</p>}
              </div>

              <div className="p-6">
                <div className="space-y-3 mb-4">
                  {outing.location && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      {outing.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    {new Date(outing.meeting_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {confirmed ? (
                  <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-3 rounded-xl font-medium">
                    <Check className="w-5 h-5" />
                    Presença confirmada!
                  </div>
                ) : (
                  <button
                    onClick={() => confirmOuting(outing)}
                    disabled={confirmingId === outing.id}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {confirmingId === outing.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                    Confirmar via WhatsApp
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
