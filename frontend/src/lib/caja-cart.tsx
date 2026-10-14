import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CajaCartContext, type CajaCartContextValue, type CajaCartLine } from "./caja-cart-context";
import { sumCents, toCents } from "./money";

/**
 * Carrito del cajero: vive en el árbol de `CajaLayout` para compartirse
 * entre Capturar (`/caja/capturar`) y Cobro (`/caja/cobro`) sin persistencia
 * (el pedido se registra en el mismo turno).
 */
export function CajaCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CajaCartLine[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");

  const addLine = useCallback(
    (item: { menuDiaId: number; nombre: string; precio: string }) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.menuDiaId === item.menuDiaId);
        if (existing) {
          return prev.map((l) =>
            l.menuDiaId === item.menuDiaId ? { ...l, cantidad: Math.min(99, l.cantidad + 1) } : l,
          );
        }
        return [...prev, { ...item, cantidad: 1 }];
      });
    },
    [],
  );

  const setQuantity = useCallback((menuDiaId: number, cantidad: number) => {
    setLines((prev) =>
      cantidad <= 0
        ? prev.filter((l) => l.menuDiaId !== menuDiaId)
        : prev.map((l) => (l.menuDiaId === menuDiaId ? { ...l, cantidad } : l)),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setClienteNombre("");
    setMontoRecibido("");
  }, []);

  const value = useMemo<CajaCartContextValue>(() => {
    const totalCents = sumCents(lines.map((l) => toCents(l.precio) * l.cantidad));
    const count = lines.reduce((acc, l) => acc + l.cantidad, 0);
    return {
      lines,
      clienteNombre,
      montoRecibido,
      totalCents,
      count,
      addLine,
      setQuantity,
      setClienteNombre,
      setMontoRecibido,
      clear,
    };
  }, [lines, clienteNombre, montoRecibido, addLine, setQuantity, clear]);

  return <CajaCartContext.Provider value={value}>{children}</CajaCartContext.Provider>;
}
