
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
      const { data, error } = await supabase
        .from("creator_links")
        .select("*")
        .eq("creator_id", creatorId)
        .order("position", { ascending: true });

      if (error) throw error;
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

  const saveLinks = async () => {
    // Validate links before saving
    const invalidLinks = links.filter(link => 
      !link.url.trim() || !isValidUrl(link.url)
    );
    
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
      // Handle deletions (links that were in DB but removed from state)
      const { data: existingLinks, error: fetchError } = await supabase
        .from("creator_links")
        .select("id")
        .eq("creator_id", creatorId);

      if (fetchError) throw fetchError;

      const currentLinkIds = links.filter(link => link.id).map(link => link.id);
      const linksToDelete = existingLinks
        ?.filter(link => !currentLinkIds.includes(link.id))
        .map(link => link.id) || [];

      // Delete removed links
      if (linksToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("creator_links")
          .delete()
          .in("id", linksToDelete);

        if (deleteError) throw deleteError;
      }

      // Upsert all current links
      const { error: upsertError } = await supabase
        .from("creator_links")
        .upsert(
          links.map(({ isNew, ...link }) => ({
            ...link,
            creator_id: creatorId,
          }))
        );

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
        description: "Failed to save social links",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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
                  <div className="flex-1">
                    <Label htmlFor={`link-label-${index}`}>Label</Label>
                    <Input
                      id={`link-label-${index}`}
                      placeholder="e.g., Twitter, Instagram"
                      value={link.label}
                      onChange={(e) => updateLink(index, "label", e.target.value)}
                    />
                  </div>
                  <div className="flex-[2]">
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
