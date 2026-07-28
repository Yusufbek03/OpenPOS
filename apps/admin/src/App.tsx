import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AdminLayout } from '@/components/layout/admin-layout';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { ProductsPage } from '@/pages/products';
import { CategoriesPage } from '@/pages/categories';
import { OrdersPage } from '@/pages/orders';
import { EmployeesPage } from '@/pages/employees';
import { PlaceholderPage } from '@/pages/placeholder';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUser().finally(() => setReady(true));
  }, [loadUser]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary)] flex items-center justify-center">
          <span className="text-white text-xl font-bold">OP</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="kitchen" element={<PlaceholderPage title="Кухня" />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="companies" element={<PlaceholderPage title="Компании" />} />
          <Route path="branches" element={<PlaceholderPage title="Филиалы" />} />
          <Route path="printers" element={<PlaceholderPage title="Принтеры" />} />
          <Route path="suppliers" element={<PlaceholderPage title="Поставщики" />} />
          <Route path="reports" element={<PlaceholderPage title="Отчёты" />} />
          <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
