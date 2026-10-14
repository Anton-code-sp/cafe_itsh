import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/login/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminHomePage } from "./pages/admin/AdminHomePage";
import { UsersPage } from "./pages/admin/UsersPage";
import { DishesPage } from "./pages/admin/dishes/DishesPage";
import { MenuDayPage } from "./pages/admin/menu/MenuDayPage";
import { ReportsPage } from "./pages/admin/reports/ReportsPage";
import { CajaLayout } from "./pages/caja/CajaLayout";
import { CajaPage } from "./pages/caja/CajaPage";
import { CocinaLayout } from "./pages/cocina/CocinaLayout";
import { KitchenPage } from "./pages/cocina/KitchenPage";
import { MenuLayout } from "./pages/clientes/MenuLayout";
import { MenuPage } from "./pages/clientes/menu/MenuPage";
import { CartPage } from "./pages/clientes/cart/CartPage";
import { PaymentPage } from "./pages/clientes/checkout/PaymentPage";
import { OrderConfirmPage } from "./pages/clientes/orders/OrderConfirmPage";
import { MyOrdersPage } from "./pages/clientes/orders/MyOrdersPage";
import { MyOrderDetailPage } from "./pages/clientes/orders/MyOrderDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/menu" element={<MenuLayout />}>
              <Route index element={<MenuPage />} />
            </Route>
            <Route path="/cart" element={<MenuLayout />}>
              <Route index element={<CartPage />} />
            </Route>
            <Route path="/checkout" element={<MenuLayout />}>
              <Route index element={<PaymentPage />} />
            </Route>
            <Route path="/orders/:id" element={<MenuLayout />}>
              <Route index element={<OrderConfirmPage />} />
            </Route>
            <Route path="/mis-pedidos" element={<MenuLayout />}>
              <Route index element={<MyOrdersPage />} />
            </Route>
            <Route path="/mis-pedidos/:id" element={<MenuLayout />}>
              <Route index element={<MyOrderDetailPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["administrador"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="platillos" element={<DishesPage />} />
              <Route path="menu-dia" element={<MenuDayPage />} />
              <Route path="reportes" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["cajero"]} />}>
            <Route path="/caja" element={<CajaLayout />}>
              <Route index element={<CajaPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["cocinero"]} />}>
            <Route path="/cocina" element={<CocinaLayout />}>
              <Route index element={<KitchenPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
