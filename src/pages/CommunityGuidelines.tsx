import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Flag } from 'lucide-react';

export default function CommunityGuidelines() {
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

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-2">Community guidelines</h1>
          <p className="text-[14px] text-[#666] leading-relaxed">
            FanRealms is a marketplace and community for indie developers, artists, and
            freelancers. These rules keep it useful for everyone — buyers, sellers, and
            forum participants alike.
          </p>
        </div>

        {/* Do */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Do</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'Post honest reviews of things you actually bought or used',
              'Credit original creators when sharing or remixing assets',
              'Share devlogs, work-in-progress, and early prototypes',
              'Ask for feedback — this is a community of builders',
              'Report bugs, spam, or bad actors using the Report button',
            ].map((rule, i, arr) => (
              <div
                key={rule}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Don't */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Don't</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'Upload stolen or pirated assets, or content you don\'t have the rights to',
              'List malware, keyloggers, or deliberately broken files',
              'Write fake reviews or manipulate ratings',
              'Spam the forum with self-promotion, referral links, or duplicate posts',
              'Harass, threaten, or target other users',
              'Post NSFW or 18+ content outside of properly tagged channels',
            ].map((rule, i, arr) => (
              <div
                key={rule}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <X className="w-3.5 h-3.5 text-red-500 mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enforcement */}
        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <Flag className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">How we enforce this</div>
            <p className="text-[13px] text-[#666] leading-relaxed">
              First offense is usually a warning. Repeated or serious violations result in content
              removal, suspension, or a permanent ban. You can appeal any action by emailing{' '}
              <a href="mailto:jack520088@gmail.com" className="text-primary font-medium hover:underline">
                jack520088@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
