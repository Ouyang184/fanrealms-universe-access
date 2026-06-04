import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatorFAQ() {
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
          <h1 className="text-[26px] font-bold tracking-[-0.5px] mb-2">Creator FAQ</h1>
          <p className="text-[14px] text-[#666] leading-relaxed">
            Everything you need to know about selling your work on FanRealms — fees,
            payouts, ownership, and getting started.
          </p>
        </div>

        <Faq q="How much of each sale do I keep?">
          Up to <strong>99%</strong>. You set your own platform fee between 1% and 5% in
          your account settings — the default is 5%, so you keep 95%. The only other
          deduction is Stripe's standard payment processing fee (~2.9% + 30¢), which goes
          to Stripe, not us.
        </Faq>

        <Faq q="Does my asset have to be exclusive to FanRealms?">
          No. There's no exclusivity. You can keep selling the exact same asset on itch.io,
          GitHub, your own site, or anywhere else. FanRealms is just one more place to sell.
        </Faq>

        <Faq q="Who owns my work?">
          You do — 100%. By listing on FanRealms you grant us a license to host and display
          your asset so we can sell it for you, but you keep full ownership and all rights.
          We never use, resell, or claim your work as our own. Delete your listing anytime.
        </Faq>

        <Faq q="How do I get paid?">
          Payouts run through <strong>Stripe Connect</strong>. You connect your Stripe
          account once in your dashboard (Settings → Payouts), and earnings from your sales
          are paid out to your bank automatically. You're responsible for your own taxes.
        </Faq>

        <Faq q="How do I start selling?">
          Three steps: <strong>1)</strong> Create a free account and pick a username.{' '}
          <strong>2)</strong> Go to your dashboard and click “Upload an asset.”{' '}
          <strong>3)</strong> Add a title, description, price, cover image, and your file
          (or an external download link), then publish. That's it — your asset is live on
          the marketplace.
        </Faq>

        <Faq q="What can I sell?">
          Game assets of any kind — sprites, tilesets, UI kits, shaders, fonts, animations,
          3D models, music, sound effects, plugins, templates, and complete projects. Built
          for Godot creators, but assets for any engine are welcome.
        </Faq>

        <Faq q="Can I run my own sales and discounts?">
          Yes. When editing a paid asset you can set a <strong>sale price</strong> — buyers
          see the original price crossed out, your discounted price, and a “% OFF” badge.
          Clear the field anytime to end the sale. You control your own pricing completely.
        </Faq>

        <Faq q="How do refunds work?">
          Digital products are generally final-sale, but refunds are handled case-by-case for
          items that are broken or not as described. As the creator you're the first point of
          contact, and we'll help mediate if needed.
        </Faq>

        <Faq q="Is there a cost to list?">
          No. Listing is completely free. We only take your chosen 1–5% platform fee when an
          asset actually sells. No monthly fees, no listing fees.
        </Faq>

        <Faq q="Can I sell AI-assisted assets?">
          Yes, as long as you have the rights to everything in the pack and it doesn't
          infringe anyone else's work. Be honest in your description about how it was made —
          buyers appreciate transparency.
        </Faq>

        <div className="border-t border-[#eee] pt-8">
          <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-6 text-center">
            <h2 className="text-[18px] font-bold mb-2">Ready to list your first asset?</h2>
            <p className="text-[13px] text-[#666] mb-4">
              It's free, takes a few minutes, and you keep up to 99% of every sale.
            </p>
            <Link
              to={user ? '/dashboard/assets/new' : '/signup'}
              className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
            >
              {user ? 'Upload an asset →' : 'Create a free account →'}
            </Link>
          </div>
          <p className="text-[12px] text-[#999] text-center mt-4">
            Still have questions? Email{' '}
            <a href="mailto:jack520088@gmail.com" className="text-primary hover:underline">
              jack520088@gmail.com
            </a>{' '}
            · See also the{' '}
            <Link to="/creator-guidelines" className="text-primary hover:underline">
              Seller Guidelines
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-[15px] font-bold text-[#111]">{q}</h2>
      <p className="text-[13px] text-[#555] leading-relaxed">{children}</p>
    </div>
  );
}
