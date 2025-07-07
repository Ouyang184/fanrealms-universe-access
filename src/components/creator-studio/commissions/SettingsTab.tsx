
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommissionSettingsModal } from './CommissionSettingsModal';

interface CreatorProfile {
  commission_tos?: string;
}

interface SettingsTabProps {
  creatorProfile: CreatorProfile | null;
}

export function SettingsTab({ creatorProfile }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your commission preferences and availability
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Commission Terms</p>
              <p className="text-sm text-muted-foreground">
                {creatorProfile?.commission_tos 
                  ? "Terms of service configured" 
                  : "Set your terms of service for commission work"
                }
              </p>
            </div>
            <CommissionSettingsModal>
              <Button variant="outline" size="sm">
                Edit Terms
              </Button>
            </CommissionSettingsModal>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Portfolio Gallery</p>
              <p className="text-sm text-muted-foreground">
                Showcase examples of your commission work
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage Gallery
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
