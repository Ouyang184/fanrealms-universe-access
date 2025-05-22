
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SocialLink {
  id?: string;
  label: string;
  url: string;
  position: number;
  creator_id?: string;
  isNew?: boolean;
}

interface SocialLinksSectionProps {
  creatorId: string;
}

const SOCIAL_PLATFORMS = [
  { value: "twitter", label: "Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "discord", label: "Discord" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "Other" },
];

export function SocialLinksSection({ creatorId }: SocialLinksSectionProps) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (creatorId) {
      fetchLinks();
    }
  }, [creatorId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching links for creator ID:", creatorId);
      const { data, error } = await supabase
        .from("creator_links")
        .select("*")
        .eq("creator_id", creatorId)
        .order("position", { ascending: true });

      if (error) throw error;
      
      console.log("Fetched links:", data);
      setLinks(data || []);
    } catch (error: any) {
      console.error("Error fetching social links:", error);
      toast({
        title: "Error",
        description: "Failed to load social links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLink = () => {
    setLinks([
      ...links,
      {
        label: "",
        url: "",
        position: links.length,
        creator_id: creatorId,
        isNew: true,
      },
    ]);
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value,
    };
    setLinks(updatedLinks);
  };

  const autoSetUrlPrefixForPlatform = (index: number, platform: string) => {
    const updatedLinks = [...links];
    const currentUrl = updatedLinks[index].url;
    
    // Only prepend the prefix if the URL doesn't already have a protocol
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
      let prefix = '';
      
      switch (platform.toLowerCase()) {
        case 'twitter':
          prefix = 'https://twitter.com/';
          break;
        case 'instagram':
          prefix = 'https://instagram.com/';
          break;
        case 'linkedin':
          prefix = 'https://linkedin.com/in/';
          break;
        case 'github':
          prefix = 'https://github.com/';
          break;
        case 'discord':
          // Discord links could be invite links or username mentions
          prefix = 'https://discord.com/';
          break;
        case 'youtube':
          prefix = 'https://youtube.com/';
          break;
        case 'twitch':
          prefix = 'https://twitch.tv/';
          break;
        case 'facebook':
          prefix = 'https://facebook.com/';
          break;
        default:
          prefix = '';
      }
      
      // Only set prefix if one was determined
      if (prefix && !currentUrl.includes(platform.toLowerCase())) {
        updatedLinks[index].url = prefix;
      }
    }
    
    // Always update the label
    updatedLinks[index].label = platform;
    
    setLinks(updatedLinks);
  };

  const removeLink = (index: number) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    
    // Update positions after removal
    const reorderedLinks = updatedLinks.map((link, idx) => ({
      ...link,
      position: idx,
    }));
    
    setLinks(reorderedLinks);
  };

  const isValidUrl = (url: string) => {
    if (!url.trim()) return false;
    
    try {
      // For URLs without protocol, add temporary https to validate
      const urlToCheck = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlToCheck);
      return true;
    } catch {
      return false;
    }
  };

  const saveLinks = async () => {
    // Validate links before saving
    const invalidLinks = links.filter(link => !link.url.trim() || !isValidUrl(link.url));
    
    if (invalidLinks.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please provide valid URLs for all links",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("Saving links for creator ID:", creatorId);
      
      // Prepare links for saving - ensure URLs have protocols
      const preparedLinks = links.map(link => {
        let urlWithProtocol = link.url;
        if (!urlWithProtocol.startsWith('http://') && !urlWithProtocol.startsWith('https://')) {
          urlWithProtocol = `https://${urlWithProtocol}`;
        }
        return { ...link, url: urlWithProtocol };
      });

      // Handle deletions (links that were in DB but removed from state)
      const { data: existingLinks, error: fetchError } = await supabase
        .from("creator_links")
        .select("id")
        .eq("creator_id", creatorId);

      if (fetchError) throw fetchError;

      const currentLinkIds = preparedLinks
        .filter(link => link.id)
        .map(link => link.id);
        
      const linksToDelete = existingLinks
        ?.filter(link => !currentLinkIds.includes(link.id))
        .map(link => link.id) || [];
      
      console.log("Links to delete:", linksToDelete);

      // Delete removed links
      if (linksToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("creator_links")
          .delete()
          .in("id", linksToDelete);

        if (deleteError) throw deleteError;
      }

      // Upsert all current links
      const linksToUpsert = preparedLinks.map(({ isNew, ...link }) => ({
        ...link,
        creator_id: creatorId,
      }));
      
      console.log("Links to upsert:", linksToUpsert);
      
      const { error: upsertError } = await supabase
        .from("creator_links")
        .upsert(linksToUpsert);

      if (upsertError) throw upsertError;

      toast({
        title: "Success",
        description: "Social links updated successfully",
      });

      // Refetch to get the updated links with IDs
      fetchLinks();
    } catch (error: any) {
      console.error("Error saving social links:", error);
      toast({
        title: "Error",
        description: "Failed to save social links: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p>Loading links...</p>
        ) : (
          <div className="space-y-4">
            {links.length === 0 ? (
              <p className="text-muted-foreground">No social links added yet.</p>
            ) : (
              links.map((link, index) => (
                <div key={link.id || index} className="flex items-center gap-3">
                  <div className="w-1/3">
                    <Label htmlFor={`link-label-${index}`}>Platform</Label>
                    <Select
                      value={link.label || ""}
                      onValueChange={(value) => {
                        autoSetUrlPrefixForPlatform(index, value);
                      }}
                    >
                      <SelectTrigger id={`link-label-${index}`}>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`link-url-${index}`}>URL</Label>
                    <Input
                      id={`link-url-${index}`}
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => updateLink(index, "url", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Link
              </Button>
              {links.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={saveLinks}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Links"}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
