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
          <p className="text-[12px] text-[#aaa]">Last updated: June 2026</p>
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
            <li>You keep full ownership of your work. By listing on FanRealms you grant us a non-exclusive, worldwide license to host, display, and distribute your content solely for the purpose of operating the platform.</li>
            <li>You must own or have the legal right to sell every asset you list. Do not upload content you did not create or do not have rights to.</li>
            <li>FanRealms charges a <strong className="text-[#111] font-semibold">platform fee of 1–5%</strong> per sale — you choose your own rate in your account settings. The default is 5%. Stripe's payment processing fee (~2.9% + 30¢) is separate and deducted by Stripe.</li>
            <li>You keep the remaining revenue after fees. Payouts are processed via Stripe Connect. You are solely responsible for reporting and paying any applicable taxes on your earnings.</li>
            <li>If you delete your account, your listed assets will be removed from the marketplace. Existing buyers retain access to assets they have already purchased.</li>
            <li>No pirated content, stolen assets, malware, AI-generated content that violates third-party rights, or content you do not have rights to distribute.</li>
            <li>Your content may not be listed on FanRealms at a higher price than on other platforms without good reason. Buyers on FanRealms should get a fair deal.</li>
          </ul>
        </Section>

        <Section title="3. Buying on the marketplace">
          <ul className="text-[13px] text-[#555] leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Digital products are generally final-sale. Refunds are handled case-by-case for items that are broken, misrepresented, or fail to deliver as described — contact us at <a href="mailto:jack520088@gmail.com" className="text-primary hover:underline">jack520088@gmail.com</a>.</li>
            <li>When you purchase an asset you receive a personal, non-exclusive license to use it in your projects as described by the seller on the listing page.</li>
            <li>You may not redistribute, resell, sublicense, or share purchased assets unless the seller's license explicitly permits it.</li>
            <li>FanRealms is not responsible for the quality, accuracy, or fitness for purpose of third-party assets. All sales involve a transaction between you and the creator — FanRealms facilitates but is not a party to that agreement.</li>
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

        <Section title="8. Governing law">
          <p className="text-[13px] text-[#555] leading-relaxed">
            These terms are governed by applicable law. Disputes will be resolved in good faith.
            Nothing in these terms limits your rights under applicable consumer protection laws
            in your jurisdiction.
          </p>
        </Section>

        <Section title="9. Changes">
          <p className="text-[13px] text-[#555] leading-relaxed">
            We may update these terms as the platform evolves. Material changes will be announced
            via email or a site notice at least 7 days before taking effect. Continued use of
            FanRealms after changes constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[13px] text-[#555] leading-relaxed">
            Questions? Email{' '}
            <a href="mailto:jack520088@gmail.com" className="text-primary font-medium hover:underline">
              jack520088@gmail.com
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
