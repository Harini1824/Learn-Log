import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function RegisterCoursePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<any>();
  const createCourse = useCreateCourse();

  const onSubmit = (values: any) => {
    createCourse.mutate({ data: { name: values.name, syllabus: values.syllabus } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course created" });
        reset();
      },
      onError: () => toast({ title: "Failed to create course", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div data-testid="page-register-course" className="max-w-lg">
        <Button variant="ghost" className="mb-6" data-testid="btn-back" onClick={() => setLocation("/management/register")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Create New Course</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-card-border rounded-xl p-6">
          <div>
            <Label>Course Name *</Label>
            <Input data-testid="input-name" {...register("name", { required: true })} className="mt-1" placeholder="Course name" />
          </div>
          <div>
            <Label>Syllabus *</Label>
            <Textarea data-testid="input-syllabus" {...register("syllabus", { required: true })} className="mt-1 min-h-[120px]" placeholder="Course syllabus and description" />
          </div>
          <Button data-testid="btn-submit" type="submit" className="w-full" disabled={createCourse.isPending}>
            {createCourse.isPending ? "Creating..." : "Create Course"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
