import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { BarChart3, Users, GraduationCap, BookOpen } from "lucide-react";

const roles = [
  {
    id: "management" as const,
    label: "Management",
    description: "Register users, view all progress across zones",
    icon: BarChart3,
    href: "/management",
  },
  {
    id: "coordinator" as const,
    label: "Zonal Coordinator",
    description: "View zone-level student and trainer performance",
    icon: Users,
    href: "/coordinator",
  },
  {
    id: "trainer" as const,
    label: "Trainer",
    description: "Update student ratings and track progress",
    icon: GraduationCap,
    href: "/trainer",
  },
  {
    id: "student" as const,
    label: "Student",
    description: "View your course details and progress",
    icon: BookOpen,
    href: "/student",
  },
];

export default function RoleSelectPage() {
  const { setRole } = useAuth();
  const [, setLocation] = useLocation();

  const handleSelect = (roleId: typeof roles[number]["id"], href: string) => {
    setRole(roleId);
    setLocation(href);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8" data-testid="page-role-select">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Select Your Role</h1>
          <p className="text-muted-foreground mt-1">Choose how you are accessing this platform</p>
        </div>

        <div className="grid gap-4">
          {roles.map(({ id, label, description, icon: Icon, href }) => (
            <button
              key={id}
              data-testid={`role-${id}`}
              onClick={() => handleSelect(id, href)}
              className="flex items-center gap-5 p-5 bg-card border border-card-border rounded-xl hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
