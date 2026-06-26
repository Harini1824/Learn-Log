import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateLocation, useListZones, useListCoordinators, getListLocationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function RegisterLocationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<any>();
  const { data: zones } = useListZones();
  const { data: coordinators } = useListCoordinators();
  const createLocation = useCreateLocation();

  const onSubmit = (values: any) => {
    createLocation.mutate({ data: { centreName: values.centreName, zoneId: parseInt(values.zoneId), coordinatorId: values.coordinatorId ? parseInt(values.coordinatorId) : null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        toast({ title: "Location/Centre registered" });
        reset();
      },
      onError: () => toast({ title: "Failed to register location", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div data-testid="page-register-location" className="max-w-lg">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management/register")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Register New Location / Centre</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-card-border rounded-xl p-6">
          <div>
            <Label>Centre Name *</Label>
            <Input data-testid="input-centre" {...register("centreName", { required: true })} className="mt-1" placeholder="Centre name" />
          </div>
          <div>
            <Label>Zone *</Label>
            <select data-testid="select-zone" {...register("zoneId", { required: true })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select zone</option>
              {zones?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Zonal Coordinator</Label>
            <select data-testid="select-coordinator" {...register("coordinatorId")} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select coordinator (optional)</option>
              {coordinators?.map(c => <option key={c.id} value={c.id}>{c.name} — {c.zoneName}</option>)}
            </select>
          </div>
          <Button data-testid="btn-submit" type="submit" className="w-full" disabled={createLocation.isPending}>
            {createLocation.isPending ? "Registering..." : "Register Location"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
