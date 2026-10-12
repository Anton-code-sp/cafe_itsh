import { createContext, useContext } from "react";

export interface CartItem {
  menuDiaId: number;
  nombre: string;
  /** Precio unitario como string con 2 decimales (formato del servidor). */
  precio: string;
  cantidad: number;
}

export interface CartContextValue {
  items: CartItem[];
  /** Unidades totales (para el contador del nav). */
  count: number;
  /** Total estimado en centavos; el servidor es la autoridad al confirmar. */
  totalCents: number;
  setQuantity: (
    item: { menuDiaId: number; nombre: string; precio: string },
    cantidad: number,
  ) => void;
  removeItem: (menuDiaId: number) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return ctx;
}
