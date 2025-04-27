
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";
import AuthLayout from "@/components/AuthLayout";

import { useAuth } from "@/contexts/AuthContext";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal(""))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CompleteProfile = () => {
  const { updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      full_name: "",
      website: "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      await updateProfile({
        ...values,
        profile_completed: true,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="auth-title">Complete Your Profile</h2>
          <p className="text-center text-muted-foreground">Tell us a bit about yourself</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="coolcreator" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Your unique username on FanRealms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-website.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              Complete Profile
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default CompleteProfile;
