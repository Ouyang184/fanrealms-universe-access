// src/components/jam/JamHeader.tsx
import { type Jam, getJamStatus } from '@/hooks/useJam';

interface Props {
  jam: Jam;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' },
  active:   { label: 'Submissions Open', color: 'bg-green-100 text-green-800' },
  voting:   { label: 'Voting Open', color: 'bg-blue-100 text-blue-800' },
  ended:    { label: 'Ended', color: 'bg-gray-100 text-gray-600' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'UTC',
  });
}

export function JamHeader({ jam }: Props) {
  const status = getJamStatus(jam);
  const { label, color } = STATUS_LABELS[status];

  return (
    <div className="border-b border-[#eee] pb-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#111]">{jam.title}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${color}`}>
          {label}
        </span>
      </div>

      {jam.description && (
        <p className="text-[14px] text-[#555] mb-4">{jam.description}</p>
      )}

      <div className="flex flex-wrap gap-6 text-[13px] text-[#666] mb-5">
        <div>
          <span className="font-semibold text-[#333]">Submissions:</span>{' '}
          {fmt(jam.starts_at)} – {fmt(jam.ends_at)}
        </div>
        <div>
          <span className="font-semibold text-[#333]">Voting closes:</span>{' '}
          {fmt(jam.voting_ends_at)}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {jam.prize_pool.map((p) => (
          <div
            key={p.place}
            className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-[#eee] rounded-lg"
          >
            <span className="text-[12px] font-bold text-[#888]">{p.place}</span>
            <span className="text-[12px] text-[#555]">{p.label}</span>
            <span className="text-[13px] font-bold text-primary">{p.prize}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
