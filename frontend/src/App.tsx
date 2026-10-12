import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/login/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { UsersPage } from "./pages/admin/UsersPage";
import { DishesPage } from "./pages/admin/dishes/DishesPage";
import { MenuDayPage } from "./pages/admin/menu/MenuDayPage";
import { CajaLayout } from "./pages/caja/CajaLayout";
import { CocinaLayout } from "./pages/cocina/CocinaLayout";
import { MenuLayout } from "./pages/clientes/MenuLayout";
import { MenuPage } from "./pages/clientes/menu/MenuPage";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
      {title}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/menu" element={<MenuLayout />}>
              <Route index element={<MenuPage />} />
            </Route>
            <Route path="/mis-pedidos" element={<MenuLayout />}>
              <Route index element={<Placeholder title="Mis pedidos — disponible en el Sprint 5" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["administrador"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<UsersPage />} />
              <Route path="platillos" element={<DishesPage />} />
              <Route path="menu-dia" element={<MenuDayPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["cajero"]} />}>
            <Route path="/caja" element={<CajaLayout />} />
          </Route>

          <Route element={<ProtectedRoute roles={["cocinero"]} />}>
            <Route path="/cocina" element={<CocinaLayout />} />
          </Route>

          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
