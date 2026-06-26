import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateTrainer, useListZones, getListTrainersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function RegisterTrainerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<any>();
  const { data: zones } = useListZones();
  const createTrainer = useCreateTrainer();

  const onSubmit = (values: any) => {
    createTrainer.mutate({ data: { name: values.name, zoneId: parseInt(values.zoneId), centreName: values.centreName || null, phone: values.phone || null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTrainersQueryKey() });
        toast({ title: "Trainer registered" });
        reset();
      },
      onError: () => toast({ title: "Failed to register trainer", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div data-testid="page-register-trainer" className="max-w-lg">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management/register")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Register New Trainer</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-card-border rounded-xl p-6">
          <div>
            <Label>Full Name *</Label>
            <Input data-testid="input-name" {...register("name", { required: true })} className="mt-1" placeholder="Trainer name" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input data-testid="input-phone" type="tel" maxLength={10} {...register("phone")} className="mt-1" placeholder="10-digit mobile number" />
          </div>
          <div>
            <Label>Zone *</Label>
            <select data-testid="select-zone" {...register("zoneId", { required: true })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select zone</option>
              {zones?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Centre Name</Label>
            <Input data-testid="input-centre" {...register("centreName")} className="mt-1" placeholder="Centre name (optional)" />
          </div>
          <Button data-testid="btn-submit" type="submit" className="w-full" disabled={createTrainer.isPending}>
            {createTrainer.isPending ? "Registering..." : "Register Trainer"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
