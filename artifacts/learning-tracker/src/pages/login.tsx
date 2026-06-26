import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();

  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast({ title: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    if (pin.length !== 4) {
      toast({ title: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    login.mutate(
      { data: { phone, pin } },
      {
        onSuccess: (result) => {
          setAuth({
            role: result.role as any,
            entityId: result.entityId ?? null,
            phone,
            name: result.name ?? null,
          });
          setLocation(`/${result.role}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Invalid phone number or PIN";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-login">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">KVF Learning Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">Skills Training Platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">+91</span>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="pl-12"
                    autoComplete="tel-national"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pin" className="text-sm font-medium">4-Digit PIN</Label>
                <Input
                  id="pin"
                  data-testid="input-pin"
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5"
                  autoComplete="current-password"
                />
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={() => setLocation("/create-account")}
            >
              First time? Create an account
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          KVF Skills Training Programme
        </p>
      </div>
    </div>
  );
}
