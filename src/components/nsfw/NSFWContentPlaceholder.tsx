
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface NSFWContentPlaceholderProps {
  type?: "post" | "creator" | "general";
  showSettingsLink?: boolean;
  onVerifyAge?: () => void;
  className?: string;
  message?: string;
}

export function NSFWContentPlaceholder({ 
  type = "general", 
  showSettingsLink = true,
  onVerifyAge,
  className,
  message 
}: NSFWContentPlaceholderProps) {
  const getContent = () => {
    switch (type) {
      case "post":
        return {
          title: "18+ Post Hidden",
          description: message || "This post contains mature content and is hidden based on your current settings.",
          icon: <Eye className="h-8 w-8 text-amber-600" />
        };
      case "creator":
        return {
          title: "18+ Creator Content Hidden",
          description: message || "This creator publishes mature content. Enable 18+ content in your settings to view their posts.",
          icon: <AlertTriangle className="h-8 w-8 text-amber-600" />
        };
      default:
        return {
          title: "18+ Content Hidden",
          description: message || "This content is marked as mature and is hidden based on your preferences.",
          icon: <AlertTriangle className="h-8 w-8 text-amber-600" />
        };
    }
  };

  const content = getContent();

  return (
    <Card className={`border-amber-200 bg-amber-50/50 ${className}`}>
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          {content.icon}
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-800">{content.title}</h3>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              {content.description}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {showSettingsLink && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Update Settings
                </Link>
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800">
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
