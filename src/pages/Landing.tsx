import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, ShoppingBag, Briefcase, MessageSquare, Code, Palette, Gamepad2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
            <Link to="/forum" className="hover:text-foreground transition-colors">Forum</Link>
          </nav>
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
      <section className="py-24 sm:py-32 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Where indie creators
            <span className="text-primary"> build, share, and earn.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            A marketplace, job board, and community for developers, artists, and game makers.
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

      {/* Three Pillars */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Marketplace */}
            <Link to="/marketplace" className="group block">
              <div className="border border-border/60 rounded-lg p-6 h-full hover:border-primary/40 hover:bg-card transition-all duration-200">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Marketplace</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Buy and sell digital assets, game templates, tools, plugins, and creative resources.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Game Assets</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Tools</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Templates</span>
                </div>
              </div>
            </Link>

            {/* Job Board */}
            <Link to="/jobs" className="group block">
              <div className="border border-border/60 rounded-lg p-6 h-full hover:border-primary/40 hover:bg-card transition-all duration-200">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Job Board</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Find freelance gigs, bounties, and contract work from studios and indie teams.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Freelance</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Bounties</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Contract</span>
                </div>
              </div>
            </Link>

            {/* Forum */}
            <Link to="/forum" className="group block">
              <div className="border border-border/60 rounded-lg p-6 h-full hover:border-primary/40 hover:bg-card transition-all duration-200">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Forum</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Post devlogs, share progress, get feedback, and connect with other makers.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Devlogs</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Feedback</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Discussion</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories / Who it's for */}
      <section className="py-20 px-6 border-t border-border/40 bg-card/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Built for makers of all kinds</h2>
          <p className="text-muted-foreground mb-12">Whether you're building games, tools, or art — there's a place for you here.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { icon: Gamepad2, label: "Game Devs" },
              { icon: Code, label: "Developers" },
              { icon: Palette, label: "Artists" },
              { icon: ShoppingBag, label: "Asset Creators" },
              { icon: Briefcase, label: "Freelancers" },
              { icon: MessageSquare, label: "Writers" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border/60 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-16 text-foreground">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "Create your profile", desc: "Set up your creator page with your projects, skills, and what you offer." },
              { num: "02", title: "Share your work", desc: "Post devlogs, list digital products, or find gigs on the job board." },
              { num: "03", title: "Grow and earn", desc: "Connect with buyers and collaborators. Get paid directly through Stripe." },
            ].map((step) => (
              <div key={step.num}>
                <span className="text-sm font-mono text-primary">{step.num}</span>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Create your account
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                Explore first
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
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
