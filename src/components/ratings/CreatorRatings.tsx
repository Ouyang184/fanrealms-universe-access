import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingsSummary } from "./RatingsSummary";
import { RatingsList } from "./RatingsList";
import { RatingForm } from "./RatingForm";
import { useCreatorRatings } from "@/hooks/useCreatorRatings";
import { useAuth } from "@/contexts/AuthContext";
import { Star, MessageSquare, AlertCircle } from "lucide-react";

interface CreatorRatingsProps {
  creatorId: string;
  creatorName: string;
  className?: string;
}

export function CreatorRatings({ creatorId, creatorName, className }: CreatorRatingsProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeType, setActiveType] = useState("general");
  
  const {
    ratings,
    stats,
    userRating,
    isLoading,
    canRate,
    submitRating,
    deleteRating
  } = useCreatorRatings(creatorId, activeType);

  const handleSubmitRating = async (rating: number, review?: string) => {
    const success = await submitRating(rating, review);
    if (success) {
      setShowForm(false);
    }
    return success;
  };

  const handleDeleteRating = async () => {
    const success = await deleteRating();
    if (success) {
      setShowForm(false);
    }
    return success;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Creator Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="general">General Experience</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* Rating Action */}
              {user && (
                <Card>
                  <CardContent className="p-4">
                    {!canRate ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                          <p className="text-sm">
                            You need to have an active subscription or commission history to rate this creator
                          </p>
                        </div>
                      </div>
                    ) : showForm ? (
                      <RatingForm
                        creatorName={creatorName}
                        initialRating={userRating?.rating || 0}
                        initialReview={userRating?.review_text || ""}
                        isEditing={!!userRating}
                        onSubmit={handleSubmitRating}
                        onDelete={userRating ? handleDeleteRating : undefined}
                        onCancel={() => setShowForm(false)}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          {userRating ? (
                            <div>
                              <p className="text-sm font-medium">Your Rating</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{userRating.rating}/5</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium">Share Your Experience</p>
                              <p className="text-xs text-muted-foreground">
                                Help others by rating this creator
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => setShowForm(true)}
                          variant={userRating ? "outline" : "default"}
                          size="sm"
                        >
                          {userRating ? "Edit Rating" : "Write Review"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ratings Summary */}
              <RatingsSummary stats={stats} isLoading={isLoading} />

              {/* Ratings List */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="font-semibold">Recent Reviews</h3>
                </div>
                <RatingsList ratings={ratings} isLoading={isLoading} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}