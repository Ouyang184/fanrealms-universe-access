import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, DollarSign, AlertTriangle } from 'lucide-react';

export default function Payments() {
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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-1">Payments</h1>
          <p className="text-[14px] text-[#555] leading-relaxed">
            How buying and selling works on FanRealms.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Buying</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'All payments are processed by Stripe — PCI DSS Level 1 certified',
              'We never store your card number',
              'Accepted: Visa, Mastercard, Amex, Apple Pay, Google Pay',
              'Digital products are generally final-sale — refunds handled case-by-case for broken or misrepresented items',
            ].map((item, i, arr) => (
              <div
                key={item}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <CreditCard className="w-3.5 h-3.5 text-[#555] mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Selling & payouts</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'FanRealms takes a 10% platform fee on each sale',
              "Stripe's processing fee (~2.9% + 30¢) is separate and deducted automatically",
              'Payouts go through Stripe Connect directly to your bank account',
              'Payout timing: typically 2–7 business days depending on your bank',
              'You are responsible for your own taxes and VAT',
            ].map((item, i, arr) => (
              <div
                key={item}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <DollarSign className="w-3.5 h-3.5 text-[#555] mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">Disputes</div>
            <p className="text-[13px] text-[#666] leading-relaxed">
              Marketplace disputes — refunds, chargebacks, seller issues — are handled by our team.
              Email{' '}
              <a href="mailto:disputes@fanrealms.com" className="text-primary font-medium hover:underline">
                disputes@fanrealms.com
              </a>{' '}
              with your order details.
            </p>
          </div>
        </div>

        <p className="text-[13px] text-[#555] leading-relaxed">
          Questions about a payment? Email{' '}
          <a href="mailto:jack520088@gmail.com" className="text-primary font-medium hover:underline">
            jack520088@gmail.com
          </a>.
        </p>
      </main>
    </div>
  );
}
