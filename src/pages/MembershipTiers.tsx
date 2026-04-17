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
    id: "supporter",
    name: "Supporter",
    price: 3,
    description: "Back a Godot dev and get access to their subscriber-only posts and devlogs.",
    color: "blue",
    features: [
      "Subscriber-only posts & devlogs",
      "Early access to free asset releases",
      "Community Discord role",
      "Direct message with the seller",
    ],
    popular: false,
    icon: Users,
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    description: "Full source code access and priority support for active Godot developers.",
    color: "purple",
    features: [
      "All Supporter benefits",
      "Full GDScript source code for all assets",
      "Monthly exclusive asset pack",
      "Priority bug reports & feature requests",
      "Access to WIP / unreleased builds",
    ],
    popular: true,
    icon: Star,
  },
  {
    id: "studio",
    name: "Studio",
    price: 25,
    description: "Team license, commercial use, and direct collaboration with the developer.",
    color: "amber",
    features: [
      "All Pro benefits",
      "Commercial use license for all assets",
      "Team seat — up to 5 devs",
      "Monthly 1-on-1 call with the seller",
      "Input on asset roadmap",
      "Priority commission queue",
    ],
    popular: false,
    icon: Crown,
  },
]

// Sample data for creator categories
const creatorCategories = [
  {
    id: "plugins",
    name: "Plugin & Addon Devs",
    icon: Zap,
    count: "Godot plugins & addons",
    tierBenefits: {
      supporter: ["Devlog posts & update notes", "Early access to free plugin releases", "Community Discord role"],
      pro: ["Full GDScript source for all plugins", "Monthly exclusive addon pack", "Priority bug reports"],
      studio: ["Commercial use license", "Team seat — up to 5 devs", "Monthly 1-on-1 with the dev"],
    },
  },
  {
    id: "shaders",
    name: "Shader Artists",
    icon: ImageIcon,
    count: "GLSL & visual shaders",
    tierBenefits: {
      supporter: ["Subscriber-only shader devlogs", "Early access to free shader drops", "Discord role"],
      pro: ["Full GLSL & VisualShader source files", "Monthly shader pack", "Priority feature requests"],
      studio: ["Commercial use license", "Team seat — up to 5 devs", "Input on shader roadmap"],
    },
  },
  {
    id: "artists",
    name: "Pixel & 2D Artists",
    icon: ImageIcon,
    count: "Sprites, tilesets & UI",
    tierBenefits: {
      supporter: ["Subscriber-only art devlogs", "Early access to free asset drops", "Discord role"],
      pro: ["Full source files (Aseprite/PNG)", "Monthly exclusive asset pack", "Priority requests"],
      studio: ["Commercial use license", "Team seat — up to 5 devs", "Commission queue priority"],
    },
  },
  {
    id: "audio",
    name: "Audio Producers",
    icon: Music,
    count: "SFX, loops & music",
    tierBenefits: {
      supporter: ["Subscriber-only audio devlogs", "Early access to free sound drops", "Discord role"],
      pro: ["Full uncompressed audio source files", "Monthly exclusive audio pack", "Priority requests"],
      studio: ["Commercial use license", "Team seat — up to 5 devs", "Input on audio roadmap"],
    },
  },
  {
    id: "devs",
    name: "Indie Game Devs",
    icon: FileText,
    count: "Full Godot game projects",
    tierBenefits: {
      supporter: ["Devlog posts & behind-the-scenes", "Early access to public demos", "Discord role"],
      pro: ["Full Godot project source code", "Monthly build access (WIP)", "Priority bug reports"],
      studio: ["Commercial use license", "Team seat — up to 5 devs", "Monthly 1-on-1 with the dev"],
    },
  },
]

// Sample data for testimonials
const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "Pro",
    creator: "GodotShaderLab",
    quote:
      "The Pro plan is worth every penny. Having the full GLSL source files means I can actually learn from and adapt the shaders for my own Godot projects.",
  },
  {
    id: 2,
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "Studio",
    creator: "PixelForge Assets",
    quote:
      "The Studio plan covers our whole team. The commercial license alone saves us hours of back-and-forth, and the monthly 1-on-1 calls have shaped our game's visual style.",
  },
  {
    id: 3,
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=80&width=80",
    tier: "Supporter",
    creator: "GDScript Toolkit",
    quote:
      "Even the Supporter plan is great value. I get the devlogs early and a Discord role that lets me ask the dev questions directly. Solid way to stay close to Godot tooling.",
  },
]

// Sample data for FAQs
const faqs = [
  {
    question: "How do I upgrade or downgrade my seller plan?",
    answer:
      "You can change your plan at any time from your subscription settings. Changes will take effect at the start of your next billing cycle. Upgrading gives you immediate access to higher tier benefits, including source code and asset packs.",
  },
  {
    question: "Are the plans the same for all sellers?",
    answer:
      "While the plan structure (Supporter, Pro, Studio) is consistent across FanRealms, each seller customizes the specific assets and benefits offered at each tier. You can view the detailed benefits on each seller's profile page.",
  },
  {
    question: "Can I subscribe to multiple sellers with different plans?",
    answer:
      "Yes! You can subscribe to as many Godot sellers as you want, and choose different plans for each based on how deeply you want access to their source code, asset packs, and support.",
  },
  {
    question: "How is my subscription fee distributed?",
    answer:
      "The majority of your subscription (85%) goes directly to the seller, while FanRealms retains a small platform fee (15%) to maintain and improve the marketplace.",
  },
  {
    question: "What happens if a seller doesn't deliver the promised assets or source code?",
    answer:
      "FanRealms has a satisfaction guarantee. If a seller consistently fails to deliver the promised plan benefits, you can report this through our help center and may be eligible for a refund.",
  },
  {
    question: "Does the Studio plan cover commercial Godot projects?",
    answer:
      "Yes! The Studio plan includes a commercial use license for all of the seller's assets, covering up to 5 team members. This means you can ship games and products built with those assets without additional licensing fees.",
  },
]

export default function MembershipTiersPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Seller Plans</h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Choose the right plan to access source code, monthly asset packs, and premium Godot assets from the sellers you follow.
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
                <td className="py-4 px-6 font-medium">Subscriber-only posts & devlogs</td>
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
                <td className="py-4 px-6 font-medium">Community Discord role</td>
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
                <td className="py-4 px-6 font-medium">Direct message with seller</td>
                <td className="py-4 px-6 text-center text-sm">Included</td>
                <td className="py-4 px-6 text-center text-sm">Included</td>
                <td className="py-4 px-6 text-center text-sm">Priority access</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 font-medium">GDScript source code</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 mx-auto text-purple-400" />
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 mx-auto text-amber-400" />
                </td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 font-medium">1-on-1 call with seller</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center text-sm">Monthly</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 font-medium">Monthly exclusive asset pack</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center text-sm">Included</td>
                <td className="py-4 px-6 text-center text-sm">Included</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 font-medium">Commercial use license</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 mx-auto text-amber-400" />
                </td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 font-medium">Input on asset roadmap</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">-</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 mx-auto text-amber-400" />
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium">Team seat (up to 5 devs)</td>
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
        <h2 className="text-3xl font-bold text-center mb-8">Benefits by Seller Type</h2>
        <p className="text-center text-gray-400 mb-8 max-w-3xl mx-auto">
          Different seller types offer unique benefits at each plan level. Explore what you can expect from the Godot devs you support.
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
            Got questions about Godot seller plans? Find answers to common questions below.
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
        <h2 className="text-2xl font-bold mb-4">Ready to access source code & premium Godot assets?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Pick the right plan and get instant access to GDScript source code, monthly asset packs, and more from the Godot sellers you follow.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="border-purple-600 text-purple-400">
            Browse Sellers
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
  )
}
