import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  LayoutDashboard, 
  User, 
  Settings,
  GraduationCap,
  Briefcase
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./LanguageProvider";

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <span>CareerPath</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="flex gap-2">
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </Button>
            </Link>

            <Link href="/careers">
              <Button variant="ghost" className="flex gap-2">
                <Briefcase className="w-4 h-4" />
                {t('careers')} & {t('courses')}
              </Button>
            </Link>

            {user.role === 'admin' && (
              <Link href="/admin">
                <Button variant="ghost" className="flex gap-2">
                  <Settings className="w-4 h-4" />
                  {t('admin')}
                </Button>
              </Link>
            )}
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-1 md:gap-3">
            <ThemeToggle />
            <LanguageToggle />
            
            <div className="text-right hidden sm:block ml-2">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => logout()}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
