
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Check,
  Star,
  Shield,
  Zap,
  Crown,
  Users,
  FileText,
  MessageSquare,
  Video,
  ImageIcon,
  Music,
  HelpCircle,
} from "lucide-react"

// Sample data for membership tiers
const tiers = [
  {
    id: "basic",
    name: "Basic",
    price: 5,
    description: "Perfect for casual fans who want to support their favorite creators",
    color: "blue",
    features: [
      "Access to subscriber-only posts",
      "Join community discussions",
      "Early access to public content",
      "Direct message with creators (limited)",
    ],
    popular: false,
    icon: Users,
  },
  {
    id: "premium",
    name: "Premium",
    price: 15,
    description: "Enhanced access with exclusive content and more interaction",
    color: "purple",
    features: [
      "All Basic tier features",
      "Exclusive premium content",
      "Monthly Q&A sessions",
      "Discount on merchandise",
      "Ad-free experience",
      "Priority support",
    ],
    popular: true,
    icon: Star,
  },
  {
    id: "vip",
    name: "VIP",
    price: 30,
    description: "The ultimate fan experience with maximum access and benefits",
    color: "amber",
    features: [
      "All Premium tier features",
      "1-on-1 sessions with creators",
      "Behind-the-scenes content",
      "Early access to all content",
      "Exclusive VIP events",
      "Input on future content",
      "Custom profile badge",
    ],
    popular: false,
    icon: Crown,
  },
]

// Sample data for creator categories
const creatorCategories = [
  {
    id: "art",
    name: "Artists & Illustrators",
    icon: ImageIcon,
    tierBenefits: {
      basic: ["Access to sketch collections", "Monthly wallpapers", "Process videos (selected)"],
      premium: ["Full process videos", "PSD/source files", "Monthly art tutorials", "Request sketches"],
      vip: ["Custom artwork (monthly)", "1-on-1 art critique", "Early merchandise access", "Commission discounts"],
    },
  },
  {
    id: "music",
    name: "Musicians & Producers",
    icon: Music,
    tierBenefits: {
      basic: ["Unreleased tracks", "Playlist access", "Livestream performances"],
      premium: ["Stem downloads", "Production breakdowns", "Early album access", "Voting on next singles"],
      vip: ["Virtual studio sessions", "Custom song elements", "Producer credit opportunities", "Private concerts"],
    },
  },
  {
    id: "video",
    name: "Video Creators",
    icon: Video,
    tierBenefits: {
      basic: ["Ad-free videos", "Extended cuts", "Blooper reels"],
      premium: ["Behind-the-scenes footage", "Early video access", "Monthly Q&A videos", "Vote on future topics"],
      vip: ["Name in credits", "Video call sessions", "Appear in videos", "Custom video messages"],
    },
  },
  {
    id: "writing",
    name: "Writers & Journalists",
    icon: FileText,
    tierBenefits: {
      basic: ["Exclusive articles", "Early chapter access", "Monthly newsletters"],
      premium: [
        "Full manuscript access",
        "Character development insights",
        "Writing process notes",
        "Beta reader opportunities",
      ],
      vip: ["Name a character", "Plot input sessions", "Personalized stories", "Editing workshops"],
    },
  },
]

// Sample data for testimonials
const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "Premium",
    creator: "ArtistAlley",
    quote:
      "The Premium tier gives me so much value. I love getting early access to new artwork and the monthly tutorials have improved my own skills!",
  },
  {
    id: 2,
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "VIP",
    creator: "Music Production Hub",
    quote:
      "As a VIP member, I've had amazing 1-on-1 sessions with my favorite producer. The exclusive content and personal attention is absolutely worth it.",
  },
  {
    id: 3,
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "Basic",
    creator: "GameDev Masters",
    quote:
      "Even the Basic tier offers great value. I get to support my favorite game developer while getting access to content I wouldn't see otherwise.",
  },
]

// Sample data for FAQs
const faqs = [
  {
    question: "How do I upgrade or downgrade my membership tier?",
    answer:
      "You can change your membership tier at any time from your subscription settings. Changes will take effect at the start of your next billing cycle. Upgrading gives you immediate access to higher tier benefits.",
  },
  {
    question: "Are membership tiers the same for all creators?",
    answer:
      "While the tier structure (Basic, Premium, VIP) is consistent across FanRealms, each creator customizes the specific benefits and content offered at each tier. You can view the detailed benefits on each creator's profile page.",
  },
  {
    question: "Can I subscribe to multiple creators with different tiers?",
    answer:
      "Yes! You can subscribe to as many creators as you want, and choose different membership tiers for each one based on your level of interest and the specific benefits offered.",
  },
  {
    question: "How is my subscription fee distributed?",
    answer:
      "The majority of your subscription (85%) goes directly to the creator, while FanRealms retains a small platform fee (15%) to maintain and improve the service.",
  },
  {
    question: "What happens if a creator doesn't deliver the promised benefits?",
    answer:
      "FanRealms has a satisfaction guarantee. If a creator consistently fails to deliver the promised tier benefits, you can report this through our help center and may be eligible for a refund.",
  },
  {
    question: "Can I gift a membership to someone else?",
    answer:
      "Yes! You can purchase gift subscriptions for any tier and any creator. Gift subscriptions can be set for 1, 3, 6, or 12 months.",
  },
]

export default function MembershipTiersPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Membership Tiers</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose the perfect membership level to support your favorite creators and unlock exclusive content and
            benefits.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`bg-gray-900 border-gray-800 relative ${
                tier.popular ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-purple-600">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-gray-800 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <tier.icon
                    className={`h-8 w-8 ${
                      tier.color === "purple"
                        ? "text-purple-400"
                        : tier.color === "amber"
                          ? "text-amber-400"
                          : "text-blue-400"
                    }`}
                  />
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="mt-2 mb-2">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <CardDescription className="text-gray-400">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check
                        className={`h-5 w-5 mr-2 flex-shrink-0 ${
                          tier.color === "purple"
                            ? "text-purple-400"
                            : tier.color === "amber"
                              ? "text-amber-400"
                              : "text-blue-400"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    tier.color === "purple"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : tier.color === "amber"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Choose {tier.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Tier Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Detailed Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-6 text-left">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="py-4 px-6 text-center">
                      <div className="font-bold text-lg">{tier.name}</div>
                      <div className="text-gray-400">${tier.price}/month</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Subscriber-only posts</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-blue-400" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-purple-400" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Community discussions</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-blue-400" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-purple-400" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Direct messaging</td>
                  <td className="py-4 px-6 text-center text-sm">Limited</td>
                  <td className="py-4 px-6 text-center text-sm">Full access</td>
                  <td className="py-4 px-6 text-center text-sm">Priority access</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Exclusive content</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-purple-400" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Q&A sessions</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center text-sm">Monthly group</td>
                  <td className="py-4 px-6 text-center text-sm">Monthly 1-on-1</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Merchandise discounts</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center text-sm">10% off</td>
                  <td className="py-4 px-6 text-center text-sm">25% off</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Behind-the-scenes</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-6 font-medium">Input on future content</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Custom profile badge</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 mx-auto text-amber-400" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Creator Category Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Benefits by Creator Category</h2>
          <p className="text-center text-gray-400 mb-8 max-w-3xl mx-auto">
            Different creator categories offer unique benefits at each tier. Explore what you can expect from your
            favorite creator types.
          </p>

          <Tabs defaultValue="art" className="w-full">
            <TabsList className="bg-gray-900 border-gray-800 mb-6 flex flex-wrap justify-center">
              {creatorCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-purple-900/30 flex items-center gap-2"
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {creatorCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(category.tierBenefits).map(([tierId, benefits], index) => {
                    const tier = tiers.find((t) => t.id === tierId)
                    return (
                      <Card key={tierId} className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <tier.icon
                              className={`h-5 w-5 ${
                                tier.color === "purple"
                                  ? "text-purple-400"
                                  : tier.color === "amber"
                                    ? "text-amber-400"
                                    : "text-blue-400"
                              }`}
                            />
                            {tier.name} Tier
                          </CardTitle>
                          <CardDescription>${tier.price}/month</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start">
                                <Check
                                  className={`h-4 w-4 mr-2 mt-1 flex-shrink-0 ${
                                    tier.color === "purple"
                                      ? "text-purple-400"
                                      : tier.color === "amber"
                                        ? "text-amber-400"
                                        : "text-blue-400"
                                  }`}
                                />
                                <span className="text-sm">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Members Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => {
              const tier = tiers.find((t) => t.name === testimonial.tier)
              return (
                <Card key={testimonial.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="mr-4">
                        <img
                          src={testimonial.avatar || "/placeholder.svg"}
                          alt={testimonial.name}
                          className="rounded-full w-12 h-12 object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">
                          {testimonial.tier} member • {testimonial.creator}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-4xl text-purple-500 absolute -top-4 -left-2">"</div>
                      <p className="pl-4 italic text-gray-300">{testimonial.quote}</p>
                      <div className="text-4xl text-purple-500 absolute -bottom-6 right-0">"</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Badge
                      className={`${
                        tier.color === "purple"
                          ? "bg-purple-600/20 text-purple-400 border-purple-800"
                          : tier.color === "amber"
                            ? "bg-amber-600/20 text-amber-400 border-amber-800"
                            : "bg-blue-600/20 text-blue-400 border-blue-800"
                      }`}
                      variant="outline"
                    >
                      {testimonial.tier} Tier
                    </Badge>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Got questions about our membership tiers? Find answers to common questions below.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-800">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pl-7">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Ready to join the community?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Choose your perfect membership tier and start enjoying exclusive content from your favorite creators today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="border-purple-600 text-purple-400">
              Explore Creators
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center gap-4">
              <Shield className="h-8 w-8 text-purple-400" />
              <div>
                <CardTitle>Satisfaction Guarantee</CardTitle>
                <CardDescription>30-day money-back guarantee</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                If you're not satisfied with your membership experience within the first 30 days, we'll provide a full
                refund.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center gap-4">
              <Zap className="h-8 w-8 text-purple-400" />
              <div>
                <CardTitle>Flexible Subscriptions</CardTitle>
                <CardDescription>Change or cancel anytime</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                You're never locked in. Upgrade, downgrade, or cancel your membership at any time with no penalties.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center gap-4">
              <MessageSquare className="h-8 w-8 text-purple-400" />
              <div>
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription>We're here to help</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Our support team is available around the clock to assist with any questions or issues regarding your
                membership.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
