
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const steps = [
    { num: "1", title: "Discover", desc: "Browse projects, products, and creators across the marketplace." },
    { num: "2", title: "Connect", desc: "Follow creators, hire for gigs, or purchase digital products." },
    { num: "3", title: "Build", desc: "Showcase your own work, post devlogs, and grow your audience." },
  ];

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-8">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.num}>
            <span className="text-sm font-mono text-muted-foreground">{step.num}.</span>
            <h3 className="text-lg font-medium mt-1">{step.title}</h3>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Link to="/explore">
          <Button variant="outline">Get started</Button>
        </Link>
      </div>
    </section>
  );
}
