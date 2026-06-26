import { useState } from "react";
import { useLocation } from "wouter";
import { useListStudents } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, ChevronRight } from "lucide-react";

export default function StudentsProgressPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useListStudents({ search: search || undefined });

  return (
    <Layout>
      <div data-testid="page-students-progress">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Student Progress</h1>
        <p className="text-muted-foreground mb-6">View progress for all registered students</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            className="pl-9"
            placeholder="Search students by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {students?.length === 0 && <p className="text-muted-foreground text-center py-8">No students found</p>}
            {students?.map(s => (
              <button
                key={s.id}
                data-testid={`student-row-${s.id}`}
                onClick={() => setLocation(`/management/progress/students/${s.id}`)}
                className="w-full flex items-center justify-between p-4 bg-card border border-card-border rounded-xl hover:border-primary hover:shadow-sm transition-all text-left"
              >
                <div>
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.phone} {s.centreName ? `· ${s.centreName}` : ""}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
