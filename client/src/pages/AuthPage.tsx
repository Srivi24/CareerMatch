import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@shared/routes";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

import { useLanguage } from "@/components/LanguageProvider";

// Schemas derived from shared routes but extended for form handling if needed
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = api.auth.register.input.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { login, register, user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      {/* Left Panel - Hero/Marketing */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-700 opacity-90"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">CareerPath Guide</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            {t('logoSheet1')}
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            {t('logoSheet2')}
          </p>
          
          <div className="flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-blue-200 flex items-center justify-center text-primary font-bold text-xs">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="flex items-center text-sm font-medium">
              {t('logoSheet3')}
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-blue-200">
          © 2024 CareerPath Guide. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground">{t('welcome')}!</h2>
            <p className="text-muted-foreground mt-2">{t('pleaseEnter')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="register">{t('register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm 
                onSuccess={() => setLocation("/")} 
                login={login} 
              />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm 
                onSuccess={() => {
                  toast({
                    title: "Registration successful!",
                    description: "Please login with your new account.",
                  });
                  setActiveTab("login");
                }} 
                register={register} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, login }: { onSuccess: () => void, login: any }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input 
          id="username" 
          placeholder="Enter your username..." 
          {...form.register("username")} 
          className="h-11"
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('password')}</Label>
          <a href="#" className="text-sm font-medium text-primary hover:underline">{t('fgPassword')}?</a>
        </div>
        <Input 
          id="password" 
          type="password" 
          placeholder="Enter your password..."
          {...form.register("password")} 
          className="h-11"
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        {t('signIn')}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess, register }: { onSuccess: () => void, register: any }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "student",
      classLevel: "12th",
      currentStream: "Science",
      city: "",
      preferredLanguage: "en",
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pl-2">
      <div className="space-y-2">
        <Label htmlFor="reg-name">{t('fullname')}</Label>
        <Input id="reg-name" placeholder="Enter your full name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-username">{t('username')}</Label>
        <Input id="reg-username" placeholder="Enter your unique username" {...form.register("username")} />
        {form.formState.errors.username && <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reg-pass">{t('password')}</Label>
          <Input id="reg-pass" type="password" placeholder="Enter your password" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-confirm">{t('confirm')}</Label>
          <Input id="reg-confirm" type="password" placeholder="Enter your password again" {...form.register("confirmPassword")} />
          {form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('classLevel')}</Label>
          <Select onValueChange={(val) => form.setValue("classLevel", val)} defaultValue="12th">
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10th">10th Grade</SelectItem>
              <SelectItem value="11th">11th Grade</SelectItem>
              <SelectItem value="12th">12th Grade</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('stream')}</Label>
          <Select onValueChange={(val) => form.setValue("currentStream", val)} defaultValue="Science">
            <SelectTrigger>
              <SelectValue placeholder="Select stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Commerce">Commerce</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Undecided">Undecided</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-city">{t('city')}</Label>
        <Input id="reg-city" placeholder="Enter your city" {...form.register("city")} />
      </div>

      <Button type="submit" className="w-full mt-4" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
        {t('createAccount')}
      </Button>
    </form>
  );
}
