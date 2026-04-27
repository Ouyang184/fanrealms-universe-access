import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ShoppingBag, Gamepad2, Briefcase, MessageSquare } from 'lucide-react';

export default function Support() {
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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-2">Help & support</h1>
          <p className="text-[14px] text-[#666] leading-relaxed">
            Need help buying or selling on FanRealms? Have a question about a job listing
            or a marketplace dispute? We're here to help.
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Contact us</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              { label: 'General support', email: 'support@fanrealms.com', desc: 'Account, buying, selling, payouts' },
              { label: 'Marketplace disputes', email: 'disputes@fanrealms.com', desc: 'Refunds, chargebacks, seller issues' },
              { label: 'Legal & DMCA', email: 'jake.yanouyang@gmail.com', desc: 'Takedowns, copyright, trademarks' },
            ].map(({ label, email, desc }, i, arr) => (
              <div
                key={email}
                className={`flex items-start gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <Mail className="w-4 h-4 text-[#888] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#111]">{label}</div>
                  <div className="text-[12px] text-[#888] mt-0.5">{desc}</div>
                </div>
                <a href={`mailto:${email}`} className="text-[12px] font-medium text-primary hover:underline whitespace-nowrap">
                  {email}
                </a>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#aaa]">We typically respond within 24 hours on weekdays.</p>
        </div>

        {/* Common topics */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Common questions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                Icon: ShoppingBag,
                title: 'Buying & selling',
                items: ['Refund policy', 'Payment failures', 'Download issues', 'Seller payouts'],
              },
              {
                Icon: Gamepad2,
                title: 'Listing a game',
                items: ['Submission guidelines', 'Editing your listing', 'Removing a game'],
              },
              {
                Icon: Briefcase,
                title: 'Jobs',
                items: ['Posting a gig', 'Dispute resolution', 'Escrow / payments'],
              },
              {
                Icon: MessageSquare,
                title: 'Forum & community',
                items: ['Reporting a user', 'Thread moderation', 'Account suspensions'],
              },
            ].map(({ Icon, title, items }) => (
              <div key={title} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#eee] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[#555]" />
                  </div>
                  <div className="text-[13px] font-bold text-[#111]">{title}</div>
                </div>
                <ul className="text-[12px] text-[#666] space-y-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="text-[#ccc]">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
