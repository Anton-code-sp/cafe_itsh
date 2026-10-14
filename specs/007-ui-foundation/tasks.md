---

description: "Task list — Base de Diseño UI (007)"
---

# Tasks: Base de Diseño UI

**Input**: Design documents from `/specs/007-ui-foundation/`

**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: sin tests unitarios nuevos (feature de presentación); verificación
con `typecheck` + `build` + `lint` y grep de clases migradas.

**Organization**: Setup → Tokens → Componentes → Migración → Polish.

## Phase 1: Setup

- [x] T001 [P] Confirmar en `frontend/src/**` el inventario exacto de clases
  `amber-*`, `stone-*` (fondo/acción) y badges `red-100/green-100/amber-100`
  antes de migrar (base del grep final de SC-002)

---

## Phase 2: Tokens y tipografía (Fundational — bloquea todo)

**⚠️ CRITICAL**: sin tokens no hay migración ni componentes personalizados

- [x] T002 Escribir el bloque `@theme` en `frontend/src/index.css` con
  colores (primary, espresso, superficies crema, outline, error, `status-*`),
  fuentes (`--font-display` Plus Jakarta Sans, `--font-sans` Inter), radios y
  espaciado de `.stitch/DESIGN.md`; cuerpo con fondo crema y texto charcoal
- [x] T003 [P] Cargar Plus Jakarta Sans (700/800) e Inter (400/500/600) con
  `preconnect` en `frontend/index.html`

**Checkpoint**: tokens y fuentes activos

---

## Phase 3: Componentes base shadcn/ui

- [x] T004 Instalar dependencias de shadcn/ui en `frontend/` (clsx,
  tailwind-merge, class-variance-authority, lucide-react, Radix para dialog)
  e inicializar configuración (`components.json` / util `cn` en
  `frontend/src/lib/utils.ts`)
- [x] T005 Crear `frontend/src/components/ui/button.tsx` (variantes
  primary/secondary/outline/ghost/danger, altura ≥44 px) con tokens
- [x] T006 [P] Crear `frontend/src/components/ui/card.tsx` (blanco, borde
  outline-variant, sombra sutil)
- [x] T007 Crear `frontend/src/components/ui/input.tsx` +
  `label.tsx` (etiqueta visible arriba, foco verde 2 px, error en línea) y
  `frontend/src/components/ui/badge.tsx` (pill)
- [x] T008 [P] Crear `frontend/src/components/ui/dialog.tsx` (Radix) con
  estética DESIGN.md
- [x] T009 Crear `frontend/src/components/StatusBadge.tsx` que mapea los 6
  estados de pedido a `status-*` con texto blanco (FR-004)

**Checkpoint**: `components/ui/` completo y compilable

---

## Phase 4: Migración de pantallas existentes

- [x] T010 Migrar login/registro (`pages/login/LoginPage.tsx`,
  `RegisterForm.tsx`): botones → `Button` primary, foco verde, errores →
  token error, títulos `font-display`
- [x] T011 Migrar layouts (`MenuLayout`, `AdminLayout`, `CajaLayout`,
  `CocinaLayout`): headers a espresso token; nav activo en verde
- [x] T012 Migrar admin (`UsersPage`, `DishesPage`, `MenuDayPage` +
  dialogs `UserFormDialog`, `DishFormDialog`, `PublishDishDialog`): botones,
  inputs, tablas (números a la derecha peso 700)
- [x] T013 Migrar clientes (`MenuPage`, `DishCard`, `CartPage`,
  `PaymentPage`, `OrderConfirmPage`): CTA verde, badges → `StatusBadge`,
  tarjetas → `Card`, precios peso 700
- [x] T014 [P] Revisar placeholders (`App.tsx`, `CajaLayout`, `CocinaLayout`,
  `MenuPage`, `CartPage`) — solo estética base con tokens

**Checkpoint**: pantallas usan tokens y componentes (SC-003)

---

## Phase 5: Polish & Cross-Cutting

- [x] T015 [P] `npm run typecheck`, `npm run build` y `npm run lint` en
  `frontend/` en verde (SC-001)
- [x] T016 Grep de SC-002: cero `bg-amber-*` como acción/CTA, cero
  `bg-stone-50` de fondo, cero badges de estado suaves en `frontend/src`
- [ ] T017 Smoke visual: `npm run dev` y revisar `/login`, `/menu`, `/admin`,
  `/cart`, `/checkout`, `/orders/:id` (fondo crema, verde en acciones,
  tipografía)
- [x] T018 Actualizar `docs/sprints.md`: nota de base de diseño completada
  (pulido adelantado del Sprint 5) y mención en Sprint 4

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5**
- T003 paralelo con T002; T006/T008 paralelos entre sí

## Implementation Strategy

1. Tokens + fuentes (T002–T003) → componentes (T004–T009) → migración por
   pantalla (T010–T014) → verificación (T015–T018)
2. Commits pequeños: tokens, componentes, migración por grupo de pantallas

## Notes

- shadcn/ui se copia al repo (reglas §2); el CLI solo genera archivos, no
  dependencia runtime
- El verde `#1E7A46` nunca como fondo grande (DESIGN.md); headers en espresso
- Tras esto, arrancar `specs/005-counter-kitchen/` con los tokens desde T001
