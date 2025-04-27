import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/LoadingSpinner";

import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { signIn, signInWithMagicLink } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMagicLinkSubmitting, setIsMagicLinkSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await signIn(values.email, values.password);
      
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      
      navigate(returnTo || '/dashboard', { replace: true });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    const email = form.getValues("email");
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError("email", { message: "Please enter a valid email address" });
      return;
    }

    try {
      setIsMagicLinkSubmitting(true);
      await signInWithMagicLink(email);
    } catch (error) {
      console.error("Magic link error:", error);
    } finally {
      setIsMagicLinkSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="you@example.com" 
                  type="email" 
                  autoComplete="email"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  placeholder="••••••••" 
                  type="password" 
                  autoComplete="current-password"
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
          Sign In
        </Button>
      </form>

      <div className="flex items-center mt-4">
        <Separator className="flex-grow" />
        <span className="px-2 text-xs text-muted-foreground">OR</span>
        <Separator className="flex-grow" />
      </div>

      <Button 
        type="button" 
        variant="outline" 
        className="w-full mt-4" 
        onClick={handleMagicLinkLogin}
        disabled={isMagicLinkSubmitting}
      >
        {isMagicLinkSubmitting ? <LoadingSpinner className="mr-2" /> : null}
        Sign In with Magic Link
      </Button>
    </Form>
  );
};

export default LoginForm;
