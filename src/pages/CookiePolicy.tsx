import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function CookiePolicy() {
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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-1">Cookie Policy</h1>
          <p className="text-[12px] text-[#aaa]">Last updated: April 2026</p>
        </div>

        <p className="text-[14px] text-[#555] leading-relaxed">
          FanRealms uses a small number of cookies to keep you signed in, remember your
          preferences, and protect the marketplace from fraud. We don't use third-party
          advertising cookies.
        </p>

        <Section title="Essential cookies">
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              ['Auth session', 'Keeps you logged in', 'Required'],
              ['CSRF token', 'Protects forms from abuse', 'Required'],
              ['Stripe session', 'Secures checkout', 'Required'],
            ].map(([name, purpose, status], i, arr) => (
              <div
                key={name}
                className={`grid grid-cols-[140px_1fr_auto] gap-3 px-4 py-3 text-[12px] items-center ${i < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <div className="font-semibold text-[#111]">{name}</div>
                <div className="text-[#666]">{purpose}</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666]">
                  {status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#aaa]">These can't be disabled — the site won't function without them.</p>
        </Section>

        <Section title="Analytics">
          <p className="text-[13px] text-[#555] leading-relaxed">
            We use privacy-friendly analytics to count page views and understand broad usage
            patterns. No cross-site tracking, no advertising IDs, no user profiles sold.
          </p>
        </Section>

        <Section title="Managing cookies">
          <p className="text-[13px] text-[#555] leading-relaxed">
            You can block or delete cookies in your browser settings. Blocking essential cookies
            will prevent you from signing in or purchasing items.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[13px] text-[#555] leading-relaxed">
            Questions? Email{' '}
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
