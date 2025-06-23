
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Database, Lock } from "lucide-react";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Your Privacy Matters
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            This Privacy Policy explains how FanRealms collects, uses, and protects your personal information 
            when you use our platform and services.
          </p>
        </div>

        {/* Information Collection */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Information We Collect</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We collect information you provide directly to us, information we obtain automatically when you use our services, 
              and information from third parties.
            </p>
            <div className="space-y-6">
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">Account Information</h3>
                <p className="text-gray-300 leading-relaxed">
                  When you create an account, we collect your username, email address, password (encrypted), 
                  and any profile information you choose to provide such as your bio, profile picture, and creator details.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">Content and Communications</h3>
                <p className="text-gray-300 leading-relaxed">
                  We collect content you create, upload, or share through our platform, including posts, comments, 
                  messages, and any media files. We also collect information about your interactions with other users' content.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">Usage Information</h3>
                <p className="text-gray-300 leading-relaxed">
                  We automatically collect information about your use of our platform, including pages visited, 
                  features used, time spent on the platform, and technical information about your device and browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">How We Use Your Information</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We use the information we collect to provide, maintain, and improve our services, and to communicate with you.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Service Provision</h3>
                <p className="text-gray-300">To provide and maintain our platform, process transactions, and enable creator-fan interactions.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Platform Improvement</h3>
                <p className="text-gray-300">To analyze usage patterns, fix bugs, develop new features, and enhance user experience.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Communication</h3>
                <p className="text-gray-300">To send you important updates, respond to inquiries, and provide customer support.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Safety & Security</h3>
                <p className="text-gray-300">To protect against fraud, abuse, and other harmful activities on our platform.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Information Sharing and Disclosure</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties except as described below:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Service Providers</h3>
                <p className="text-gray-300">We may share information with trusted service providers who assist us in operating our platform, such as payment processors, hosting services, and analytics providers.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Legal Requirements</h3>
                <p className="text-gray-300">We may disclose information when required by law, regulation, legal process, or governmental request.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Safety Protection</h3>
                <p className="text-gray-300">We may share information to protect the rights, property, or safety of FanRealms, our users, or others.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Business Transfers</h3>
                <p className="text-gray-300">In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Data Security</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-400 mt-1" />
                <span>Encryption of data in transit and at rest</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-400 mt-1" />
                <span>Regular security assessments and updates</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-400 mt-1" />
                <span>Access controls and authentication measures</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-400 mt-1" />
                <span>Employee training on data protection practices</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Your Rights and Choices</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              You have certain rights regarding your personal information:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Access and Portability</h3>
                <p className="text-gray-300">You can access and download your personal data through your account settings.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Correction</h3>
                <p className="text-gray-300">You can update or correct your personal information at any time through your profile settings.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Deletion</h3>
                <p className="text-gray-300">You can request deletion of your account and personal data by contacting our support team.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Communication Preferences</h3>
                <p className="text-gray-300">You can opt out of promotional communications while still receiving important service-related messages.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Contact Us</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="text-gray-300">
              <p className="mb-2">Email: privacy@fanrealms.com</p>
              <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
              <p className="text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
