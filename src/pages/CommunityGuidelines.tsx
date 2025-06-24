
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageCircle, Heart, AlertTriangle, CheckCircle } from "lucide-react";

export default function CommunityGuidelines() {
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
            Community Guidelines
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Building a Respectful Community
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            FanRealms is built on respect, creativity, and meaningful connections. These guidelines 
            help ensure our community remains a safe and welcoming space for everyone.
          </p>
        </div>

        {/* Community Values */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Our Community Values</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Respect</h3>
                <p className="text-gray-300">Treat all community members with dignity and kindness.</p>
              </div>
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Constructive Communication</h3>
                <p className="text-gray-300">Engage in meaningful, supportive conversations.</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Authenticity</h3>
                <p className="text-gray-300">Be genuine in your interactions and content.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment Guidelines */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Comment Guidelines</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Comments are a way to connect with creators and fellow fans. Here's how to make them meaningful:
            </p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">✅ Encouraged Comments</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Thoughtful feedback and appreciation</li>
                  <li>• Constructive questions about content</li>
                  <li>• Supportive encouragement for creators</li>
                  <li>• Respectful discussions about topics</li>
                  <li>• Sharing relevant personal experiences</li>
                  <li>• Creative compliments and positive reactions</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">❌ Prohibited Comments</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Hate speech, slurs, or discriminatory language</li>
                  <li>• Harassment, bullying, or personal attacks</li>
                  <li>• Spam, promotional content, or self-advertising</li>
                  <li>• Explicit sexual content or inappropriate requests</li>
                  <li>• Threats, doxxing, or sharing personal information</li>
                  <li>• Impersonation or misleading information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Interactions */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">How Users Should Interact</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">With Creators</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Remember that creators are real people sharing their passion and creativity. Show appreciation 
                  for their work, ask thoughtful questions, and respect their boundaries.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li>• Thank creators for content you enjoy</li>
                  <li>• Ask questions about their creative process</li>
                  <li>• Respect their content boundaries and pricing</li>
                  <li>• Provide constructive feedback when appropriate</li>
                </ul>
              </div>
              
              <div className="bg-gray-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">With Fellow Fans</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Build connections with other community members who share your interests. Celebrate shared 
                  enthusiasm while respecting different perspectives.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li>• Welcome new community members</li>
                  <li>• Share recommendations and discoveries</li>
                  <li>• Engage in respectful discussions about content</li>
                  <li>• Support other fans' contributions to conversations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporting & Enforcement */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Reporting & Enforcement</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              If you encounter behavior that violates these guidelines, please report it to our moderation team. 
              We take all reports seriously and will take appropriate action.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">How to Report</h3>
                <p className="text-gray-300">Use the report button on any comment or post, or contact our support team directly with details about the violation.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Our Response</h3>
                <p className="text-gray-300">We review all reports promptly and may issue warnings, temporary suspensions, or permanent bans depending on the severity of the violation.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Appeals Process</h3>
                <p className="text-gray-300">If you believe a moderation action was taken in error, you can appeal through our support system for review.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
