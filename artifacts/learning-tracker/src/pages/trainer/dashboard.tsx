import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetTrainerDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, PenSquare } from "lucide-react";

const RATING_LABELS: Record<string, string> = {
  totally_dependent: "Totally Dependent",
  physical_prompting: "Physical Prompting",
  verbal_prompting: "Verbal Prompting",
  clueing: "Clueing",
  independent: "Independent",
};

const RATING_COLORS: Record<string, string> = {
  totally_dependent: "bg-red-500",
  physical_prompting: "bg-orange-500",
  verbal_prompting: "bg-yellow-500",
  clueing: "bg-blue-500",
  independent: "bg-green-500",
};

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const { entityId } = useAuth();
  const { data, isLoading } = useGetTrainerDashboard(entityId ?? 0);

  return (
    <Layout>
      <div data-testid="page-trainer-dashboard">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Trainer Dashboard</h1>
          {data && <p className="text-muted-foreground mt-1">{data.trainerName} · {data.zoneName}</p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "My Students", value: data.studentCount, icon: Users, color: "text-blue-600" },
                { label: "Completion Rate", value: `${data.completionRate}%`, icon: TrendingUp, color: "text-green-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="p-5">
                    <Icon className={`w-5 h-5 ${color} mb-2`} />
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.ratingDistribution && data.ratingDistribution.length > 0 && (
              <Card className="mb-8">
                <CardHeader><CardTitle>Rating Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.ratingDistribution.map(({ rating, count }) => {
                      const total = data.ratingDistribution.reduce((s, r) => s + r.count, 0);
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="w-36 text-sm text-muted-foreground">{RATING_LABELS[rating] || rating}</div>
                          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${RATING_COLORS[rating] || "bg-primary"}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
                          </div>
                          <div className="w-8 text-right text-sm font-medium">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />My Students</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View progress for all your students</p>
              <Button data-testid="btn-view-progress" onClick={() => setLocation("/trainer/progress")} className="w-full">
                View Student Progress
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PenSquare className="w-5 h-5" />Update Ratings</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Submit or update progress ratings for students</p>
              <Button data-testid="btn-update-progress" variant="outline" onClick={() => setLocation("/trainer/update")} className="w-full">
                Update Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
