import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, Server, AlertTriangle } from 'lucide-react';

export default function Security() {
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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-1">Security</h1>
          <p className="text-[14px] text-[#555] leading-relaxed">
            How FanRealms protects your account, data, and purchases.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Platform security</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'All data encrypted in transit and at rest via TLS + AES-256',
              'Hosted on Supabase — enterprise-grade PostgreSQL with row-level security',
              'Payments handled by Stripe (PCI DSS Level 1 certified) — we never store card numbers',
              'DDoS and bot protection via Cloudflare',
            ].map((item, i, arr) => (
              <div
                key={item}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <Server className="w-3.5 h-3.5 text-[#555] mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Your account</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              'Use a strong, unique password for your FanRealms account',
              'Never share your login credentials with anyone',
              'Log out on shared or public devices',
              'Check your email for any unexpected login notifications',
            ].map((item, i, arr) => (
              <div
                key={item}
                className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <Lock className="w-3.5 h-3.5 text-[#555] mt-[3px] flex-shrink-0" />
                <span className="text-[13px] text-[#555]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">Report a vulnerability</div>
            <p className="text-[13px] text-[#666] leading-relaxed">
              Found a security issue? Email{' '}
              <a href="mailto:security@fanrealms.com" className="text-primary font-medium hover:underline">
                security@fanrealms.com
              </a>{' '}
              with a description. We take all reports seriously and aim to respond within 48 hours.
            </p>
          </div>
        </div>

        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">DMCA / content issues</div>
            <p className="text-[13px] text-[#666] leading-relaxed">
              To report stolen assets, copyright infringement, or DMCA takedown requests, email{' '}
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
