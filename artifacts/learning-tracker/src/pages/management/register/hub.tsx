import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Users, GraduationCap, BookOpen, MapPin } from "lucide-react";

const options = [
  { label: "New Student", description: "Register a new student with course and trainer", href: "/management/register/student", icon: UserPlus },
  { label: "New Zonal Coordinator", description: "Add a zonal coordinator to a zone", href: "/management/register/coordinator", icon: Users },
  { label: "New Trainer", description: "Add a trainer with zone and centre", href: "/management/register/trainer", icon: GraduationCap },
  { label: "New Course", description: "Create a new training course with syllabus", href: "/management/register/course", icon: BookOpen },
  { label: "New Location", description: "Add a centre with zone and coordinator", href: "/management/register/location", icon: MapPin },
];

export default function RegisterHub() {
  const [, setLocation] = useLocation();
  return (
    <Layout>
      <div data-testid="page-register-hub">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Register</h1>
        <p className="text-muted-foreground mb-8">Select what you want to register</p>
        <div className="grid md:grid-cols-2 gap-4">
          {options.map(({ label, description, href, icon: Icon }) => (
            <button
              key={href}
              data-testid={`btn-${label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setLocation(href)}
              className="flex items-center gap-4 p-5 bg-card border border-card-border rounded-xl hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
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
