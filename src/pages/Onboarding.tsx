
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { CategoryGrid } from "@/components/onboarding/CategoryGrid";
import { CreatorList } from "@/components/onboarding/CreatorList";

export default function OnboardingPage() {
  const [currentTab, setCurrentTab] = useState("interests");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleCategoryToggle = (id: number) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]));
  };

  const handleCreatorToggle = (id: number) => {
    setSelectedCreators((prev) => (prev.includes(id) ? prev.filter((creatorId) => creatorId !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    if (currentTab === "interests") {
      setCurrentTab("creators");
    } else {
      // Complete onboarding
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-white">FanRealms</h1>
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Welcome to FanRealms</CardTitle>
            <CardDescription className="text-center text-gray-400">Let's personalize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="interests" className="data-[state=active]:bg-purple-900/30">
                  1. Select Interests
                </TabsTrigger>
                <TabsTrigger
                  value="creators"
                  className="data-[state=active]:bg-purple-900/30"
                  disabled={selectedCategories.length === 0}
                >
                  2. Follow Creators
                </TabsTrigger>
              </TabsList>

              <TabsContent value="interests" className="mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">What are you interested in?</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Select at least 3 categories to help us personalize your recommendations
                  </p>
                </div>

                <CategoryGrid 
                  selectedCategories={selectedCategories} 
                  onToggle={handleCategoryToggle} 
                />
              </TabsContent>

              <TabsContent value="creators" className="mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">Creators you might like</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Based on your interests, here are some creators you might want to follow
                  </p>
                </div>

                <CreatorList 
                  selectedCreators={selectedCreators} 
                  onToggle={handleCreatorToggle} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentTab === "creators" ? (
              <Button variant="ghost" onClick={() => setCurrentTab("interests")}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleContinue}
              disabled={
                (currentTab === "interests" && selectedCategories.length < 3) ||
                (currentTab === "creators" && selectedCreators.length === 0)
              }
            >
              {currentTab === "interests" ? (
                <>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="link" className="text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
