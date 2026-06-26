import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { role, name, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!role && location !== "/login" && location !== "/role") {
      setLocation("/login");
    }
  }, [role, location, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const roleLabels = {
    management: "Management",
    coordinator: "Zonal Coordinator",
    trainer: "Trainer",
    student: "Student",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/${role || 'login'}`} className="font-bold text-xl tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                <span>KVF Learning Tracker</span>
              </Link>
              {role && (
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-foreground/20 text-primary-foreground">
                  {roleLabels[role as keyof typeof roleLabels]}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {name && <span className="text-sm font-medium opacity-90 hidden sm:block">{name}</span>}
              {role && (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
