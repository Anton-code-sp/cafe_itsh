import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toCents, sumCents } from "./money";
import { CartContext, type CartContextValue, type CartItem } from "./cart-context";

const STORAGE_KEY = "cafe-cart-v1";

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).menuDiaId === "number" &&
        typeof (i as CartItem).nombre === "string" &&
        typeof (i as CartItem).precio === "string" &&
        typeof (i as CartItem).cantidad === "number" &&
        (i as CartItem).cantidad > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadItems);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((item, cantidad) => {
    setItems((prev) => {
      if (cantidad <= 0) {
        return prev.filter((i) => i.menuDiaId !== item.menuDiaId);
      }
      const existing = prev.find((i) => i.menuDiaId === item.menuDiaId);
      if (existing) {
        return prev.map((i) =>
          i.menuDiaId === item.menuDiaId
            ? { ...i, cantidad, nombre: item.nombre, precio: item.precio }
            : i,
        );
      }
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const removeItem = useCallback((menuDiaId: number) => {
    setItems((prev) => prev.filter((i) => i.menuDiaId !== menuDiaId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.cantidad, 0);
    const totalCents = sumCents(items.map((i) => toCents(i.precio) * i.cantidad));
    return { items, count, totalCents, setQuantity, removeItem, clear };
  }, [items, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
