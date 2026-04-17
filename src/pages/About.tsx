import { Link } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ShoppingBag, Gamepad2, Briefcase, MessageSquare, Shield } from "lucide-react";

export default function About() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] mb-2">About FanRealms</h1>
          <p className="text-[15px] text-[#666] leading-relaxed">
            FanRealms is an indie creator marketplace for game developers, artists, and freelancers.
            It's a place to buy and sell digital assets, showcase indie games, find work, and connect
            with other people building things.
          </p>
        </div>

        {/* What you can do */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">What you can do</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { Icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell game art, templates, tools, music, and other digital assets." },
              { Icon: Gamepad2, title: "Games", desc: "List your indie game and get it in front of the FanRealms community." },
              { Icon: Briefcase, title: "Jobs", desc: "Post or find freelance gigs, bounties, and contract work." },
              { Icon: MessageSquare, title: "Forum", desc: "Share devlogs, ask questions, and talk with other creators." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#eee] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#555]" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#111]">{title}</div>
                  <div className="text-[12px] text-[#888] mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments & safety */}
        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#eee] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#555]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#111] mb-1">Payments are handled by Stripe</div>
            <p className="text-[13px] text-[#777] leading-relaxed">
              We never store your card details. All transactions go through Stripe, one of the most
              trusted payment processors in the world. Sellers receive payouts directly to their bank
              account via Stripe Connect.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Pricing</h2>
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {[
              { label: "Sign up", value: "Free" },
              { label: "Browse & buy", value: "Free" },
              { label: "List assets for sale", value: "Free" },
              { label: "Platform fee on sales", value: "10%" },
              { label: "Payment processing (Stripe)", value: "~2.9% + 30¢" },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between px-4 py-3 text-[13px] ${i < arr.length - 1 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <span className="text-[#666]">{label}</span>
                <span className="font-semibold text-[#111]">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#aaa]">No monthly subscription required to sell. You only pay when you make a sale.</p>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px]">Contact</h2>
          <p className="text-[13px] text-[#666]">
            Questions or issues? Email us at{" "}
            <a href="mailto:support@fanrealms.com" className="text-primary font-medium hover:underline">
              support@fanrealms.com
            </a>
            . We usually respond within a day.
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3 pt-2">
          <Link
            to="/signup"
            className="px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors"
          >
            Create an account
          </Link>
          <Link
            to="/marketplace"
            className="px-5 py-2.5 text-[13px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors"
          >
            Browse marketplace
          </Link>
        </div>

      </div>
    </MainLayout>
  );
}
