import { useLocation } from "wouter";
import { useGetManagementDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, MapPin, Building2, TrendingUp, Plus, Eye, BarChart2, Clock, AlertCircle, FileText, Activity } from "lucide-react";

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

const RATING_BADGE: Record<string, string> = {
  totally_dependent: "bg-red-100 text-red-700",
  physical_prompting: "bg-orange-100 text-orange-700",
  verbal_prompting: "bg-yellow-100 text-yellow-700",
  clueing: "bg-blue-100 text-blue-700",
  independent: "bg-green-100 text-green-700",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

function fmtAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function ManagementDashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetManagementDashboard();

  return (
    <Layout>
      <div data-testid="page-management-dashboard">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all training activities across Tamil Nadu</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : data && (
          <>
            {/* Core stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Students", value: data.totalStudents, icon: Users, color: "text-blue-600" },
                { label: "Trainers", value: data.totalTrainers, icon: UserCheck, color: "text-purple-600" },
                { label: "Coordinators", value: data.totalCoordinators, icon: Users, color: "text-teal-600" },
                { label: "Zones", value: data.totalZones, icon: MapPin, color: "text-orange-600" },
                { label: "Centres", value: data.totalLocations, icon: Building2, color: "text-pink-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} data-testid={`stat-${label.toLowerCase()}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Activity stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Ratings", value: data.totalRatings, icon: BarChart2, color: "text-indigo-600", testid: "stat-total-ratings" },
                { label: "Ratings Today", value: data.ratingsToday, icon: Clock, color: "text-green-600", testid: "stat-ratings-today" },
                { label: "Pending Modules", value: data.pendingModules, icon: AlertCircle, color: "text-amber-600", testid: "stat-pending-modules" },
              ].map(({ label, value, icon: Icon, color, testid }) => (
                <Card key={label} data-testid={testid}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Completion rate */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Overall Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">{data.overallCompletionRate}%</div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${data.overallCompletionRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Rating Distribution */}
              <Card>
                <CardHeader><CardTitle>Rating Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.ratingDistribution.map(({ rating, count }) => {
                      const total = data.ratingDistribution.reduce((s, r) => s + r.count, 0);
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="w-36 text-sm text-muted-foreground">{RATING_LABELS[rating] || rating}</div>
                          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${RATING_COLORS[rating] || "bg-primary"}`}
                              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
                          </div>
                          <div className="w-8 text-right text-sm font-medium text-foreground">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recently Updated Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Recently Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentlyUpdated.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.recentlyUpdated.map(r => (
                        <div key={r.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{r.studentName}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.moduleName}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${RATING_BADGE[r.rating] ?? "bg-muted text-muted-foreground"}`}>
                              {RATING_LABELS[r.rating] ?? r.rating}
                            </span>
                            <span className="text-xs text-muted-foreground">{fmt(r.updatedAt ?? r.submittedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Audit Logs */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Recent Audit Logs
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/management/audit-logs")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.recentAuditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit logs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentAuditLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-foreground">{fmtAction(log.action)}</span>
                          {log.userName && <span className="text-xs text-muted-foreground ml-1">by {log.userName}</span>}
                          <span className="text-xs text-muted-foreground ml-1">· {log.entityType}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Register</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Add new students, trainers, coordinators, courses, and locations</p>
                  <Button data-testid="btn-register" onClick={() => setLocation("/management/register")} className="w-full">
                    Go to Registration
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />View Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="btn-student-progress" onClick={() => setLocation("/management/progress/students")}>
                      Student Progress
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="btn-trainer-progress" onClick={() => setLocation("/management/progress/trainers")}>
                      Trainer Progress
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="btn-coordinator-progress" onClick={() => setLocation("/management/progress/coordinators")}>
                      Coordinator Progress
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="btn-audit-logs" onClick={() => setLocation("/management/audit-logs")}>
                      Audit Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
