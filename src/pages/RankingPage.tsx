import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

export default function RankingPage() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        }
        if (data) setProfiles(data as Profile[]);
        setLoading(false);
      });
  }, []);

  const podium = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-serif text-3xl text-neutral-800 mb-2">Ranking</h1>
        <p className="text-neutral-500">Competição saudável para crescer juntos na fé</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-400">Carregando...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">Nenhum participante ainda</div>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8 items-end">
              {podium.map((p, idx) => {
                const place = idx + 1;
                const isMe = p.id === profile?.id;
                const heights = ['h-32', 'h-44', 'h-28'];
                const order = [1, 0, 2];
                const icons = [Crown, Medal, Award];
                const colors = [
                  'from-accent-400 to-accent-600',
                  'from-neutral-300 to-neutral-500',
                  'from-amber-600 to-amber-800',
                ];
                const Icon = icons[idx];
                const styleOrder = order.indexOf(place);

                return (
                  <div key={p.id} className={`flex flex-col items-center ${styleOrder === 0 ? 'order-2' : styleOrder === 1 ? 'order-1' : 'order-3'}`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold text-xl mb-2 shadow-lg ring-2 ${isMe ? 'ring-primary-600' : 'ring-white'}`}>
                      {p.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="text-sm font-medium text-neutral-700 truncate max-w-full text-center">{p.full_name || 'Anônimo'}</p>
                    <p className="text-xs text-primary-600 font-semibold mb-2">{p.total_points} pts</p>
                    <div className={`w-full ${heights[idx]} bg-gradient-to-t ${colors[idx]} rounded-t-xl flex items-start justify-center pt-3 shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of ranking */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {rest.map((p, idx) => {
              const isMe = p.id === profile?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-neutral-100 last:border-0 transition-colors ${
                    isMe ? 'bg-primary-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="w-8 text-center font-semibold text-neutral-400">{idx + 4}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {p.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">
                      {p.full_name || 'Anônimo'}
                      {isMe && <span className="text-primary-600 text-sm ml-2">(Você)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent-500" />
                    <span className="font-semibold text-neutral-700">{p.total_points}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
