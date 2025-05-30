
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChangeTierModal } from "./ChangeTierModal";

interface ChangeTierButtonProps {
  subscription: any;
  onSuccess: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ChangeTierButton({ 
  subscription, 
  onSuccess, 
  variant = "outline", 
  size = "sm",
  className = ""
}: ChangeTierButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button 
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={className}
      >
        Change Tier
      </Button>
      
      <ChangeTierModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        subscription={subscription}
        onSuccess={() => {
          onSuccess();
          setShowModal(false);
        }}
      />
    </>
  );
}
