import { useState } from "react";
import { useLocation } from "wouter";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, FileText, ChevronDown } from "lucide-react";

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  "login", "login_failed", "progress_create", "progress_update",
  "student_created", "user_created", "account_created", "pin_set",
];

const ENTITY_TYPE_OPTIONS = ["user", "student", "trainer", "coordinator", "progress"];

function fmtAction(a: string) {
  return a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const ACTION_BADGE: Record<string, string> = {
  login: "bg-green-100 text-green-700",
  login_failed: "bg-red-100 text-red-700",
  progress_create: "bg-blue-100 text-blue-700",
  progress_update: "bg-indigo-100 text-indigo-700",
  student_created: "bg-purple-100 text-purple-700",
  user_created: "bg-teal-100 text-teal-700",
  account_created: "bg-cyan-100 text-cyan-700",
  pin_set: "bg-orange-100 text-orange-700",
};

export default function AuditLogsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useListAuditLogs({
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleFilterChange = () => setPage(1);

  return (
    <Layout>
      <div data-testid="page-audit-logs">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation("/management")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">Track all system events, logins, and data changes</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by user, action, entity..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); handleFilterChange(); }}
                />
              </div>

              {/* Date From */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); handleFilterChange(); }} />
              </div>

              {/* Date To */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); handleFilterChange(); }} />
              </div>

              {/* Action */}
              <div className="relative">
                <label className="text-xs text-muted-foreground mb-1 block">Action</label>
                <select
                  className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={action}
                  onChange={e => { setAction(e.target.value); handleFilterChange(); }}
                >
                  <option value="">All Actions</option>
                  {ACTION_OPTIONS.map(a => <option key={a} value={a}>{fmtAction(a)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Entity Type */}
              <div className="relative">
                <label className="text-xs text-muted-foreground mb-1 block">Entity Type</label>
                <select
                  className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={entityType}
                  onChange={e => { setEntityType(e.target.value); handleFilterChange(); }}
                >
                  <option value="">All Types</option>
                  {ENTITY_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Clear */}
              <div className="flex items-end">
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setAction(""); setEntityType(""); setPage(1); }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{isLoading ? "Loading…" : `${data?.total ?? 0} entries`}</span>
              {data && data.total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No audit log entries found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.items.map(log => (
                  <div key={log.id} className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* Timestamp */}
                      <div className="w-36 flex-shrink-0 text-xs text-muted-foreground">{fmt(log.timestamp)}</div>

                      {/* Action badge */}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${ACTION_BADGE[log.action] ?? "bg-muted text-muted-foreground"}`}>
                        {fmtAction(log.action)}
                      </span>

                      {/* User */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium truncate">
                          {log.userName ?? (log.userId ? `User #${log.userId}` : "System")}
                        </span>
                        {log.role && <span className="text-xs text-muted-foreground ml-1">({log.role})</span>}
                      </div>

                      {/* Entity */}
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {log.entityType}{log.entityId ? ` #${log.entityId}` : ""}
                      </div>

                      {/* Expand button */}
                      {(log.oldValue || log.newValue) && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          aria-label="Toggle details"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Expanded details */}
                    {expandedId === log.id && (log.oldValue || log.newValue) && (
                      <div className="mt-2 grid grid-cols-2 gap-2 ml-36">
                        {log.oldValue && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <div className="text-xs font-medium text-red-600 mb-1">Previous</div>
                            <pre className="text-xs text-red-800 whitespace-pre-wrap break-all">{(() => { try { return JSON.stringify(JSON.parse(log.oldValue), null, 2); } catch { return log.oldValue; } })()}</pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="text-xs font-medium text-green-600 mb-1">New</div>
                            <pre className="text-xs text-green-800 whitespace-pre-wrap break-all">{(() => { try { return JSON.stringify(JSON.parse(log.newValue), null, 2); } catch { return log.newValue; } })()}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
