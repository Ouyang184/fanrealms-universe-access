
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Globe, CheckCircle } from "lucide-react";

export default function Security() {
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
            Website Security
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Protected by Cloudflare
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            FanRealms is secured by Cloudflare's enterprise-grade security infrastructure, 
            ensuring your data and browsing experience are always protected.
          </p>
        </div>

        {/* Cloudflare Protection */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Cloudflare Security</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Cloudflare is one of the world's largest networks, providing security, performance, 
              and reliability services to millions of websites globally. By routing FanRealms through 
              Cloudflare's network, we ensure maximum protection against various online threats.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">DDoS Protection</h3>
                  <p className="text-gray-300">Advanced protection against distributed denial-of-service attacks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Web Application Firewall</h3>
                  <p className="text-gray-300">Filters malicious traffic and blocks common web exploits.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Comprehensive Security Features</h2>
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">SSL/TLS Encryption</h3>
                <p className="text-gray-300 leading-relaxed">
                  All data transmitted between your browser and FanRealms is encrypted using industry-standard 
                  SSL/TLS protocols, ensuring your personal information remains private and secure.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">Bot Management</h3>
                <p className="text-gray-300 leading-relaxed">
                  Cloudflare's advanced bot management identifies and blocks malicious bots while allowing 
                  legitimate traffic, protecting against automated attacks and spam.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">Rate Limiting</h3>
                <p className="text-gray-300 leading-relaxed">
                  Intelligent rate limiting prevents abuse and ensures fair usage of platform resources 
                  for all users while maintaining optimal performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data Protection */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Privacy & Data Protection</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Your privacy is fundamental to our security approach:
            </p>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Minimal data collection - we only gather what's necessary for platform functionality</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Data encryption at rest and in transit protects your personal information</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Regular security audits ensure our systems meet the highest standards</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>GDPR compliance for users in the European Union</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Transparent privacy policy outlining how we handle your data</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Monitoring & Response */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">24/7 Monitoring & Response</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Our security is continuously monitored and maintained:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Real-time Threat Detection</h3>
                <p className="text-gray-300">Cloudflare's global network continuously monitors for emerging threats and automatically adapts protection measures.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Incident Response</h3>
                <p className="text-gray-300">Our security team is prepared to respond quickly to any potential security incidents or vulnerabilities.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Regular Updates</h3>
                <p className="text-gray-300">We regularly update our security measures and infrastructure to stay ahead of evolving threats.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
