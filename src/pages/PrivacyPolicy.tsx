import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivacyPolicy() {
  const { user } = useAuth();
  const backTo = user ? '/home' : '/';
  const lastUpdated = 'April 2026';

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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-1">Privacy Policy</h1>
          <p className="text-[12px] text-[#aaa]">Last updated: {lastUpdated}</p>
        </div>

        <p className="text-[14px] text-[#555] leading-relaxed">
          FanRealms is an indie creator marketplace. This policy explains what data we collect
          when you use the site, why we collect it, and the choices you have.
        </p>

        <Section title="What we collect">
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              ['Account', 'Email, username, password hash', 'Sign in, notifications'],
              ['Marketplace', 'Products you list, buy, or rate', 'Run the marketplace'],
              ['Payments', 'Card details via Stripe — we never store card numbers', 'Process purchases and payouts'],
              ['Usage', 'IP address, device info, page visits', 'Security, analytics, fraud prevention'],
            ].map(([cat, ex, pur], i, arr) => (
              <div
                key={cat}
                className={`grid grid-cols-[100px_1fr_1fr] gap-3 px-4 py-3 text-[12px] ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <div className="font-semibold text-[#111]">{cat}</div>
                <div className="text-[#666]">{ex}</div>
                <div className="text-[#888]">{pur}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Who we share data with">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li><strong className="text-[#111] font-semibold">Stripe</strong> — processes all payments. We never see your card.</li>
            <li><strong className="text-[#111] font-semibold">Supabase</strong> — our hosting and database provider.</li>
            <li><strong className="text-[#111] font-semibold">Sellers</strong> — see basic buyer info (username, email) for their own sales only.</li>
            <li><strong className="text-[#111] font-semibold">Law enforcement</strong> — only when legally required.</li>
          </ul>
          <p className="text-[13px] text-[#555] leading-relaxed mt-3">
            We do <strong>not</strong> sell personal data, run behavioral ad networks, or share your
            data with data brokers.
          </p>
        </Section>

        <Section title="Your rights">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Download a copy of your data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and all associated data</li>
            <li>Object to processing, or restrict it</li>
          </ul>
          <p className="text-[13px] text-[#555] leading-relaxed mt-3">
            Email <a href="mailto:jake.yanouyang@gmail.com" className="text-primary font-medium hover:underline">jake.yanouyang@gmail.com</a> to exercise any of these rights.
            EU (GDPR) and California (CCPA) residents have additional rights under those laws.
          </p>
        </Section>

        <Section title="Data retention & security">
          <p className="text-[13px] text-[#555] leading-relaxed">
            We keep your data for as long as your account is active and for a reasonable period
            afterward to comply with legal and tax obligations. All data is encrypted at rest and
            in transit. Card numbers are never stored on our servers.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[13px] text-[#555] leading-relaxed">
            Questions about this policy? Email{' '}
            <a href="mailto:jake.yanouyang@gmail.com" className="text-primary font-medium hover:underline">
              jake.yanouyang@gmail.com
            </a>.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">{title}</h2>
      {children}
    </div>
  );
}
