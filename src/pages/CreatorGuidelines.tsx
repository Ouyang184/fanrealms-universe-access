
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, FileText, AlertTriangle, CheckCircle, Camera, Heart } from "lucide-react";

export default function CreatorGuidelines() {
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
            Creator Guidelines
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Guidelines for Creators
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Create meaningful content that connects with your audience while maintaining a safe, 
            respectful environment for all community members.
          </p>
        </div>

        {/* Creator Principles */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Creator Principles</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Authenticity</h3>
                <p className="text-gray-300">Be genuine and true to your creative vision and values.</p>
              </div>
              <div className="text-center">
                <FileText className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Quality Content</h3>
                <p className="text-gray-300">Strive to create valuable, engaging content for your audience.</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Community Respect</h3>
                <p className="text-gray-300">Foster a positive environment for all your subscribers.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Content */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Camera className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">What You Can Create</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              FanRealms welcomes diverse creative content that brings value to your audience:
            </p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">✅ Encouraged Content Types</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Educational tutorials and how-to guides</li>
                  <li>• Behind-the-scenes content and creative processes</li>
                  <li>• Personal stories, experiences, and insights</li>
                  <li>• Artistic creations (visual art, music, writing, etc.)</li>
                  <li>• Entertainment content (comedy, performances, reviews)</li>
                  <li>• Fitness, wellness, and lifestyle content</li>
                  <li>• Gaming content and live streams</li>
                  <li>• Professional advice and industry insights</li>
                  <li>• Community engagement posts and discussions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Content */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <h2 className="text-3xl font-bold text-white">Prohibited Content</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              The following types of content are not permitted on FanRealms as outlined in our Terms of Service:
            </p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-red-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">❌ Strictly Prohibited</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Content involving minors in any inappropriate context</li>
                  <li>• Hate speech, discrimination, or content targeting individuals/groups</li>
                  <li>• Violence, self-harm, or content that promotes dangerous activities</li>
                  <li>• Harassment, bullying, or threatening behavior</li>
                  <li>• Illegal activities or content that violates laws</li>
                  <li>• Copyrighted material without proper authorization</li>
                  <li>• Spam, misleading information, or deceptive practices</li>
                  <li>• Content that violates others' privacy or shares personal information without consent</li>
                  <li>• Impersonation or misrepresentation of identity</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">⚠️ Requires Careful Consideration</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Mature content must be clearly labeled and age-appropriate</li>
                  <li>• Political content should be respectful and avoid inflammatory language</li>
                  <li>• Health and medical advice should include appropriate disclaimers</li>
                  <li>• Financial advice should be clearly marked as opinion, not professional guidance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Quality Standards */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Content Quality Standards</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              To maintain a high-quality platform experience, we encourage creators to follow these best practices:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Original Content</h3>
                <p className="text-gray-300">Create original content or properly attribute and have rights to any third-party material used.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Clear Communication</h3>
                <p className="text-gray-300">Use clear, respectful language and provide accurate descriptions of your content and offerings.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Consistent Delivery</h3>
                <p className="text-gray-300">Honor your commitments to subscribers regarding content frequency, quality, and access levels.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Community Engagement</h3>
                <p className="text-gray-300">Actively engage with your community in a positive, constructive manner.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monetization Guidelines */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Monetization Best Practices</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              When monetizing your content on FanRealms, keep these guidelines in mind:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Fair Pricing</h3>
                <p className="text-gray-300">Set reasonable prices that reflect the value and quality of your content.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Clear Tier Descriptions</h3>
                <p className="text-gray-300">Provide clear, accurate descriptions of what subscribers receive at each tier level.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Deliver on Promises</h3>
                <p className="text-gray-300">Ensure you can consistently deliver the content and perks promised to your subscribers.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Guidelines Enforcement</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Violations of these guidelines may result in content removal, account warnings, temporary suspensions, 
              or permanent account termination, depending on the severity and frequency of violations.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Content Review</h3>
                <p className="text-gray-300">Our moderation team reviews reported content and takes appropriate action based on these guidelines.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Appeals Process</h3>
                <p className="text-gray-300">Creators can appeal moderation decisions through our support system for review.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Support Resources</h3>
                <p className="text-gray-300">We provide resources and guidance to help creators understand and follow these guidelines effectively.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
