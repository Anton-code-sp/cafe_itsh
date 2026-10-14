const TOKEN_KEY = "cafe_token";
const USER_KEY = "cafe_user";

export interface SessionUser {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "Error del servidor");
  }

  return data as T;
}

export interface MenuItem {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  especial: boolean;
}

export interface MenuResponse {
  fecha: string;
  items: MenuItem[];
}

export interface Dish {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: boolean;
}

export interface DishInput {
  nombre: string;
  categoria?: string;
  descripcion?: string;
}

export interface DishChanges {
  nombre?: string;
  categoria?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface MenuDayRow {
  id: number;
  nombre: string;
  precio: string;
  disponible: boolean;
  especial: boolean;
  disponible_en_catalogo: boolean;
}

export interface MenuDayResponse {
  fecha: string;
  items: MenuDayRow[];
}

export interface PublishMenuDayInput {
  fecha: string;
  platilloId: number;
  precio: number | string;
  especial?: boolean;
}

export interface MenuDayChanges {
  precio?: number | string;
  disponible?: boolean;
  especial?: boolean;
}

export function getMenu(fecha?: string): Promise<MenuResponse> {
  return api<MenuResponse>(fecha ? `/menu?fecha=${encodeURIComponent(fecha)}` : "/menu");
}

export function getDishes(): Promise<{ dishes: Dish[] }> {
  return api<{ dishes: Dish[] }>("/dishes");
}

export function createDish(body: DishInput): Promise<Dish> {
  return api<Dish>("/dishes", { method: "POST", body });
}

export function updateDish(id: number, body: DishChanges): Promise<Dish> {
  return api<Dish>(`/dishes/${id}`, { method: "PATCH", body });
}

export function getMenuDay(fecha?: string): Promise<MenuDayResponse> {
  return api<MenuDayResponse>(
    fecha ? `/admin/menu-day?fecha=${encodeURIComponent(fecha)}` : "/admin/menu-day",
  );
}

export function publishMenuDay(body: PublishMenuDayInput): Promise<MenuDayRow> {
  return api<MenuDayRow>("/admin/menu-day", { method: "POST", body });
}

export function updateMenuDayRow(id: number, body: MenuDayChanges): Promise<MenuDayRow> {
  return api<MenuDayRow>(`/admin/menu-day/${id}`, { method: "PATCH", body });
}

export interface OrderItemInput {
  menuDiaId: number;
  cantidad: number;
}

export interface QuoteItem {
  menuDiaId: number;
  nombre: string;
  cantidad: number;
  precio: string;
  subtotal: string;
}

export interface Quote {
  items: QuoteItem[];
  total: string;
  canOrder: boolean;
  reason: string | null;
}

export interface CreatedOrder {
  order: {
    id: number;
    numero: string;
    estado: string;
    total: string;
    fechaRecoleccion: string | null;
  };
  payment: { reference: string; status: string };
}

export interface OrderDetail {
  id: number;
  numero: string;
  estado: string;
  total: string;
  items: Array<{ nombre: string; cantidad: number; precioUnitario: string; subtotal: string }>;
  pago: { referencia: string; monto: string; metodo: string; fecha: string } | null;
}

export function quoteOrder(items: OrderItemInput[]): Promise<Quote> {
  const qs = items.map((i) => `${i.menuDiaId}:${i.cantidad}`).join(",");
  return api<Quote>(`/orders/quote?items=${encodeURIComponent(qs)}`);
}

export function createOrder(items: OrderItemInput[]): Promise<CreatedOrder> {
  return api<CreatedOrder>("/orders", { method: "POST", body: { items } });
}

export function getOrder(id: number): Promise<OrderDetail> {
  return api<OrderDetail>(`/orders/${id}`);
}

export function cancelOrder(id: number): Promise<OrderDetail> {
  return api<OrderDetail>(`/orders/${id}/cancel`, { method: "POST" });
}

export function confirmPayment(orderId: number): Promise<{
  order: { id: number; numero: string; estado: string; total: string };
  pago: { referencia: string; monto: string };
}> {
  return api(`/payments/${orderId}/confirm`, { method: "POST" });
}

export interface CreatedCounterOrder {
  order: {
    id: number;
    numero: string;
    tipo: string;
    estado: string;
    total: string;
  };
  pago: { metodo: string; monto: string };
}

export interface RecentCounterOrder {
  id: number;
  numero: string;
  estado: string;
  total: string;
  creadoEn: string;
}

export function createCounterOrder(body: {
  clienteNombre?: string;
  items: OrderItemInput[];
  montoRecibido: string | number;
}): Promise<CreatedCounterOrder> {
  return api<CreatedCounterOrder>("/counter/orders", { method: "POST", body });
}

export function listRecentCounterOrders(): Promise<{ orders: RecentCounterOrder[] }> {
  return api<{ orders: RecentCounterOrder[] }>("/counter/orders/recent");
}

export function undoCounterOrder(id: number): Promise<{ order: { id: number; estado: string } }> {
  return api<{ order: { id: number; estado: string } }>(`/counter/orders/${id}/undo`, {
    method: "POST",
  });
}

export interface KitchenOrder {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  creadoEn: string;
  minutosEspera: number;
  items: Array<{ nombre: string; cantidad: number }>;
}

export function getKitchenQueue(): Promise<{ orders: KitchenOrder[] }> {
  return api<{ orders: KitchenOrder[] }>("/kitchen/orders");
}

export function startOrder(id: number): Promise<{ order: { id: number; estado: string } }> {
  return api<{ order: { id: number; estado: string } }>(`/kitchen/orders/${id}/start`, {
    method: "POST",
  });
}

export function readyOrder(id: number): Promise<{ order: { id: number; estado: string } }> {
  return api<{ order: { id: number; estado: string } }>(`/kitchen/orders/${id}/ready`, {
    method: "POST",
  });
}

export interface MyOrderSummary {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: string;
  creadoEn: string;
  fechaRecoleccion: string | null;
}

export function getMyOrders(): Promise<{ orders: MyOrderSummary[] }> {
  return api<{ orders: MyOrderSummary[] }>("/my-orders");
}

export interface MyOrderDetail {
  order: {
    id: number;
    numero: string;
    tipo: string;
    estado: string;
    total: string;
  };
  items: Array<{ nombre: string; cantidad: number; subtotal: string }>;
  historial: Array<{ estado: string; en: string }>;
}

export function getMyOrder(id: number): Promise<MyOrderDetail> {
  return api<MyOrderDetail>(`/my-orders/${id}`);
}

export interface OrderNotification {
  canal: string;
  asunto: string | null;
  estadoEnvio: string;
  creadoEn: string;
}

export function getOrderNotifications(
  id: number,
): Promise<{ notifications: OrderNotification[] }> {
  return api<{ notifications: OrderNotification[] }>(`/my-orders/${id}/notifications`);
}

export interface SalesReport {
  rango: { desde: string; hasta: string };
  resumen: { pedidos: number; monto: string };
  porEstado: Array<{ estado: string; pedidos: number; monto: string }>;
  porTipo: Array<{ tipo: string; pedidos: number; monto: string }>;
}

export function getSalesReport(desde: string, hasta: string): Promise<SalesReport> {
  return api<SalesReport>(
    `/admin/reports/sales?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
  );
}
