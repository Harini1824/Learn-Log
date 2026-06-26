import { useLocation } from "wouter";
import { useListCoordinators } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

export default function CoordinatorsProgressPage() {
  const [, setLocation] = useLocation();
  const { data: coordinators, isLoading } = useListCoordinators();

  return (
    <Layout>
      <div data-testid="page-coordinators-progress">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Coordinator Progress</h1>
        <p className="text-muted-foreground mb-6">All zonal coordinators across Tamil Nadu</p>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {coordinators?.length === 0 && <p className="text-muted-foreground text-center py-8">No coordinators found</p>}
            {coordinators?.map(c => (
              <div key={c.id} data-testid={`coordinator-row-${c.id}`} className="flex items-center gap-4 p-4 bg-card border border-card-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.zoneName}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
