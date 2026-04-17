import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function Terms() {
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
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-1">Terms of Service</h1>
          <p className="text-[12px] text-[#aaa]">Last updated: April 2026</p>
        </div>

        <p className="text-[14px] text-[#555] leading-relaxed">
          These terms govern your use of FanRealms — the indie creator marketplace for digital
          assets, indie games, freelance work, and community. By using the site you agree to
          these terms.
        </p>

        <Section title="1. Using the platform">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>You must be at least 13 years old to create an account (16 in the EEA).</li>
            <li>You're responsible for keeping your account credentials secure.</li>
            <li>You won't try to bypass security, scrape at scale, or overload the service.</li>
          </ul>
        </Section>

        <Section title="2. Selling on the marketplace">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>You keep ownership of your work. You grant us a license to host and display it.</li>
            <li>You must own or have the right to sell every asset you list.</li>
            <li>FanRealms takes a <strong className="text-[#111] font-semibold">10% platform fee</strong> on each sale. Stripe's processing fee (~2.9% + 30¢) is separate.</li>
            <li>Payouts are handled by Stripe Connect. You're responsible for your own taxes.</li>
            <li>No pirated content, stolen assets, malware, or AI-generated content that violates third-party rights.</li>
          </ul>
        </Section>

        <Section title="3. Buying on the marketplace">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Digital products are generally final-sale. Refunds are handled case-by-case for broken or misrepresented items.</li>
            <li>Licenses for purchased assets are defined by the seller on each listing.</li>
            <li>Don't redistribute or resell purchased assets unless the license explicitly allows it.</li>
          </ul>
        </Section>

        <Section title="4. Jobs & forum">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Job posts must describe real work with a real budget. No MLM, no spam, no paid reviews.</li>
            <li>Freelance agreements are between the buyer and seller. FanRealms is not a party to them.</li>
            <li>Forum posts must follow the <Link to="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>.</li>
          </ul>
        </Section>

        <Section title="5. Prohibited content">
          <p className="text-[13px] text-[#555] leading-relaxed mb-2">
            You may not upload or list:
          </p>
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Content that infringes copyright, trademark, or other IP rights</li>
            <li>Malware, keyloggers, or anything designed to harm users or systems</li>
            <li>Content that sexualizes minors, promotes real-world violence, or encourages self-harm</li>
            <li>Harassment, hate speech, or targeted abuse</li>
          </ul>
        </Section>

        <Section title="6. Account suspension & termination">
          <p className="text-[13px] text-[#555] leading-relaxed">
            We may suspend or terminate accounts that violate these terms, receive repeated
            chargebacks, or are used for fraud. You can close your account at any time from Settings.
          </p>
        </Section>

        <Section title="7. Disclaimers & liability">
          <p className="text-[13px] text-[#555] leading-relaxed">
            FanRealms is provided "as is". We're not liable for indirect damages, lost profits,
            or data loss, to the fullest extent allowed by law. Nothing here limits your rights
            under applicable consumer protection laws.
          </p>
        </Section>

        <Section title="8. Changes">
          <p className="text-[13px] text-[#555] leading-relaxed">
            We may update these terms as the platform evolves. Material changes will be announced
            via email or a site notice.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[13px] text-[#555] leading-relaxed">
            Questions? Email{' '}
            <a href="mailto:legal@fanrealms.com" className="text-primary font-medium hover:underline">
              legal@fanrealms.com
            </a>.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">{title}</h2>
      {children}
    </div>
  );
}
