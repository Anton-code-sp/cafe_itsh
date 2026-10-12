<!--
Sync Impact Report
==================
- Version change: 1.0.0 → 1.1.0 → 1.1.1
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. Alcance estricto del MVP (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Seguridad de la información (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Simplicidad y mantenibilidad
  - [PRINCIPLE_4_NAME] → IV. Rapidez operativa en receso
  - [PRINCIPLE_5_NAME] → V. Calidad verificable
- Added sections:
  - Restricciones Técnicas (antes [SECTION_2_NAME])
  - Flujo de Desarrollo (antes [SECTION_3_NAME])
  - Governance (antes [GOVERNANCE_RULES])
- Modified sections (v1.1.0):
  - Restricciones Técnicas → Frontend: app web única con rutas protegidas
    por rol, React con TypeScript compilado con Vite, framework de diseño
    Tailwind CSS + shadcn/ui, diseños de Stitch (.stitch/DESIGN.md) como
    base de referencia modificable.
- Modified sections (v1.1.1):
  - Restricciones Técnicas → Frontend: clarificación de la ruta `/login`
    (acceso/registro) en la lista de rutas por rol. Nueva spec de sprint
    002-foundation-auth.
- Removed sections: ninguna
- TODOs / deferred items: ninguno; todos los placeholders del template fueron
  sustituidos. Fuente autoritativa: docs/reglas.md (v1, 30 reglas).
-->

# Sistema de Pedidos Anticipados — Cafetería ITSH Constitution

Constitución del proyecto de pedidos anticipados para la cafetería del Instituto
Tecnológico Superior de Huauchinango (ITSH). Esta constitución es la autoridad
máxima de gobernanza; `docs/reglas.md` es la guía de referencia detallada y
complementaria.

## Core Principles

### I. Alcance estricto del MVP (NON-NEGOTIABLE)

- Todo entregable MUST estar dentro del alcance del MVP: usuarios y roles,
  menú, platillos, consulta de menú, pedidos anticipados, pedidos de mostrador,
  pago anticipado, cocina, estados de pedido y notificación de pedido listo.
- Cualquier funcionalidad fuera de alcance MUST obtener aprobación previa
  antes de iniciar su implementación.
- Las restricciones del proyecto (no interrumpir el servicio de mostrador,
  conectividad limitada del plantel, personal con capacitación limitada,
  presupuesto del MVP) MUST considerarse en cada decisión de diseño.

Rationale: el proyecto es académico, con patrocinadora, presupuesto y fecha de
demostración fijos; el alcance descontrolado compromete la aceptación final.

### II. Seguridad de la información (NON-NEGOTIABLE)

- Las contraseñas MUST almacenarse cifradas; MUST NUNCA guardarse en texto plano.
- Las credenciales, tokens y claves secretas (incluidos `DATABASE_URL`,
  `JWT_SECRET`, `PAYMENT_API_KEY`, `NOTIFICATION_API_KEY`) MUST vivir en
  variables de entorno y MUST NUNCA escribirse en el código fuente ni en Git.
- La información sensible de tarjetas bancarias MUST NUNCA almacenarse; sólo se
  conserva la información mínima para identificar y validar una transacción.
- Toda autenticación MUST usar correo y contraseña con JWT; toda autorización
  MUST basarse en roles, y cada usuario MUST acceder únicamente a las
  funciones de su rol.
- Los datos recibidos MUST validarse y sanitizarse en frontend y backend antes
  de persistirse; el backend MUST NUNCA confiar sólo en validaciones del cliente.
- Producción MUST servirse por HTTPS.

Rationale: el sistema maneña pagos, credenciales y datos de usuarios de un
plantel educativo; una brecha invalidaría el proyecto.

### III. Simplicidad y mantenibilidad

- TypeScript estricto MUST usarse como lenguaje principal; el JavaScript sin
  tipado MUST evitarse en la lógica del sistema.
- La arquitectura MUST mantenerse simple: estructura `frontend/`, `backend/`,
  `database/`, `tests/` y, dentro del backend, `routes/`, `controllers/`,
  `services/`, `middlewares/`, `utils/`. NO se permiten capas innecesarias.
- NO se agregarán dependencias innecesarias: antes de incorporar una librería
  MUST verificarse si la necesidad se resuelve con lo ya existente.
- NO se usarán ORMs innecesarios; el acceso a PostgreSQL será mediante una
  librería de acceso a datos adecuada.
- El código MUST usar `camelCase` (variables y funciones) y `PascalCase`
  (componentes, tipos, interfaces), nombres descriptivos, funciones pequeñas
  reutilizables y sin duplicación.

Rationale: el tamaño del sistema no justifica complejidad; la simplicidad
reduce el costo de mantenimiento con personal disponible limitado.

### IV. Rapidez operativa en receso

- Las pantallas de cajero y cocinero MUST minimizar la cantidad de pasos por
  operación y MUST priorizar la rapidez sobre elementos visuales innecesarios.
- El sistema MUST responder adecuadamente en horarios de mayor demanda y MUST
  operar simultáneamente pedidos anticipados y de mostrador sin retrasos.
- Los pedidos anticipados MUST aceptarse con al menos **10 minutos de
  anticipación**; el 100 % de ellos MUST poder realizarse dentro de esa ventana.
- El objetivo de producto es reducir al menos **50 % el tiempo de espera en
  caja durante los recesos**; cada decisión de interfaz y de rendimiento MUST
  evaluarse contra ese objetivo.
- La interfaz MUST ser responsiva (móvil y escritorio), con navegación
  sencilla y estados de pedido claros.

Rationale: el valor del sistema se mide en recesos de pocos minutos; una
interfaz lenta o confusa anula el beneficio del pedido anticipado.

### V. Calidad verificable

- **Vitest** MUST usarse para las pruebas unitarias; toda lógica de negocio
  importante MUST contar con pruebas.
- Como mínimo MUST probarse: autenticación, autorización, gestión de usuarios,
  gestión de menú, creación y validación de pedidos, cálculo de totales,
  cambios de estado y control de permisos por rol.
- Las funcionalidades críticas (pagos, estados de pedido, permisos) MUST tener
  pruebas antes de considerarse completas; no se fija cobertura mínima
  obligatoria.
- Los errores MUST mostrarse como mensajes claros con códigos HTTP apropiados;
  los stack traces y la información interna del servidor MUST NUNCA exponerse
  al usuario, y el registro de errores MUST evitar datos sensibles.

Rationale: sin pruebas sobre la lógica de pedidos y permisos, los cambios
posteriores rompen el flujo principal sin detectarse.

## Restricciones Técnicas

Stack fijado por la constitución (cambios sujetos a enmienda):

- **Runtime**: Node.js LTS + Express para el backend.
- **Frontend**: React con TypeScript compilado con **Vite**; UNA SOLA
  aplicación web con rutas protegidas por JWT y rol (`/login`, `/admin`,
  `/caja`, `/cocina`, `/menu`, `/mis-pedidos`); framework de diseño **Tailwind CSS +
  shadcn/ui**; los diseños de Stitch (`.stitch/DESIGN.md`) son una base de
  referencia modificable, no definitiva; responsivo (móvil y escritorio).
- **Base de datos**: PostgreSQL; entidades mínimas: usuarios, roles, platillos,
  menú, pedidos, detalles de pedidos, pagos y estados de pedidos, con
  relaciones que garanticen integridad.
- **API**: exclusivamente REST; `GET` consulta, `POST` creación, `PUT`/`PATCH`
  modificación, `DELETE` eliminación cuando corresponda; códigos HTTP
  apropiados en toda respuesta.
- **Autenticación**: JWT con correo/contraseña y autorización por roles
  (Administrador, Cajero, Cocinero, Alumno/Docente).
- **Pagos**: servicio de pago en línea integrado al flujo del pedido; sin
  almacenamiento de datos sensibles de tarjeta.
- **Notificaciones**: funcionalidad MUST mantenerse separada de la lógica
  principal de pedidos; podrá usar un servicio externo.
- **Variables de entorno mínimas**: `DATABASE_URL`, `JWT_SECRET`,
  `PAYMENT_API_KEY`, `NOTIFICATION_API_KEY`, `NODE_ENV`, `PORT`.
- **Despliegue**: ejecución local en desarrollo; MVP desplegable en hosting
  gratuito o de bajo costo, con configuraciones de desarrollo y producción
  separadas.

## Flujo de Desarrollo

- **Control de versiones**: Git con repositorio remoto; commits pequeños y
  descriptivos; `.env` y credenciales MUST NUNCA commitarse.
- **Validación**: datos validados en frontend y backend antes de persistir;
  los datos inválidos MUST detenerse antes de la lógica de negocio.
- **Estados de pedido**: `Pendiente` → `Pagado` → `En preparación` → `Listo`
  → `Entregado`, más `Cancelado`; cada pedido MUST exponer su estado en todo
  momento, y cocina MUST poder transicionarlo.
- **Pedidos de mostrador**: el flujo de mostrador MUST seguir operando sin
  interrupciones; el cajero MUST poder capturar pedidos y cobrar localmente.
- **Pruebas**: ejecutar las pruebas de Vitest antes de dar por completa
  cualquier historia; las funcionalidades críticas sin pruebas se consideran
  incompletas.
- **Dependencias**: compatibles con Node.js LTS; NO duplicar funcionalidades ya
  existentes en el proyecto.
- **Aceptación**: el sistema es funcional cuando el flujo completo
  (menú → selección → pedido → pago → cocina → preparación → listo →
  notificación → recogida) se demostró; la aceptación final requiere
  demostración funcional validada por la patrocinadora.

## Governance

- Esta constitución tiene prioridad sobre cualquier práctica, archivo o decisión
  de implementación del repositorio. En conflicto, la constitución gana y
  `docs/reglas.md` aporta el detalle operativo.
- **Procedimiento de enmienda**: toda modificación MUST editarse en
  `.specify/memory/constitution.md`, incrementar la versión según semántica
  (MAJOR: eliminación o redefinición incompatible de principios; MINOR: nueva
  sección o expansión material; PATCH: clarificaciones y correcciones), y
  registrarse en el reporte "Sync Impact Report" al inicio del archivo.
- **Fechas**: `RATIFICATION_DATE` es la fecha de adopción original y no cambia;
  `LAST_AMENDED_DATE` MUST actualizarse a la fecha ISO (YYYY-MM-DD) de cada
  enmienda.
- **Revisión de cumplimiento**: cada PR o revisión de código MUST verificar el
  cumplimiento de los principios I–V y de las Restricciones Técnicas; la
  complejidad agregada MUST justificarse explícitamente o rechazarse.
- Cualquier desviación de alcance MUST obtener aprobación previa documentada
  antes de implementarse.

**Version**: 1.1.1 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-11
