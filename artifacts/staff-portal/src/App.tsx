import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';

import Dashboard from '@/pages/Dashboard';
import StaffList from '@/pages/StaffList';
import StaffForm from '@/pages/StaffForm';
import Departments from '@/pages/Departments';
import DepartmentDetail from '@/pages/DepartmentDetail';
import Roles from '@/pages/Roles';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/staff" component={StaffList} />
        <Route path="/staff/new" component={StaffForm} />
        <Route path="/staff/:id" component={StaffForm} />
        <Route path="/departments" component={Departments} />
        <Route path="/departments/:id" component={DepartmentDetail} />
        <Route path="/roles" component={Roles} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
