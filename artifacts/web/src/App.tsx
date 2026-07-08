import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/context/CartContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BarberLayout } from "@/components/layout/BarberLayout";

// User Pages
import Home from "@/pages/home/Home";
import Contact from "@/pages/contact/Contact";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import BarbershopsList from "@/pages/barbershops/BarbershopsList";
import BarbershopDetail from "@/pages/barbershops/BarbershopDetail";
import BarberDetail from "@/pages/barbershops/BarberDetail";
import BookingWizard from "@/pages/book/BookingWizard";
import Appointments from "@/pages/user/Appointments";
import Profile from "@/pages/user/Profile";
import Marketplace from "@/pages/marketplace/Marketplace";
import Orders from "@/pages/user/Orders";
import Notifications from "@/pages/user/Notifications";
import UserDashboard from "@/pages/user/UserDashboard";
import NotFound from "@/pages/not-found";

// Owner Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import DashboardStats from "@/pages/dashboard/DashboardStats";
import DashboardAppointments from "@/pages/dashboard/DashboardAppointments";
import DashboardBarbers from "@/pages/dashboard/DashboardBarbers";
import DashboardServices from "@/pages/dashboard/DashboardServices";
import DashboardProducts from "@/pages/dashboard/DashboardProducts";
import DashboardSubscription from "@/pages/dashboard/DashboardSubscription";
import DashboardClients from "@/pages/dashboard/DashboardClients";
import DashboardSettings from "@/pages/dashboard/DashboardSettings";
import DashboardPayments from "@/pages/dashboard/DashboardPayments";
import DashboardHolidays from "@/pages/dashboard/DashboardHolidays";
import DashboardCoupons from "@/pages/dashboard/DashboardCoupons";
import DashboardWaitingList from "@/pages/dashboard/DashboardWaitingList";
import DashboardRecurring from "@/pages/dashboard/DashboardRecurring";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBarbershops from "@/pages/admin/AdminBarbershops";
import AdminUsers from "@/pages/admin/AdminUsers";

// Barber Panel Pages
import BarberDashboard from "@/pages/barber/BarberDashboard";
import BarberAppointments from "@/pages/barber/BarberAppointments";
import BarberClients from "@/pages/barber/BarberClients";
import BarberAvailability from "@/pages/barber/BarberAvailability";
import BarberStats from "@/pages/barber/BarberStats";
import BarberReviews from "@/pages/barber/BarberReviews";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (location.includes("#")) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function UserRouter() {
  return (
    <RootLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/barbershops" component={BarbershopsList} />
        <Route path="/barbershops/:id" component={BarbershopDetail} />
        <Route path="/barbers/:id" component={BarberDetail} />
        <Route path="/book/:shopId" component={BookingWizard} />
        <Route path="/me" component={UserDashboard} />
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

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/stats" component={DashboardStats} />
        <Route path="/dashboard/appointments" component={DashboardAppointments} />
        <Route path="/dashboard/barbers" component={DashboardBarbers} />
        <Route path="/dashboard/services" component={DashboardServices} />
        <Route path="/dashboard/products" component={DashboardProducts} />
        <Route path="/dashboard/subscription" component={DashboardSubscription} />
        <Route path="/dashboard/clients" component={DashboardClients} />
        <Route path="/dashboard/settings" component={DashboardSettings} />
        <Route path="/dashboard/payments" component={DashboardPayments} />
        <Route path="/dashboard/holidays" component={DashboardHolidays} />
        <Route path="/dashboard/coupons" component={DashboardCoupons} />
        <Route path="/dashboard/waiting-list" component={DashboardWaitingList} />
        <Route path="/dashboard/recurring" component={DashboardRecurring} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/barbershops" component={AdminBarbershops} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function BarberPanelRouter() {
  return (
    <BarberLayout>
      <Switch>
        <Route path="/barber" component={BarberDashboard} />
        <Route path="/barber/appointments" component={BarberAppointments} />
        <Route path="/barber/clients" component={BarberClients} />
        <Route path="/barber/availability" component={BarberAvailability} />
        <Route path="/barber/stats" component={BarberStats} />
        <Route path="/barber/reviews" component={BarberReviews} />
        <Route component={NotFound} />
      </Switch>
    </BarberLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />

              <Route path="/dashboard" component={DashboardRouter} />
              <Route path="/dashboard/:rest*" component={DashboardRouter} />

              <Route path="/admin" component={AdminRouter} />
              <Route path="/admin/:rest*" component={AdminRouter} />

              <Route path="/barber" component={BarberPanelRouter} />
              <Route path="/barber/:rest*" component={BarberPanelRouter} />

              <Route>
                <UserRouter />
              </Route>
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
