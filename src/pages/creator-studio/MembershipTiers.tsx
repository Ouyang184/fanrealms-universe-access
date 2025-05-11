
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Plus, 
  Pencil, 
  Trash, 
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
  HelpCircle
} from "lucide-react";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { CreateTierForm } from "@/components/creator-studio/CreateTierForm";
import { DeleteTierDialog } from "@/components/creator-studio/DeleteTierDialog";
import { Tier } from "@/types";

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
];

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
      "While the tier structure (Basic, Premium, VIP) is consistent across the platform, each creator customizes the specific benefits and content offered at each tier. You can view the detailed benefits on each creator's profile page.",
  },
  {
    question: "Can I subscribe to multiple creators with different tiers?",
    answer:
      "Yes! You can subscribe to as many creators as you want, and choose different membership tiers for each one based on your level of interest and the specific benefits offered.",
  },
  {
    question: "How is my subscription fee distributed?",
    answer:
      "The majority of your subscription (85%) goes directly to the creator, while the platform retains a small platform fee (15%) to maintain and improve the service.",
  },
  {
    question: "What happens if a creator doesn't deliver the promised benefits?",
    answer:
      "Our platform has a satisfaction guarantee. If a creator consistently fails to deliver the promised tier benefits, subscribers can report this through our help center and may be eligible for a refund.",
  },
  {
    question: "Can I gift a membership to someone else?",
    answer:
      "Yes! You can purchase gift subscriptions for any tier and any creator. Gift subscriptions can be set for 1, 3, 6, or 12 months.",
  },
];

export default function CreatorStudioTiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<{id: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState("tiers");

  const { 
    data: tiers = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      if (!user) return [];

      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        console.error("Error fetching creator:", creatorError);
        return [];
      }

      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select(`
          id,
          title,
          price,
          description,
          created_at,
          subscriptions:subscriptions(count)
        `)
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (tiersError) {
        console.error("Error fetching tiers:", tiersError);
        return [];
      }
      
      return tiersData.map(tier => ({
        id: tier.id,
        title: tier.title,
        name: tier.title,
        price: tier.price,
        description: tier.description || "",
        created_at: tier.created_at || new Date().toISOString(),
        features: tier.description ? tier.description.split("|") : [],
        subscriberCount: tier.subscriptions[0]?.count || 0,
        color: tier.price < 10 ? "blue" : tier.price < 25 ? "purple" : "amber",
        popular: false, // You might want to determine this based on subscriber count
        icon: tier.price < 10 ? Users : tier.price < 25 ? Star : Crown,
      }));
    },
    enabled: !!user,
  });

  if (error) {
    toast({
      title: "Failed to load tiers",
      description: "There was an error loading your membership tiers.",
      variant: "destructive",
    });
  }

  function handleCreateTier() {
    setEditingTier(null);
    setIsCreateModalOpen(true);
  }

  function handleEditTier(tier: Tier) {
    setEditingTier(tier);
    setIsCreateModalOpen(true);
  }

  function handleDeleteTier(tier: Tier) {
    setDeletingTier({id: tier.id, name: tier.name});
    setIsDeleteDialogOpen(true);
  }

  return (
    <CreatorCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Membership Tiers</h1>
          <Button onClick={handleCreateTier}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Tier
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tiers">My Tiers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="examples">Examples & Templates</TabsTrigger>
          </TabsList>
          
          {/* My Tiers Tab */}
          <TabsContent value="tiers">
            <Card>
              <Table>
                <TableCaption>A list of your membership tiers</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Loading tiers...
                      </TableCell>
                    </TableRow>
                  ) : tiers.length > 0 ? (
                    tiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">{tier.title}</TableCell>
                        <TableCell>${tier.price}/month</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tier.features.slice(0, 2).map((feature, i) => (
                              <Badge key={i} variant="outline">{feature}</Badge>
                            ))}
                            {tier.features.length > 2 && (
                              <Badge variant="outline">+{tier.features.length - 2} more</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{tier.subscriberCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTier(tier)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteTier(tier)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No membership tiers found. Create your first tier!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="space-y-6">
              {tiers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Subscribers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {tiers.reduce((total, tier) => total + (tier.subscriberCount || 0), 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          ${tiers.reduce((total, tier) => total + (tier.price * (tier.subscriberCount || 0)), 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Most Popular Tier</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {tiers.reduce((max, tier) => (tier.subscriberCount > (max?.subscriberCount || 0) ? tier : max), tiers[0])?.title || "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">Create membership tiers to see analytics and insights.</p>
                  <Button onClick={handleCreateTier}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Tier
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Examples Tab */}
          <TabsContent value="examples">
            <div className="space-y-8">
              {/* Example Tiers */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Tier Structure</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {[
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
                    }
                  ].map((tier) => (
                    <Card
                      key={tier.id}
                      className={`relative ${
                        tier.popular ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20" : ""
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                          <Badge className="bg-purple-600">Most Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-muted p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
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
                          <span className="text-muted-foreground ml-1">/month</span>
                        </div>
                        <CardDescription>{tier.description}</CardDescription>
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
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            setEditingTier({
                              id: "",
                              title: tier.name,
                              name: tier.name,
                              price: tier.price,
                              description: tier.features.join("|"),
                              features: tier.features,
                              created_at: new Date().toISOString(),
                              subscriberCount: 0,
                              color: tier.color,
                              icon: tier.icon,
                            });
                            setIsCreateModalOpen(true);
                          }}
                        >
                          Use This Template
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Category Examples */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Benefits by Creator Category</h2>
                <p className="text-muted-foreground mb-6">
                  Different creator categories offer unique benefits at each tier. Explore these examples to help design your own tiers.
                </p>
                
                <Tabs defaultValue="art" className="w-full">
                  <TabsList className="mb-6">
                    {creatorCategories.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-2"
                      >
                        <category.icon className="h-4 w-4" />
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {creatorCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(category.tierBenefits).map(([tierId, benefits]) => (
                          <Card key={tierId}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                {tierId === "premium" ? (
                                  <Star className="h-5 w-5 text-purple-400" />
                                ) : tierId === "vip" ? (
                                  <Crown className="h-5 w-5 text-amber-400" />
                                ) : (
                                  <Users className="h-5 w-5 text-blue-400" />
                                )}
                                {tierId.charAt(0).toUpperCase() + tierId.slice(1)} Tier
                              </CardTitle>
                              <CardDescription>
                                ${tierId === "premium" ? "15" : tierId === "vip" ? "30" : "5"}/month
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {benefits.map((benefit, i) => (
                                  <li key={i} className="flex items-start">
                                    <Check
                                      className={`h-4 w-4 mr-2 mt-1 flex-shrink-0 ${
                                        tierId === "premium"
                                          ? "text-purple-400"
                                          : tierId === "vip"
                                            ? "text-amber-400"
                                            : "text-blue-400"
                                      }`}
                                    />
                                    <span className="text-sm">{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => {
                                  const featureText = benefits.join("|");
                                  setEditingTier({
                                    id: "",
                                    title: tierId.charAt(0).toUpperCase() + tierId.slice(1),
                                    name: tierId.charAt(0).toUpperCase() + tierId.slice(1),
                                    price: tierId === "premium" ? 15 : tierId === "vip" ? 30 : 5,
                                    description: featureText,
                                    features: benefits,
                                    created_at: new Date().toISOString(),
                                    subscriberCount: 0,
                                    color: tierId === "premium" ? "purple" : tierId === "vip" ? "amber" : "blue",
                                    icon: tierId === "premium" ? Star : tierId === "vip" ? Crown : Users,
                                  });
                                  setIsCreateModalOpen(true);
                                }}
                              >
                                Use These Benefits
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              
              {/* FAQs */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Common Questions About Membership Tiers</h2>
                <div className="max-w-3xl mx-auto">
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-b">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pl-7">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CreateTierForm 
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
          editingTier={editingTier}
        />
        
        {deletingTier && (
          <DeleteTierDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              refetch();
            }}
            tierId={deletingTier.id}
            tierName={deletingTier.name}
          />
        )}
      </div>
    </CreatorCheck>
  );
}
