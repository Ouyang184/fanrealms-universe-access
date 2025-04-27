
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Tier {
  id: string;
  name: string;
  price: number;
  subscriberCount: number;
  features: string[];
}

export default function CreatorStudioTiers() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([
    { 
      id: '1', 
      name: 'Basic Supporter', 
      price: 5, 
      subscriberCount: 89,
      features: ['Exclusive posts', 'Community access']
    },
    { 
      id: '2', 
      name: 'Premium', 
      price: 15, 
      subscriberCount: 42,
      features: ['Exclusive posts', 'Community access', 'Monthly Q&A', 'Early access']
    },
    { 
      id: '3', 
      name: 'VIP', 
      price: 30, 
      subscriberCount: 15,
      features: ['All premium features', 'One-on-one calls', 'Custom content requests']
    },
  ]);

  function handleCreateTier() {
    toast({
      title: "Coming Soon",
      description: "The tier creation feature is currently being developed."
    });
  }

  function handleEditTier(id: string) {
    toast({
      title: "Edit Tier",
      description: `Editing tier with ID: ${id}`
    });
  }

  function handleDeleteTier(id: string) {
    toast({
      description: `Tier with ID: ${id} has been removed.`,
      variant: "destructive"
    });
    
    // Simulate deletion
    setTiers(tiers.filter(tier => tier.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Membership Tiers</h1>
        <Button onClick={handleCreateTier}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tier
        </Button>
      </div>
      
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
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
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
                      <Button size="icon" variant="ghost" onClick={() => handleEditTier(tier.id)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteTier(tier.id)}>
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
                  {isLoading ? 'Loading tiers...' : 'No membership tiers found. Create your first tier!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
