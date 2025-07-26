import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Here you would enable all cookies/tracking
    console.log('All cookies accepted');
  };

  const handleDeny = () => {
    localStorage.setItem('cookie-consent', 'denied');
    setIsVisible(false);
    // Here you would disable non-essential cookies
    console.log('Non-essential cookies denied');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Cookie Preferences
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                We use cookies to enhance your experience on our website. You can choose to accept all cookies or deny non-essential ones. Essential cookies are required for the website to function properly and cannot be disabled.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAccept} className="flex-1 sm:flex-none">
                  Accept All Cookies
                </Button>
                <Button 
                  onClick={handleDeny} 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                >
                  Deny Non-Essential
                </Button>
              </div>
            </div>
            <Button
              onClick={handleDeny}
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}