
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

type Community = {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  image?: string;
  isMember: boolean;
};

const communitySamples: Community[] = [
  {
    id: 1,
    name: "Digital Artists Collective",
    description: "A community of digital artists sharing techniques, resources, and feedback.",
    memberCount: 2547,
    image: "https://picsum.photos/seed/comm1/100/100",
    isMember: true
  },
  {
    id: 2,
    name: "Indie Game Developers",
    description: "For independent game developers to collaborate, share progress, and get support.",
    memberCount: 1832,
    image: "https://picsum.photos/seed/comm2/100/100",
    isMember: false
  },
  {
    id: 3,
    name: "Content Creator Hub",
    description: "A space for content creators to network, share insights, and grow their audience.",
    memberCount: 3218,
    image: "https://picsum.photos/seed/comm3/100/100",
    isMember: true
  },
  {
    id: 4,
    name: "Writers Workshop",
    description: "A community dedicated to improving writing skills through feedback and discussion.",
    memberCount: 1245,
    image: "https://picsum.photos/seed/comm4/100/100",
    isMember: false
  },
  {
    id: 5,
    name: "Photography Enthusiasts",
    description: "Share your photography, get constructive feedback, and learn new techniques.",
    memberCount: 2987,
    image: "https://picsum.photos/seed/comm5/100/100",
    isMember: false
  },
];

function CommunityCard({ community }: { community: Community }) {
  const [isMember, setIsMember] = useState(community.isMember);
  
  const toggleMembership = () => {
    setIsMember(!isMember);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0 flex-row gap-4 items-center">
        <Avatar className="h-14 w-14">
          <AvatarImage src={community.image} alt={community.name} />
          <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{community.name}</CardTitle>
          <CardDescription className="text-xs">{community.memberCount.toLocaleString()} members</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-4">{community.description}</p>
        <Button 
          variant={isMember ? "outline" : "default"} 
          size="sm" 
          onClick={toggleMembership}
          className="w-full"
        >
          {isMember ? "Leave Community" : "Join Community"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CommunitySkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0 flex-row gap-4 items-center">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Community() {
  const { isChecking } = useAuthCheck();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isChecking) return;
    
    const timer = setTimeout(() => {
      setCommunities(communitySamples);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isChecking]);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Community</h1>
          <p className="text-muted-foreground">Connect with like-minded creators and fans</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <CommunitySkeleton />
              <CommunitySkeleton />
              <CommunitySkeleton />
              <CommunitySkeleton />
              <CommunitySkeleton />
            </>
          ) : (
            communities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
