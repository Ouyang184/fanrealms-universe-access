
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SendMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
}

interface FormValues {
  message: string;
}

export function SendMessageDialog({ isOpen, onClose, receiverId, receiverName }: SendMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);
  
  const form = useForm<FormValues>({
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    setIsSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: values.message,
      });

    setIsSending(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Message sent successfully!",
    });
    
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Message to {receiverName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? <LoadingSpinner className="mr-2" /> : null}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
