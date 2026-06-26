import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useGetStudentProgress } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, ChevronDown } from "lucide-react";

const RATING_LABELS: Record<string, string> = {
  totally_dependent: "Totally Dependent",
  physical_prompting: "Physical Prompting",
  verbal_prompting: "Verbal Prompting",
  clueing: "Clueing",
  independent: "Independent",
};

const RATING_COLORS: Record<string, string> = {
  totally_dependent: "bg-red-100 text-red-700 border-red-200",
  physical_prompting: "bg-orange-100 text-orange-700 border-orange-200",
  verbal_prompting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  clueing: "bg-blue-100 text-blue-700 border-blue-200",
  independent: "bg-green-100 text-green-700 border-green-200",
};

export default function StudentProgressDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetStudentProgress(parseInt(id));

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      setSelectedUnitId(data.units.length === 1 ? data.units[0].unitId : null);
      setSelectedChapterId(null);
    }
  }, [data]);

  const handleUnitChange = (unitId: number | null) => {
    setSelectedUnitId(unitId);
    setSelectedChapterId(null);
  };

  const chaptersForDropdown = selectedUnitId
    ? data?.units.find(u => u.unitId === selectedUnitId)?.chapters ?? []
    : [];

  const filteredUnits = data?.units
    .filter(u => !selectedUnitId || u.unitId === selectedUnitId)
    .map(u => ({ ...u, chapters: u.chapters.filter(ch => !selectedChapterId || ch.chapterId === selectedChapterId) })) ?? [];

  return (
    <Layout>
      <div data-testid="page-student-detail">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management/progress/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : data && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">{data.student.name}</h1>
              <div className="text-muted-foreground text-sm mt-1 space-x-3">
                <span>{data.student.phone}</span>
                {data.student.centreName && <span>· {data.student.centreName}</span>}
                {data.student.timing && <span>· {data.student.timing}</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Course:</span>
                <span className="text-sm text-muted-foreground">{data.student.courseName}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Completion:</span>
                <span className="text-sm font-semibold text-primary">{data.completionRate}%</span>
              </div>
            </div>

            {/* Cascade filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl border border-border mb-6">
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={selectedUnitId ?? ""}
                    onChange={e => handleUnitChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">All Units</option>
                    {data.units.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              {selectedUnitId && chaptersForDropdown.length > 0 && (
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground">Chapter</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={selectedChapterId ?? ""}
                      onChange={e => setSelectedChapterId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">All Chapters</option>
                      {chaptersForDropdown.map(ch => <option key={ch.chapterId} value={ch.chapterId}>{ch.chapterName}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {filteredUnits.map(unit => (
                <div key={unit.unitId} className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-5 py-3 border-b border-border">
                    <h2 className="font-semibold text-foreground text-sm">{unit.unitName}</h2>
                  </div>
                  {unit.chapters.map(chapter => (
                    <div key={chapter.chapterId}>
                      <div className="px-5 py-2.5 bg-muted/20 border-b border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">{chapter.chapterName}</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {chapter.modules.map(mod => (
                          <div key={mod.moduleId} data-testid={`module-row-${mod.moduleId}`} className="px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {mod.rating ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                              )}
                              <div>
                                <span className="text-sm text-foreground">{mod.moduleName}</span>
                                {mod.comments && <p className="text-xs text-muted-foreground italic mt-0.5">"{mod.comments}"</p>}
                              </div>
                            </div>
                            {mod.rating && (
                              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${RATING_COLORS[mod.rating] || ""}`}>
                                {RATING_LABELS[mod.rating] || mod.rating}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
