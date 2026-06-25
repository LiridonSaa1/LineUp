import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { RootLayout } from "@/components/layout/RootLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// User Pages
import Home from "@/pages/home/Home";
import Contact from "@/pages/contact/Contact";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import BarbershopsList from "@/pages/barbershops/BarbershopsList";
import BarbershopDetail from "@/pages/barbershops/BarbershopDetail";
import BookingWizard from "@/pages/book/BookingWizard";
import Appointments from "@/pages/user/Appointments";
import Profile from "@/pages/user/Profile";
import Marketplace from "@/pages/marketplace/Marketplace";
import Orders from "@/pages/user/Orders";
import Notifications from "@/pages/user/Notifications";
import NotFound from "@/pages/not-found";

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import DashboardAppointments from "@/pages/dashboard/DashboardAppointments";
import DashboardBarbers from "@/pages/dashboard/DashboardBarbers";
import DashboardServices from "@/pages/dashboard/DashboardServices";
import DashboardProducts from "@/pages/dashboard/DashboardProducts";
import DashboardSubscription from "@/pages/dashboard/DashboardSubscription";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBarbershops from "@/pages/admin/AdminBarbershops";
import AdminUsers from "@/pages/admin/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function UserRouter() {
  return (
    <RootLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/barbershops" component={BarbershopsList} />
        <Route path="/barbershops/:id" component={BarbershopDetail} />
        <Route path="/book/:shopId" component={BookingWizard} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/orders" component={Orders} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              
              <Route path="/dashboard*">
                <DashboardLayout>
                  <Switch>
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/dashboard/appointments" component={DashboardAppointments} />
                    <Route path="/dashboard/barbers" component={DashboardBarbers} />
                    <Route path="/dashboard/services" component={DashboardServices} />
                    <Route path="/dashboard/products" component={DashboardProducts} />
                    <Route path="/dashboard/subscription" component={DashboardSubscription} />
                    <Route component={NotFound} />
                  </Switch>
                </DashboardLayout>
              </Route>

              <Route path="/admin*">
                <AdminLayout>
                  <Switch>
                    <Route path="/admin" component={AdminDashboard} />
                    <Route path="/admin/barbershops" component={AdminBarbershops} />
                    <Route path="/admin/users" component={AdminUsers} />
                    <Route component={NotFound} />
                  </Switch>
                </AdminLayout>
              </Route>

              <Route>
                <UserRouter />
              </Route>
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
