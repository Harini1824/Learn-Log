import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

import LoginPage from "@/pages/login";
import CreateAccountPage from "@/pages/create-account";
import VerifyTempPinPage from "@/pages/verify-temp-pin";
import SetNewPinPage from "@/pages/set-new-pin";
import RoleSelectPage from "@/pages/role-select";
import NotFound from "@/pages/not-found";

// Management
import ManagementDashboard from "@/pages/management/dashboard";
import RegisterHub from "@/pages/management/register/hub";
import RegisterStudentPage from "@/pages/management/register/student";
import RegisterCoordinatorPage from "@/pages/management/register/coordinator";
import RegisterTrainerPage from "@/pages/management/register/trainer";
import RegisterCoursePage from "@/pages/management/register/course";
import RegisterLocationPage from "@/pages/management/register/location";
import StudentsProgressPage from "@/pages/management/progress/students";
import StudentProgressDetailPage from "@/pages/management/progress/student-detail";
import TrainersProgressPage from "@/pages/management/progress/trainers";
import CoordinatorsProgressPage from "@/pages/management/progress/coordinators";
import AuditLogsPage from "@/pages/management/audit-logs";

// Trainer
import TrainerDashboard from "@/pages/trainer/dashboard";
import TrainerProgressPage from "@/pages/trainer/progress";
import TrainerStudentDetailPage from "@/pages/trainer/student-detail";
import TrainerUpdatePage from "@/pages/trainer/update";

// Coordinator
import CoordinatorDashboard from "@/pages/coordinator/dashboard";
import CoordinatorStudentsPage from "@/pages/coordinator/students";
import CoordinatorStudentDetailPage from "@/pages/coordinator/student-detail";
import CoordinatorTrainersPage from "@/pages/coordinator/trainers";
import CoordinatorUpdatePage from "@/pages/coordinator/update";

// Student
import StudentDashboard from "@/pages/student/dashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/create-account" component={CreateAccountPage} />
      <Route path="/verify-temp-pin" component={VerifyTempPinPage} />
      <Route path="/set-new-pin" component={SetNewPinPage} />
      <Route path="/role" component={RoleSelectPage} />

      <Route path="/management" component={ManagementDashboard} />
      <Route path="/management/register" component={RegisterHub} />
      <Route path="/management/register/student" component={RegisterStudentPage} />
      <Route path="/management/register/coordinator" component={RegisterCoordinatorPage} />
      <Route path="/management/register/trainer" component={RegisterTrainerPage} />
      <Route path="/management/register/course" component={RegisterCoursePage} />
      <Route path="/management/register/location" component={RegisterLocationPage} />
      <Route path="/management/progress/students" component={StudentsProgressPage} />
      <Route path="/management/progress/students/:id" component={StudentProgressDetailPage} />
      <Route path="/management/progress/trainers" component={TrainersProgressPage} />
      <Route path="/management/progress/coordinators" component={CoordinatorsProgressPage} />
      <Route path="/management/audit-logs" component={AuditLogsPage} />

      <Route path="/trainer" component={TrainerDashboard} />
      <Route path="/trainer/progress" component={TrainerProgressPage} />
      <Route path="/trainer/progress/:id" component={TrainerStudentDetailPage} />
      <Route path="/trainer/update" component={TrainerUpdatePage} />

      <Route path="/coordinator" component={CoordinatorDashboard} />
      <Route path="/coordinator/students" component={CoordinatorStudentsPage} />
      <Route path="/coordinator/students/:id" component={CoordinatorStudentDetailPage} />
      <Route path="/coordinator/trainers" component={CoordinatorTrainersPage} />
      <Route path="/coordinator/update" component={CoordinatorUpdatePage} />

      <Route path="/student" component={StudentDashboard} />

      <Route path="/" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
