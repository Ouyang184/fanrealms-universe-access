
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Shield, Eye, AlertTriangle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function CreatorGuidelines() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Creator Guidelines
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Guidelines for creators to build successful, compliant content that respects our community standards and legal requirements.
          </p>
        </div>

        {/* Creator Responsibilities */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Star className="w-8 h-8 text-purple-600" />
              Creator Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                As a creator on FanRealms, you have the freedom to express yourself while maintaining a safe, respectful environment for all users.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Age Verification</h4>
                    <p className="text-sm text-muted-foreground">Must be 18+ to create any content on the platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Original Content</h4>
                    <p className="text-sm text-muted-foreground">Create and share only content you own or have rights to</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Legal Compliance</h4>
                    <p className="text-sm text-muted-foreground">Follow all applicable local and international laws</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Community Respect</h4>
                    <p className="text-sm text-muted-foreground">Treat all community members with dignity and respect</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowed Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              What You Can Create
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 text-green-600">✅ Allowed Content Types</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Educational and tutorial content</li>
                    <li>• Artistic expression and creative works</li>
                    <li>• Fitness and wellness content</li>
                    <li>• Music, podcasts, and audio content</li>
                    <li>• Gaming streams and content</li>
                    <li>• Lifestyle and daily vlogs</li>
                  </ul>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Cooking and recipe content</li>
                    <li>• Fashion and beauty content</li>
                    <li>• Travel and adventure content</li>
                    <li>• Business and entrepreneurship advice</li>
                    <li>• Technology reviews and tutorials</li>
                    <li>• Age-appropriate adult content (18+)</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Content Quality Standards:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• High-quality images and videos when possible</li>
                  <li>• Clear, engaging descriptions</li>
                  <li>• Consistent posting schedule</li>
                  <li>• Interactive engagement with your audience</li>
                  <li>• Proper content warnings when applicable</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Content */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              Strictly Prohibited Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 text-red-600">🚫 Content You Cannot Create</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Child Exploitation Material</h5>
                      <p className="text-sm text-muted-foreground">Any content involving minors in sexual or suggestive contexts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Revenge Porn</h5>
                      <p className="text-sm text-muted-foreground">Non-consensual intimate imagery or videos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Terrorism-Related Material</h5>
                      <p className="text-sm text-muted-foreground">Content promoting or glorifying terrorist activities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Hate Speech Content</h5>
                      <p className="text-sm text-muted-foreground">Content promoting discrimination or hatred toward protected groups</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Violence & Self-Harm</h5>
                      <p className="text-sm text-muted-foreground">Graphic violence, self-harm instruction, or dangerous activities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Illegal Activities</h5>
                      <p className="text-sm text-muted-foreground">Content depicting or promoting illegal drug use, fraud, or other criminal activities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Copyright Infringement</h5>
                      <p className="text-sm text-muted-foreground">Using copyrighted material without proper permission or fair use</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Moderation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-600" />
              Content Moderation Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Automated Review:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI-powered content scanning for prohibited material</li>
                  <li>• Automatic flagging of potentially violating content</li>
                  <li>• Hash-based detection for known illegal content</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Human Review:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Trained moderators review flagged content</li>
                  <li>• Community reports are investigated promptly</li>
                  <li>• Appeals process for disputed decisions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Enforcement Actions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Content removal for policy violations</li>
                  <li>• Account warnings for minor infractions</li>
                  <li>• Temporary or permanent suspensions for serious violations</li>
                  <li>• Law enforcement reporting for illegal content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              Creator Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Content Strategy:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Develop a consistent content theme and style</li>
                  <li>• Engage regularly with your audience</li>
                  <li>• Use appropriate content warnings and age restrictions</li>
                  <li>• Respect subscriber boundaries and requests</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Building Your Community:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Respond to comments and messages respectfully</li>
                  <li>• Create content that encourages positive interaction</li>
                  <li>• Set clear boundaries about what you will and won't do</li>
                  <li>• Report inappropriate behavior from subscribers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Legal Protection:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Keep records of consent for any content involving others</li>
                  <li>• Understand your local laws regarding adult content</li>
                  <li>• Use proper copyright attribution for any third-party material</li>
                  <li>• Consider consulting with legal professionals for complex content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporting System */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Reporting & Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you need to report inappropriate content, have questions about our guidelines, 
                or need support as a creator, we're here to help.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">For Creators:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Content guidance and policy questions</li>
                    <li>• Technical support for uploads</li>
                    <li>• Payment and payout assistance</li>
                    <li>• Account security concerns</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Reporting Issues:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Harassment or inappropriate behavior</li>
                    <li>• Copyright infringement claims</li>
                    <li>• Suspicious or illegal activity</li>
                    <li>• Technical bugs or platform issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Creator Support & Guidelines Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Have questions about these guidelines or need support as a creator? 
              Our creator success team is here to help you build a successful, compliant presence on FanRealms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:creators@fanrealms.com">Creator Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/report">Report Content</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
