import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListStudents, useGetStudentProgress, useSubmitProgress, getGetStudentProgressQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, CheckCircle, Save, ChevronDown } from "lucide-react";

const RATINGS = [
  { value: "totally_dependent", label: "Totally Dependent" },
  { value: "physical_prompting", label: "Physical Prompting" },
  { value: "verbal_prompting", label: "Verbal Prompting" },
  { value: "clueing", label: "Clueing" },
  { value: "independent", label: "Independent" },
];

const RATING_COLORS_SELECTED: Record<string, string> = {
  totally_dependent: "bg-red-500 border-red-500 text-white",
  physical_prompting: "bg-orange-500 border-orange-500 text-white",
  verbal_prompting: "bg-yellow-500 border-yellow-500 text-white",
  clueing: "bg-blue-500 border-blue-500 text-white",
  independent: "bg-green-500 border-green-500 text-white",
};

export default function CoordinatorUpdatePage() {
  const [, setLocation] = useLocation();
  const { entityId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  const listboxId = "coordinator-student-listbox";
  const { data: students } = useListStudents({ search: search || undefined });
  const selectedStudent = students?.find(s => s.id === selectedStudentId);
  const { data: progress, isLoading: progressLoading } = useGetStudentProgress(selectedStudentId ?? 0);
  const submitProgress = useSubmitProgress();

  useEffect(() => {
    if (progress) {
      const init: Record<number, string> = {};
      progress.units.forEach(u => u.chapters.forEach(ch => ch.modules.forEach(mod => {
        if (mod.comments) init[mod.moduleId] = mod.comments;
      })));
      setComments(init);
      setRatings({});
      setSelectedUnitId(progress.units.length === 1 ? progress.units[0].unitId : null);
      setSelectedChapterId(null);
    }
  }, [progress]);

  const dropdownItems = showDropdown && !selectedStudentId && students && students.length > 0 ? students : [];

  const handleSelectStudent = (id: number, name: string) => {
    setSelectedStudentId(id);
    setSearch(name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (dropdownItems.length === 0) {
      if (e.key === "ArrowDown") { setShowDropdown(true); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex(p => Math.min(p + 1, dropdownItems.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setHighlightedIndex(p => Math.max(p - 1, 0)); break;
      case "Enter": e.preventDefault(); if (highlightedIndex >= 0) handleSelectStudent(dropdownItems[highlightedIndex].id, dropdownItems[highlightedIndex].name); break;
      case "Escape": setShowDropdown(false); setHighlightedIndex(-1); break;
      case "Tab": setShowDropdown(false); setHighlightedIndex(-1); break;
    }
  };

  const handleUnitChange = (unitId: number | null) => {
    setSelectedUnitId(unitId);
    setSelectedChapterId(null);
  };

  const chaptersForDropdown = selectedUnitId
    ? progress?.units.find(u => u.unitId === selectedUnitId)?.chapters ?? []
    : [];

  const filteredUnits = progress?.units
    .filter(u => !selectedUnitId || u.unitId === selectedUnitId)
    .map(u => ({ ...u, chapters: u.chapters.filter(ch => !selectedChapterId || ch.chapterId === selectedChapterId) })) ?? [];

  const handleSave = (moduleId: number, trainerIdForMod: number | null) => {
    if (!ratings[moduleId] || !selectedStudentId) return;
    submitProgress.mutate({
      data: {
        studentId: selectedStudentId,
        moduleId,
        trainerId: trainerIdForMod ?? entityId ?? null,
        rating: ratings[moduleId] as any,
        comments: comments[moduleId]?.trim() || null,
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetStudentProgressQueryKey(selectedStudentId) });
        toast({ title: "Progress updated" });
      },
      onError: () => toast({ title: "Failed to update progress", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div data-testid="page-coordinator-update">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/coordinator")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Update Student Progress</h1>
        <p className="text-muted-foreground mb-6">Search for a student and rate their module performance</p>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            data-testid="input-search"
            className="pl-9"
            placeholder="Search student by name..."
            value={search}
            role="combobox"
            aria-expanded={dropdownItems.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={highlightedIndex >= 0 ? `coord-student-option-${dropdownItems[highlightedIndex]?.id}` : undefined}
            aria-autocomplete="list"
            onFocus={() => setShowDropdown(true)}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelectedStudentId(null); setHighlightedIndex(-1); }}
            onKeyDown={handleInputKeyDown}
            onBlur={() => { setTimeout(() => setShowDropdown(false), 150); }}
          />
          {dropdownItems.length > 0 && (
            <ul id={listboxId} role="listbox" aria-label="Students"
              className="absolute top-full left-0 right-0 bg-card border border-card-border rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
              {dropdownItems.map((s, idx) => (
                <li key={s.id} id={`coord-student-option-${s.id}`} role="option" aria-selected={highlightedIndex === idx}
                  data-testid={`autocomplete-${s.id}`}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-border last:border-0 cursor-pointer select-none ${highlightedIndex === idx ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  onMouseDown={e => { e.preventDefault(); handleSelectStudent(s.id, s.name); }}>
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.phone}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedStudentId && progressLoading && (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        )}

        {selectedStudentId && progress && (
          <div className="space-y-6">
            <div className="mb-2 text-sm text-muted-foreground">
              Rating modules for: <span className="font-semibold text-foreground">{selectedStudent?.name}</span>
              {selectedStudent?.courseName && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{selectedStudent.courseName}</span>}
            </div>

            {/* Cascade dropdowns */}
            <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={selectedUnitId ?? ""}
                    onChange={e => handleUnitChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">All Units</option>
                    {progress.units.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
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
                      {chapter.modules.map(mod => {
                        const trainerIdForMod = mod.trainerId ?? null;
                        return (
                          <div key={mod.moduleId} data-testid={`module-update-${mod.moduleId}`} className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              {mod.rating && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              <span className="text-sm font-medium text-foreground">{mod.moduleName}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={`Rating for ${mod.moduleName}`}>
                              {RATINGS.map(r => {
                                const isCurrentlyRated = mod.rating === r.value;
                                const isSelected = ratings[mod.moduleId] === r.value;
                                return (
                                  <button key={r.value} type="button"
                                    data-testid={`rating-${mod.moduleId}-${r.value}`}
                                    aria-pressed={isSelected}
                                    onClick={() => setRatings(prev => ({ ...prev, [mod.moduleId]: r.value }))}
                                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${isSelected ? RATING_COLORS_SELECTED[r.value] : isCurrentlyRated ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background"}`}>
                                    {r.label}{isCurrentlyRated && !isSelected && " ✓"}
                                  </button>
                                );
                              })}
                            </div>
                            {(mod.comments || ratings[mod.moduleId]) && (
                              <div className="mb-3">
                                <textarea
                                  className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                                  rows={2}
                                  maxLength={500}
                                  placeholder="Optional comments (max 500 chars)..."
                                  value={comments[mod.moduleId] ?? ""}
                                  onChange={e => setComments(prev => ({ ...prev, [mod.moduleId]: e.target.value }))}
                                />
                                <div className="text-right text-xs text-muted-foreground mt-0.5">{(comments[mod.moduleId] ?? "").length}/500</div>
                              </div>
                            )}
                            {ratings[mod.moduleId] && (
                              <Button data-testid={`btn-save-${mod.moduleId}`} type="button" size="sm" className="h-7 px-3 text-xs"
                                onClick={() => handleSave(mod.moduleId, trainerIdForMod)} disabled={submitProgress.isPending}>
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                            )}
                            {mod.comments && !ratings[mod.moduleId] && (
                              <p className="text-xs text-muted-foreground italic mt-1">"{mod.comments}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
