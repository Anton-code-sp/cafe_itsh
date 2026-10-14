import { createContext, useContext } from "react";

export interface CajaCartLine {
  menuDiaId: number;
  nombre: string;
  precio: string;
  cantidad: number;
}

export interface CajaCartContextValue {
  lines: CajaCartLine[];
  clienteNombre: string;
  montoRecibido: string;
  totalCents: number;
  count: number;
  addLine: (item: { menuDiaId: number; nombre: string; precio: string }) => void;
  setQuantity: (menuDiaId: number, cantidad: number) => void;
  setClienteNombre: (value: string) => void;
  setMontoRecibido: (value: string) => void;
  clear: () => void;
}

export const CajaCartContext = createContext<CajaCartContextValue | null>(null);

export function useCajaCart(): CajaCartContextValue {
  const ctx = useContext(CajaCartContext);
  if (!ctx) {
    throw new Error("useCajaCart debe usarse dentro de CajaCartProvider");
  }
  return ctx;
}
