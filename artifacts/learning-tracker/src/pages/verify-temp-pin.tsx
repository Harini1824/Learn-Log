import { useState } from "react";
import { useLocation } from "wouter";
import { useVerifyTempPin, useResendPin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft } from "lucide-react";

function getEmailFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("email") ?? "";
}

export default function VerifyTempPinPage() {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const email = getEmailFromSearch();

  const verifyTempPin = useVerifyTempPin();
  const resendPin = useResendPin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast({ title: "Enter the 4-digit PIN from your email", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Email address is missing. Please start over.", variant: "destructive" });
      setLocation("/create-account");
      return;
    }

    verifyTempPin.mutate(
      { data: { email, pin } },
      {
        onSuccess: (result) => {
          setLocation(`/set-new-pin?email=${encodeURIComponent(result.email)}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Invalid or expired PIN";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  const handleResend = () => {
    if (!email) {
      toast({ title: "Email address is missing. Please start over.", variant: "destructive" });
      setLocation("/create-account");
      return;
    }
    resendPin.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({ title: "A new temporary PIN has been sent to your email" });
          setPin("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to resend PIN";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-verify-temp-pin">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">KVF Learning Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">Skills Training Platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-2">Verify Temporary PIN</h2>
          {email && (
            <p className="text-sm text-muted-foreground mb-6">
              Enter the 4-digit PIN sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <div>
                <Label htmlFor="pin" className="text-sm font-medium">Temporary PIN</Label>
                <Input
                  id="pin"
                  data-testid="input-pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5 text-center tracking-[0.5em] text-lg"
                  autoComplete="one-time-code"
                />
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={verifyTempPin.isPending}
              >
                {verifyTempPin.isPending ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
          </form>

          <div className="mt-5 space-y-3 text-center">
            <div>
              <button
                type="button"
                className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded disabled:opacity-50"
                onClick={handleResend}
                disabled={resendPin.isPending}
              >
                {resendPin.isPending ? "Resending..." : "Resend temporary PIN"}
              </button>
            </div>
            <div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                onClick={() => setLocation("/create-account")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          PIN expires in 10 minutes.
        </p>
      </div>
    </div>
  );
}
