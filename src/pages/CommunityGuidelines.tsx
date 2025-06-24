
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, MessageSquare, Shield, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function CommunityGuidelines() {
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
            Community Guidelines
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Building a respectful, supportive community where creators and fans can connect safely and meaningfully.
          </p>
        </div>

        {/* Community Values */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-purple-600" />
              Our Community Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h4 className="font-medium mb-2">Respect</h4>
                <p className="text-sm text-muted-foreground">Treat all community members with dignity and kindness</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h4 className="font-medium mb-2">Safety</h4>
                <p className="text-sm text-muted-foreground">Maintain a safe environment for everyone</p>
              </div>
              <div className="text-center">
                <Heart className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <h4 className="font-medium mb-2">Support</h4>
                <p className="text-sm text-muted-foreground">Encourage and uplift fellow community members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interaction Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              How to Interact in Our Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 text-green-600">✅ Encouraged Behavior</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Supportive Comments</h5>
                      <p className="text-sm text-muted-foreground">Leave positive, encouraging feedback on creators' posts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Constructive Feedback</h5>
                      <p className="text-sm text-muted-foreground">Offer helpful suggestions when appropriate and requested</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Respectful Questions</h5>
                      <p className="text-sm text-muted-foreground">Ask thoughtful questions about content or interests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Celebrating Achievements</h5>
                      <p className="text-sm text-muted-foreground">Congratulate creators on milestones and successes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Content */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              Prohibited Comments & Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 text-red-600">🚫 Strictly Forbidden</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Hate Speech & Slurs</h5>
                      <p className="text-sm text-muted-foreground">No discriminatory language based on race, religion, gender, sexual orientation, or any other protected characteristic</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Harassment & Bullying</h5>
                      <p className="text-sm text-muted-foreground">No threatening, intimidating, or persistently negative behavior toward any user</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Sexual Harassment</h5>
                      <p className="text-sm text-muted-foreground">No unwanted sexual advances, explicit comments, or inappropriate requests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Spam & Self-Promotion</h5>
                      <p className="text-sm text-muted-foreground">No excessive promotional content, repetitive messages, or irrelevant links</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Doxxing & Privacy Violations</h5>
                      <p className="text-sm text-muted-foreground">No sharing of personal information without consent</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Threats & Violence</h5>
                      <p className="text-sm text-muted-foreground">No threats of harm, violence, or illegal activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comment Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Types of Comments Welcome:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Appreciation and compliments on content quality</li>
                  <li>• Questions about the creator's work or interests</li>
                  <li>• Sharing personal experiences related to the content</li>
                  <li>• Constructive suggestions (when appropriate)</li>
                  <li>• Expressions of support during difficult times</li>
                  <li>• Celebrating milestones and achievements</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Before Commenting, Ask Yourself:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Is this comment respectful and kind?</li>
                  <li>• Would I be comfortable receiving this comment?</li>
                  <li>• Does this add value to the conversation?</li>
                  <li>• Am I respecting the creator's boundaries?</li>
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
              Reporting Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you encounter content or behavior that violates our community guidelines, please report it immediately. 
                Our moderation team reviews all reports within 24 hours.
              </p>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">How to Report:</h5>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Click the "Report" button on any post or comment</li>
                    <li>• Select the appropriate violation category</li>
                    <li>• Provide additional context if needed</li>
                    <li>• Submit your report for review</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">What Happens Next:</h5>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Reports are reviewed by trained moderators</li>
                    <li>• Appropriate action is taken (warning, content removal, or account suspension)</li>
                    <li>• Repeat offenders face permanent bans</li>
                    <li>• Serious violations may be reported to authorities</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enforcement & Consequences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Violations of our community guidelines result in progressive enforcement actions:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h5 className="font-medium mb-2">First Violation</h5>
                  <p className="text-sm text-muted-foreground">Warning + Content removal</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h5 className="font-medium mb-2">Repeat Violations</h5>
                  <p className="text-sm text-muted-foreground">Temporary suspension</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h5 className="font-medium mb-2">Severe Violations</h5>
                  <p className="text-sm text-muted-foreground">Permanent ban</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Questions About Community Guidelines?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have questions about our community guidelines or need to report serious violations, 
              please contact our community team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:community@fanrealms.com">Contact Community Team</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/report">Report Violations</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
