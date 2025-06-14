
import React from "react";

interface ServiceNotificationBannerProps {
  hasPendingCancellations: boolean;
}

export const ServiceNotificationBanner: React.FC<ServiceNotificationBannerProps> = ({ 
  hasPendingCancellations 
}) => {
  if (!hasPendingCancellations) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">
            You have subscriptions that are scheduled to cancel at the end of your current billing period. 
            You'll continue to have access until then. To prevent cancellation, go to{" "}
            <button 
              className="underline font-medium"
              onClick={() => window.location.href = '/subscriptions'}
            >
              Your Subscriptions
            </button>
            {" "}and reactivate your subscriptions.
          </p>
        </div>
      </div>
    </div>
  );
};
