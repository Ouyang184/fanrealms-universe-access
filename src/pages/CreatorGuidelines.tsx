import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Package, Gamepad2, Briefcase, DollarSign } from 'lucide-react';

export default function CreatorGuidelines() {
  const { user } = useAuth();
  const backTo = user ? '/home' : '/';

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <header className="border-b border-[#eee]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to={backTo} className="text-[13px] text-[#777] hover:text-[#111]">← Back</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-2">Seller guidelines</h1>
          <p className="text-[14px] text-[#666] leading-relaxed">
            Rules and best practices for listing products, games, and gigs on FanRealms.
            Following these keeps your listings live, approved faster, and trusted by buyers.
          </p>
        </div>

        <Category
          Icon={Package}
          title="Marketplace listings"
          good={[
            'Original assets, or assets you have a license to resell',
            'Accurate previews — screenshots match what buyers get',
            'Clear file formats, dimensions, and software compatibility',
            'Detailed license terms (personal, commercial, extended)',
          ]}
          avoid={[
            'Stolen, pirated, or repackaged asset-store content',
            'AI-generated work built on copyrighted training data',
            'Misleading thumbnails or bait-and-switch previews',
            'Empty, broken, or placeholder files',
          ]}
        />

        <Category
          Icon={Gamepad2}
          title="Indie game submissions"
          good={[
            'Playable, virus-free builds for the platforms you list',
            'A short gameplay trailer or GIF on the listing',
            'Honest content ratings (violence, language, adult themes)',
            'A working contact or support link',
          ]}
          avoid={[
            'Clones or re-skins of other devs\' games',
            'Games requiring external logins or shady installers',
            'Bundling crypto miners, adware, or telemetry without disclosure',
            'Early-access games without clearly marking them as such',
          ]}
        />

        <Category
          Icon={Briefcase}
          title="Job & gig listings"
          good={[
            'Real work with a real budget or hourly rate',
            'Clear scope: deliverables, timeline, revisions',
            'Honest about whether it\'s paid, rev-share, or portfolio',
            'Respond to applicants within a reasonable window',
          ]}
          avoid={[
            '"Exposure" gigs disguised as paid work',
            'MLM, crypto pump schemes, or paid-review jobs',
            'Asking for free "test tasks" beyond a short sample',
            'Ghosting freelancers after they start',
          ]}
        />

        {/* Payouts & fees */}
        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">Payouts & fees</div>
            <p className="text-[13px] text-[#666] leading-relaxed">
              FanRealms takes a <strong className="text-[#111] font-semibold">10% platform fee</strong> on each sale.
              Stripe processing (~2.9% + 30¢) is separate. Payouts run through Stripe Connect on a
              rolling schedule once your account is verified. You're responsible for your own taxes.
            </p>
          </div>
        </div>

        <div className="border border-[#eee] rounded-xl p-5">
          <div className="text-[14px] font-bold text-[#111] mb-1">Need help?</div>
          <p className="text-[13px] text-[#666] leading-relaxed">
            Seller support:{' '}
            <a href="mailto:jack520088@gmail.com" className="text-primary font-medium hover:underline">
              jack520088@gmail.com
            </a>
            . DMCA and copyright:{' '}
            <a href="mailto:jack520088@gmail.com" className="text-primary font-medium hover:underline">
              jack520088@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function Category({
  Icon,
  title,
  good,
  avoid,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  good: string[];
  avoid: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#fafafa] border border-[#eee] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#555]" />
        </div>
        <h2 className="text-[15px] font-bold text-[#111]">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          <div className="px-4 py-2 text-[11px] font-bold text-emerald-700 uppercase tracking-[1px] bg-emerald-50/60 border-b border-[#eee]">
            Good
          </div>
          {good.map((item, i) => (
            <div
              key={item}
              className={`flex items-start gap-2 px-4 py-2.5 ${i < good.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-[3px] flex-shrink-0" />
              <span className="text-[12px] text-[#555] leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          <div className="px-4 py-2 text-[11px] font-bold text-red-700 uppercase tracking-[1px] bg-red-50/60 border-b border-[#eee]">
            Avoid
          </div>
          {avoid.map((item, i) => (
            <div
              key={item}
              className={`flex items-start gap-2 px-4 py-2.5 ${i < avoid.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
            >
              <X className="w-3.5 h-3.5 text-red-500 mt-[3px] flex-shrink-0" />
              <span className="text-[12px] text-[#555] leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
