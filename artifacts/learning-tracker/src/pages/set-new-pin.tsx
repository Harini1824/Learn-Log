import { useState } from "react";
import { useLocation } from "wouter";
import { useSetPin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft } from "lucide-react";

function getEmailFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("email") ?? "";
}

export default function SetNewPinPage() {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const email = getEmailFromSearch();

  const setPin = useSetPin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      toast({ title: "PIN must be exactly 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs do not match", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Email address is missing. Please start over.", variant: "destructive" });
      setLocation("/create-account");
      return;
    }

    setPin.mutate(
      { data: { email, newPin, confirmPin } },
      {
        onSuccess: (result) => {
          setAuth({
            role: result.role as any,
            entityId: result.entityId ?? null,
            phone: "",
            name: result.name ?? null,
          });
          toast({ title: "Account activated! Welcome." });
          setLocation(`/${result.role}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to set PIN";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-set-new-pin">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">KVF Learning Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">Skills Training Platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-2">Set Your PIN</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a 4-digit PIN you will use to sign in.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <div>
                <Label htmlFor="new-pin" className="text-sm font-medium">New PIN</Label>
                <Input
                  id="new-pin"
                  data-testid="input-new-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="confirm-pin" className="text-sm font-medium">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  data-testid="input-confirm-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5"
                  autoComplete="new-password"
                />
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={setPin.isPending}
              >
                {setPin.isPending ? "Activating..." : "Set PIN & Sign In"}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={() => setLocation(-1 as any)}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
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
