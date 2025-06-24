import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Star, Shield, Mail, Twitter, Instagram, ArrowLeft } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Simple Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            About FanRealms
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Empowering creators to build meaningful connections with their fans through 
            innovative subscription-based content sharing and community building.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              At FanRealms, we believe every creator deserves a platform where they can share their passion, 
              build authentic relationships with their audience, and earn sustainable income doing what they love. 
              We're democratizing content creation by providing tools that put creators first and fans second to none.
            </p>
          </CardContent>
        </Card>

        {/* Our Story */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                FanRealms was born from a simple observation: creators were struggling to monetize 
                their content while maintaining genuine connections with their audience. Existing 
                platforms took large cuts, imposed restrictive policies, and treated creators as 
                expendable resources.
              </p>
              <p>
                We envisioned a different future—one where creators have complete control over 
                their content, fair revenue sharing, and direct relationships with their fans. 
                FanRealms represents this vision: a realm where creativity thrives and fans 
                truly support the creators they love.
              </p>
              <p>
                Since our inception, we've focused on building not just a platform, but a 
                community that celebrates authentic content creation and meaningful fan engagement.
              </p>
            </div>
          </div>
          <div className="lg:pl-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">What Sets Us Apart</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Creator-First Approach</h4>
                    <p className="text-sm text-muted-foreground">Fair revenue sharing and creator-friendly policies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Content Protection</h4>
                    <p className="text-sm text-muted-foreground">Advanced security and copyright protection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Community Focus</h4>
                    <p className="text-sm text-muted-foreground">Tools that foster genuine fan-creator relationships</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Team</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            FanRealms is built by a passionate team of creators, developers, and community advocates 
            who understand the challenges of content creation firsthand.
          </p>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold mb-2">The FanRealms Team</h3>
              <p className="text-sm text-muted-foreground">
                A diverse group of creators, engineers, and community builders working 
                together to revolutionize the creator economy.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white mb-16">
          <h2 className="text-3xl font-bold mb-4">Join the FanRealms Community</h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you're a creator looking to monetize your passion or a fan wanting to 
            support your favorite creators, FanRealms is your gateway to authentic connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">Start Creating</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Link to="/explore">Discover Creators</Link>
            </Button>
          </div>
        </div>

        {/* Contact Section */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions, feedback, or want to learn more about FanRealms? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild variant="outline">
                <a href="mailto:hello@fanrealms.com" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  hello@fanrealms.com
                </a>
              </Button>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" asChild>
                  <a href="https://twitter.com/fanrealms" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4" />
                    <span className="sr-only">Twitter</span>
                  </a>
                </Button>
                <Button size="icon" variant="ghost" asChild>
                  <a href="https://instagram.com/fanrealms" target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4" />
                    <span className="sr-only">Instagram</span>
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
