import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateAccount } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function CreateAccountPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"management" | "coordinator" | "trainer" | "student">("student");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createAccount = useCreateAccount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@") || !email.includes(".")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (phone.length !== 10) {
      toast({ title: "Phone number must be 10 digits", variant: "destructive" });
      return;
    }

    createAccount.mutate(
      { data: { email, phone, role } },
      {
        onSuccess: (result) => {
          toast({ title: "Temporary PIN sent to your email" });
          setLocation(`/verify-temp-pin?email=${encodeURIComponent(result.email)}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to create account";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-create-account">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">KVF Learning Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">Skills Training Platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value.trim())}
                  className="mt-1.5"
                  autoComplete="email"
                />
              </div>

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
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <select
                  id="role"
                  data-testid="select-role"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                >
                  <option value="management">Management</option>
                  <option value="coordinator">Zonal Coordinator</option>
                  <option value="trainer">Trainer</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? "Sending PIN..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={() => setLocation("/login")}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          A temporary PIN will be emailed to you.
        </p>
      </div>
    </div>
  );
}
