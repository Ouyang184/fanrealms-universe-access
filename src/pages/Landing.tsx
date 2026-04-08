import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            The indie marketplace for creators and makers.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Showcase projects, post devlogs, find work, and sell your expertise — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/explore">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Browse Projects
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                Start creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-border/40">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-16 text-foreground">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: "01",
                title: "Create your profile",
                desc: "Set up your creator page with your projects, skills, and what you offer.",
              },
              {
                num: "02",
                title: "Share your work",
                desc: "Post devlogs, list digital products, or offer your expertise on the job board.",
              },
              {
                num: "03",
                title: "Grow and earn",
                desc: "Connect with buyers and collaborators. Get paid for your work directly.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span className="text-sm font-mono text-muted-foreground">{step.num}</span>
                <h3 className="text-lg font-medium text-foreground mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border/40">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Join a growing community of indie creators, developers, and artists.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Create your account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 mt-12">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-medium text-foreground mb-3 text-sm">FanRealms</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/payments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Payments</Link></li>
                <li><Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-3 text-sm">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="/community-guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guidelines</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-3 text-sm">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/cookie-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookies</Link></li>
                <li><Link to="/copyright-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Copyright</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-3 text-sm">Creators</h3>
              <ul className="space-y-2">
                <li><Link to="/creator-guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Creator Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6">
            <p className="text-xs text-muted-foreground">© 2025 FanRealms LLC — Arkansas, USA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
