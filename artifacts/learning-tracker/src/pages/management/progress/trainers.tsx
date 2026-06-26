import { useLocation } from "wouter";
import { useListTrainers } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

export default function TrainersProgressPage() {
  const [, setLocation] = useLocation();
  const { data: trainers, isLoading } = useListTrainers();

  return (
    <Layout>
      <div data-testid="page-trainers-progress">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Trainer Progress</h1>
        <p className="text-muted-foreground mb-6">Overview of all trainers across Tamil Nadu</p>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {trainers?.length === 0 && <p className="text-muted-foreground text-center py-8">No trainers found</p>}
            {trainers?.map(t => (
              <div
                key={t.id}
                data-testid={`trainer-row-${t.id}`}
                className="flex items-center gap-4 p-4 bg-card border border-card-border rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{t.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.zoneName}
                    {t.centreName ? ` · ${t.centreName}` : ""}
                    {t.phone ? ` · ${t.phone}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{t.studentCount}</div>
                  <div className="text-xs text-muted-foreground">students</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
