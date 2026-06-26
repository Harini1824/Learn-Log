import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateStudent, useListCourses, useListTrainers, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function RegisterStudentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<any>();
  const { data: courses } = useListCourses();
  const { data: trainers } = useListTrainers();
  const createStudent = useCreateStudent();

  const onSubmit = (values: any) => {
    createStudent.mutate({
      data: {
        name: values.name,
        email: values.email || null,
        phone: values.phone,
        courseId: parseInt(values.courseId),
        timing: values.timing || null,
        centreName: values.centreName || null,
        trainerId: values.trainerId ? parseInt(values.trainerId) : null,
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        toast({ title: "Student registered successfully" });
        reset();
      },
      onError: () => toast({ title: "Failed to register student", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div data-testid="page-register-student" className="max-w-lg">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management/register")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Register New Student</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-card-border rounded-xl p-6">
          <div>
            <Label>Full Name *</Label>
            <Input data-testid="input-name" {...register("name", { required: true })} className="mt-1" placeholder="Student's full name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input data-testid="input-email" type="email" {...register("email")} className="mt-1" placeholder="student@email.com" />
          </div>
          <div>
            <Label>Phone Number *</Label>
            <Input data-testid="input-phone" type="tel" maxLength={10} {...register("phone", { required: true })} className="mt-1" placeholder="10-digit mobile number" />
          </div>
          <div>
            <Label>Course *</Label>
            <select data-testid="select-course" {...register("courseId", { required: true })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select course</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Timing</Label>
            <Input data-testid="input-timing" {...register("timing")} className="mt-1" placeholder="e.g. Morning 9-11am" />
          </div>
          <div>
            <Label>Centre Name</Label>
            <Input data-testid="input-centre" {...register("centreName")} className="mt-1" placeholder="Centre name" />
          </div>
          <div>
            <Label>Trainer</Label>
            <select data-testid="select-trainer" {...register("trainerId")} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select trainer (optional)</option>
              {trainers?.map(t => <option key={t.id} value={t.id}>{t.name} — {t.zoneName}</option>)}
            </select>
          </div>
          <Button data-testid="btn-submit" type="submit" className="w-full" disabled={createStudent.isPending}>
            {createStudent.isPending ? "Registering..." : "Register Student"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
