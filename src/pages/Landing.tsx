
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { ArrowRight, CheckCircle2, Sparkles, ChevronRight, Heart, Users, Star } from "lucide-react";
import heroBackground from "@/assets/hero-bg-1.jpg";
import heroBackground2 from "@/assets/hero-bg-2.jpg";
import creatorBackground from "@/assets/creator-bg.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center w-full">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 px-3 sm:px-4">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 px-4 sm:px-6">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-6 overflow-hidden pt-20">
        {/* Background Images */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/50 to-blue-900/20"></div>
          <img 
            src={heroBackground} 
            alt="" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-700"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <Badge className="bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 px-4 py-2 text-sm font-medium border border-purple-700/30 transition-all duration-200 hover:scale-105">
                <Sparkles className="w-4 h-4 mr-2" />
                The creator economy, reimagined
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    Support creators.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                    Get exclusive content.
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-gray-300 max-w-xl leading-relaxed">
                  Join the premier platform where creators thrive and fans connect. Subscribe for exclusive content, 
                  behind-the-scenes access, and direct creator interaction.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link to="/signup" className="group">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25">
                    <Heart className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Start supporting creators
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/explore" className="group">
                  <Button size="lg" variant="outline" className="border-gray-600 hover:bg-gray-800/50 w-full sm:w-auto transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                    <Users className="mr-2 h-5 w-5" />
                    Discover creators
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  Free to browse and discover
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  Growing creator community
                </div>
              </div>
            </div>
            
            <div className="relative lg:ml-8 animate-fade-in animation-delay-300">
              {/* Floating cards like Patreon */}
              <div className="relative">
                {/* Main preview card */}
                <div className="relative z-10 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:rotate-1">
                  <img
                    src="/lovable-uploads/cf5846ed-9cbb-42e6-a9a2-9e05259fb226.png"
                    alt="FanRealms platform preview"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
                </div>
                
                
                {/* Background glow */}
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Spotlight Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="absolute inset-0 z-0">
          <img 
            src={creatorBackground} 
            alt="" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/90"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
              Empowering Creators Worldwide
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Join thousands of creators who have built thriving communities and sustainable income streams
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Set up your creator profile with custom branding, tiers, and exclusive content offerings.",
                icon: "👤",
              },
              {
                step: "02", 
                title: "Build Your Community",
                description: "Connect with fans through posts, live streams, and exclusive behind-the-scenes content.",
                icon: "🎨",
              },
              {
                step: "03",
                title: "Earn & Grow",
                description: "Receive monthly payments from supporters and scale your creative business.",
                icon: "💰",
              },
            ].map((step, index) => (
              <div key={index} className="group relative animate-fade-in" style={{animationDelay: `${index * 200}ms`}}>
                <div className="absolute -left-4 -top-4 text-6xl font-bold text-purple-600/20 group-hover:text-purple-500/30 transition-colors duration-300">{step.step}</div>
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 h-full backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10">
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/signup" className="group">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25">
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-spin" />
                Start Your Creator Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black"></div>
          <img 
            src={heroBackground2} 
            alt="" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <Card className="bg-gradient-to-br from-gray-900/80 via-purple-900/20 to-gray-900/80 border border-purple-500/30 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"></div>
                <Sparkles className="h-16 w-16 mx-auto text-purple-400 relative z-10 animate-pulse" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent leading-tight">
                Ready to Transform Your Creativity?
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
                Join thousands of creators and supporters who have discovered a better way to connect, 
                create, and earn. Your creative journey starts here.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link to="/signup" className="group">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-8 py-4 text-lg w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25">
                    <Heart className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Join FanRealms Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <Link to="/explore" className="group">
                  <Button size="lg" variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg w-full sm:w-auto transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                    <Users className="mr-2 h-5 w-5" />
                    Browse Creators
                  </Button>
                </Link>
              </div>
              
              <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  No setup fees
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 pt-12 sm:pt-16 mt-12 sm:mt-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white mb-4">FanRealms</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/payments" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Payments
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/help" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/community-guidelines" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/terms" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-policy" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/copyright-policy" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Copyright Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white mb-4">Creators</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/creator-guidelines" className="text-sm text-gray-400 hover:text-purple-300 transition-colors duration-200">
                    Creator Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800/50 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} FanRealms. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-all duration-200 hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-all duration-200 hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-all duration-200 hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
