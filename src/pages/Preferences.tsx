
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CategoryGrid } from "@/components/onboarding/CategoryGrid";
import { supabase } from "@/lib/supabase";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";

export default function PreferencesPage() {
  const { isChecking } = useAuthCheck();
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadExistingPreferences();
    }
  }, [user]);

  const loadExistingPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('category_id')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (data) {
        setSelectedCategories(data.map(pref => pref.category_id));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (id: number) => {
    setSelectedCategories((prev) => 
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedCategories.length < 4) {
      toast({
        title: "Select at least 4 categories",
        description: "Please select at least 4 categories to personalize your experience.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Delete existing preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user?.id);

      // Insert new preferences
      const preferences = selectedCategories.map(categoryId => ({
        user_id: user?.id,
        category_id: categoryId,
        category_name: getCategoryName(categoryId)
      }));

      const { error } = await supabase
        .from('user_preferences')
        .insert(preferences);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your content preferences have been updated successfully."
      });

      // Redirect to home page
      navigate("/home");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (id: number) => {
    const categories = [
      { id: 1, name: "Art & Illustration" },
      { id: 2, name: "Gaming" },
      { id: 3, name: "Music" },
      { id: 4, name: "Writing" },
      { id: 5, name: "Photography" },
      { id: 6, name: "Education" },
      { id: 7, name: "Podcasts" },
      { id: 8, name: "Cooking" },
      { id: 9, name: "Fitness" },
      { id: 10, name: "Technology" },
      { id: 11, name: "Fashion" },
      { id: 12, name: "Film & Video" },
    ];
    return categories.find(cat => cat.id === id)?.name || "";
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-white">FanRealms</h1>
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              What content interests you?
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Select at least 4 categories to help us personalize your feed and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryGrid 
              selectedCategories={selectedCategories} 
              onToggle={handleCategoryToggle} 
            />
            
            <div className="mt-8 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedCategories.length} of 12 categories selected
                {selectedCategories.length < 4 && (
                  <span className="text-red-400 ml-2">
                    (Select at least 4)
                  </span>
                )}
              </div>
              
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSavePreferences}
                disabled={isSubmitting || selectedCategories.length < 4}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Saving...
                  </div>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            className="text-gray-400 hover:text-white" 
            onClick={() => navigate("/home")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
