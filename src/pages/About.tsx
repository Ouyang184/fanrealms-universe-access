
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Users, Heart, Zap, Globe, Mail, Twitter, Instagram, ArrowLeft } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-white hover:bg-white/10 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-600 hover:bg-purple-700">
            About FanRealms
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Empowering Creators, Connecting Communities
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            FanRealms is the premier platform where creators and their most passionate fans come together 
            to build meaningful, sustainable communities through exclusive content and direct connections.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              We believe every creator deserves the tools and community to turn their passion into prosperity. 
              FanRealms bridges the gap between creators and their audience, fostering genuine connections 
              through exclusive content, direct messaging, and flexible membership options. Our platform 
              empowers creators to monetize their work while giving fans unprecedented access to the 
              content and creators they love most.
            </p>
          </CardContent>
        </Card>

        {/* Our Story */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Our Story</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              FanRealms was born from a simple observation: creators were struggling to build sustainable 
              careers while maintaining authentic connections with their communities. Traditional social 
              media platforms prioritized algorithms over relationships, and existing creator platforms 
              were either too restrictive or too complex.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              We set out to create something different - a platform that puts creators first, values 
              authentic fan relationships, and provides the flexibility needed for diverse creative 
              endeavors. From artists and writers to educators and entertainers, FanRealms is designed 
              to support creators across all genres and niches.
            </p>
          </CardContent>
        </Card>

        {/* Key Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Creator-First</h3>
              <p className="text-gray-300">
                Every feature we build starts with one question: How does this help creators succeed?
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Authentic Connections</h3>
              <p className="text-gray-300">
                We foster genuine relationships between creators and fans, not just transactions.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Global Community</h3>
              <p className="text-gray-300">
                Connecting creators and fans from every corner of the world in one inclusive space.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Our Team</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              FanRealms is built by a passionate team of creators, developers, and community builders 
              who understand the challenges facing modern content creators. Our diverse backgrounds 
              in technology, design, and creative industries inform every decision we make. We're not 
              just building a platform - we're crafting the future of creator economy.
            </p>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join the FanRealms Community?
            </h2>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Whether you're a creator looking to monetize your passion or a fan seeking exclusive 
              content from your favorite creators, FanRealms is your gateway to authentic connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                <Link to="/explore">Explore Creators</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-white mb-6">Get in Touch</h3>
          <p className="text-gray-300 mb-6">
            Have questions, feedback, or want to partner with us? We'd love to hear from you.
          </p>
          <div className="flex justify-center items-center gap-6">
            <a 
              href="mailto:hello@fanrealms.com" 
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Mail className="h-5 w-5" />
              hello@fanrealms.com
            </a>
            <a 
              href="https://twitter.com/fanrealms" 
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5" />
              @fanrealms
            </a>
            <a 
              href="https://instagram.com/fanrealms" 
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5" />
              @fanrealms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
