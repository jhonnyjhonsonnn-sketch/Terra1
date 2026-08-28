import { useEffect, useState } from 'react';
import { supabase, type Reward } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Gift, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

export default function RewardsPage() {
  const { profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (data) setRewards(data as Reward[]);
        setLoading(false);
      });
  }, []);

  async function claimReward(reward: Reward) {
    if (!profile) return;
    setClaimingId(reward.id);
    setMessage(null);

    const { error } = await supabase.rpc('claim_reward', { p_reward_id: reward.id });

    if (error) {
      setMessage({ type: 'error', text: error.message.includes('Not enough points') ? 'Pontos insuficientes' : 'Erro ao resgatar recompensa' });
      setClaimingId(null);
      return;
    }

    setMessage({ type: 'success', text: `"${reward.title}" resgatado com sucesso!` });
    await refreshProfile();
    setClaimingId(null);

    // Update stock locally
    setRewards((prev) =>
      prev.map((r) =>
        r.id === reward.id && r.stock !== null ? { ...r, stock: r.stock - 1 } : r
      )
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">Carregando...</div>;
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Recompensas</h1>
        <p className="text-neutral-500">Troque seus pontos por prêmios especiais</p>
      </div>

      {/* Points balance */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-950 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm">Seus pontos disponíveis</p>
            <p className="text-4xl font-bold text-white mt-1">{profile?.total_points || 0}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-accent-400/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent-300" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm animate-scale-in ${
            message.type === 'success'
              ? 'bg-primary-50 text-primary-700 border border-primary-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
          {message.text}
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-20">
          <Gift className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-400">Nenhuma recompensa disponível ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rewards.map((reward) => {
            const canAfford = (profile?.total_points || 0) >= reward.points_required;
            const outOfStock = reward.stock !== null && reward.stock <= 0;

            return (
              <div
                key={reward.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all animate-slide-up"
              >
                <div className="bg-gradient-to-br from-accent-100 to-accent-200 p-8 flex items-center justify-center">
                  {reward.image_url ? (
                    <img src={reward.image_url} alt={reward.title} className="w-full h-32 rounded-lg object-cover" />
                  ) : (
                    <Gift className="w-16 h-16 text-accent-600" strokeWidth={1.5} />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-neutral-800 mb-1">{reward.title}</h3>
                  {reward.description && <p className="text-sm text-neutral-500 mb-3">{reward.description}</p>}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-accent-700 font-bold text-lg">{reward.points_required} pts</span>
                    {reward.stock !== null && (
                      <span className={`text-xs px-2 py-1 rounded-full ${outOfStock ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>
                        {outOfStock ? 'Esgotado' : `${reward.stock} restantes`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => claimReward(reward)}
                    disabled={!canAfford || outOfStock || claimingId === reward.id}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      canAfford && !outOfStock
                        ? 'bg-gradient-to-r from-primary-700 to-primary-900 text-white hover:shadow-lg'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {claimingId === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : outOfStock ? (
                      'Esgotado'
                    ) : canAfford ? (
                      'Resgatar'
                    ) : (
                      `Faltam ${reward.points_required - (profile?.total_points || 0)} pts`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
