
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { ArrowRight, CheckCircle2, Star, Users, Lock, Gift, Sparkles, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-700">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <Badge className="bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 px-3 py-1">
                The creator economy, reimagined
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Support creators. <br />
                <span className="text-purple-400">Get exclusive content.</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-lg">
                FanRealms connects you directly with your favorite creators. Subscribe for exclusive content, community
                access, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800 w-full sm:w-auto">
                    Explore creators
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card required to browse
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl"></div>
              <div className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src="/lovable-uploads/cf5846ed-9cbb-42e6-a9a2-9e05259fb226.png"
                  alt="FanRealms platform preview"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-purple-400">10K+</p>
              <p className="text-gray-400">Creators</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-purple-400">2M+</p>
              <p className="text-gray-400">Subscribers</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-purple-400">50K+</p>
              <p className="text-gray-400">Content pieces</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-purple-400">$5M+</p>
              <p className="text-gray-400">Creator earnings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why creators and fans love FanRealms</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A platform built to empower creators and provide fans with unique experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Gift className="h-8 w-8 text-purple-400" />,
                title: "Exclusive Content",
                description:
                  "Get access to premium content that's not available anywhere else, directly from your favorite creators.",
              },
              {
                icon: <Users className="h-8 w-8 text-purple-400" />,
                title: "Community Access",
                description: "Join private communities where you can interact with creators and like-minded fans.",
              },
              {
                icon: <Lock className="h-8 w-8 text-purple-400" />,
                title: "Direct Support",
                description:
                  "Your subscription directly supports creators, allowing them to continue making the content you love.",
              },
            ].map((feature, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Creators</h2>
              <p className="text-gray-300 mt-2">Discover popular creators across different categories</p>
            </div>
            <Link to="/explore">
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                View all creators
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Digital Art Master",
                handle: "@digitalartist",
                avatar: "DA",
                category: "Art & Illustration",
                subscribers: "25.4K",
                description: "Creating digital art tutorials and exclusive artwork for subscribers.",
                gradient: "from-purple-600 to-pink-600",
              },
              {
                name: "Music Production Hub",
                handle: "@musicpro",
                avatar: "MP",
                category: "Music",
                subscribers: "18.7K",
                description: "Sharing music production tips, sample packs, and unreleased tracks.",
                gradient: "from-blue-600 to-cyan-600",
              },
              {
                name: "Game Dev Insights",
                handle: "@gamedev",
                avatar: "GD",
                category: "Gaming",
                subscribers: "32.1K",
                description: "Behind-the-scenes of game development with exclusive early access.",
                gradient: "from-green-600 to-teal-600",
              },
            ].map((creator, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 overflow-hidden">
                <div className={`h-24 bg-gradient-to-r ${creator.gradient}`} />
                <CardContent className="pt-0 -mt-10 p-6">
                  <Avatar className="h-20 w-20 border-4 border-gray-900">
                    <AvatarFallback className="bg-gray-800 text-xl">{creator.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="mt-4 flex items-center gap-2">
                    <h3 className="text-xl font-bold">{creator.name}</h3>
                    <Badge className="bg-purple-900/50 text-purple-300">Creator</Badge>
                  </div>
                  <p className="text-gray-400 text-sm">{creator.handle}</p>
                  <p className="text-gray-300 mt-3">{creator.description}</p>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{creator.subscribers} subscribers</span>
                    </div>
                    <Link to="/signup">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Subscribe
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How FanRealms Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A simple process to connect with creators and access exclusive content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create an account",
                description: "Sign up for free and set up your profile in just a few minutes.",
              },
              {
                step: "02",
                title: "Discover creators",
                description: "Browse categories or search for your favorite creators.",
              },
              {
                step: "03",
                title: "Subscribe & enjoy",
                description: "Choose a subscription tier and get instant access to exclusive content.",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-4 -top-4 text-6xl font-bold text-purple-600/20">{step.step}</div>
                <Card className="bg-gray-800 border-gray-700 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-300">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Get started now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 px-3 py-1 mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What our users are saying</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Hear from creators and subscribers who are part of the FanRealms community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote:
                  "FanRealms has completely changed how I connect with my audience. I'm able to share exclusive content and build a real community around my work.",
                name: "Alex Rivera",
                role: "Digital Artist",
                avatar: "AR",
                isCreator: true,
              },
              {
                quote:
                  "I love being able to support my favorite creators directly. The exclusive content and community access makes the subscription completely worth it.",
                name: "Jamie Chen",
                role: "Subscriber",
                avatar: "JC",
                isCreator: false,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-lg mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-purple-900/50">{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{testimonial.name}</p>
                        {testimonial.isCreator && <Badge className="bg-purple-900/50 text-purple-300">Creator</Badge>}
                      </div>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-gray-800">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to join FanRealms?</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Create your account today and discover a new way to connect with your favorite creators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                    Sign up for free
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button size="lg" variant="outline" className="border-gray-400 hover:bg-white/10 w-full sm:w-auto">
                    Explore creators
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold mb-4">FanRealms</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-sm text-gray-400 hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/press" className="text-sm text-gray-400 hover:text-white">
                    Press
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-gray-400 hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-sm text-gray-400 hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="text-sm text-gray-400 hover:text-white">
                    Safety Center
                  </Link>
                </li>
                <li>
                  <Link to="/guidelines" className="text-sm text-gray-400 hover:text-white">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-400 hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-sm text-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-sm text-gray-400 hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/copyright" className="text-sm text-gray-400 hover:text-white">
                    Copyright Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Creators</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/creator-studio" className="text-sm text-gray-400 hover:text-white">
                    Start Creating
                  </Link>
                </li>
                <li>
                  <Link to="/creator-resources" className="text-sm text-gray-400 hover:text-white">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link to="/creator-guidelines" className="text-sm text-gray-400 hover:text-white">
                    Creator Guidelines
                  </Link>
                </li>
                <li>
                  <Link to="/creator-faq" className="text-sm text-gray-400 hover:text-white">
                    Creator FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} FanRealms. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
