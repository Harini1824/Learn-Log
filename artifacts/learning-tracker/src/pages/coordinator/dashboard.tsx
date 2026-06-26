import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetCoordinatorDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, GraduationCap, Eye } from "lucide-react";

export default function CoordinatorDashboard() {
  const [, setLocation] = useLocation();
  const { entityId } = useAuth();
  const { data, isLoading } = useGetCoordinatorDashboard(entityId ?? 0);

  return (
    <Layout>
      <div data-testid="page-coordinator-dashboard">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Coordinator Dashboard</h1>
          {data && <p className="text-muted-foreground mt-1">Zone: <span className="font-medium text-foreground">{data.zoneName}</span></p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Zone Students", value: data.studentCount, icon: Users, color: "text-blue-600" },
                { label: "Zone Trainers", value: data.trainerCount, icon: GraduationCap, color: "text-purple-600" },
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

            {data.trainerPerformance && data.trainerPerformance.length > 0 && (
              <Card className="mb-8">
                <CardHeader><CardTitle>Trainer Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.trainerPerformance.map(tp => (
                      <div key={tp.trainerId} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{tp.name}</div>
                          <div className="text-xs text-muted-foreground">{tp.studentCount} students</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${tp.completionRate}%` }} />
                          </div>
                          <div className="text-sm font-semibold text-primary w-10 text-right">{tp.completionRate}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Students</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View and monitor all students in your zone</p>
              <Button data-testid="btn-view-students" onClick={() => setLocation("/coordinator/students")} className="w-full">
                View Students
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" />Trainers</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View trainers and update student ratings</p>
              <div className="space-y-2">
                <Button data-testid="btn-view-trainers" variant="outline" onClick={() => setLocation("/coordinator/trainers")} className="w-full">
                  View Trainers
                </Button>
                <Button data-testid="btn-update-progress" variant="outline" onClick={() => setLocation("/coordinator/update")} className="w-full">
                  Update Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
