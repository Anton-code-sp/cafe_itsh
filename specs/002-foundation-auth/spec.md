# Feature Specification: Fundamentos y Autenticación

**Feature Branch**: `002-foundation-auth`

**Created**: 2026-10-11

**Status**: Draft

**Input**: Sprint 1 de `docs/sprints.md`; derivada de la spec maestra
`specs/001-advance-order-system/spec.md` (US6 + infraestructura).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar sesión y acceder según el rol (Priority: P1)

Como usuario del sistema (administrador, cajero, cocinero, alumno o docente),
quiero iniciar sesión con mi correo y contraseña para acceder únicamente al
módulo que me corresponde.

**Why this priority**: Es la puerta de entrada de todo el sistema; sin
autenticación y control por rol no hay seguridad ni operación posible.

**Independent Test**: Puede probarse completamente creando cuentas de cada rol,
iniciando sesión con cada una y verificando que cada rol llega a su ruta y no
puede abrir las rutas de los demás.

**Acceptance Scenarios**:

1. **Given** un usuario con credenciales válidas, **When** inicia sesión,
   **Then** es redirigido a la ruta de su rol (`/admin`, `/caja`, `/cocina` o
   `/menu`).
2. **Given** credenciales inválidas, **When** se intenta iniciar sesión,
   **Then** se muestra un mensaje claro que no revela si la cuenta existe.
3. **Given** un usuario sin sesión, **When** intenta abrir una ruta protegida,
   **Then** es redirigido a `/login`.
4. **Given** un usuario autenticado como Cocinero, **When** intenta abrir
   `/caja` o `/admin`, **Then** el acceso le es denegado.

---

### User Story 2 - Registrarse como alumno o docente (Priority: P2)

Como alumno o docente, quiero registrarme con mi correo institucional y una
contraseña para tener cuenta propia y realizar pedidos.

**Why this priority**: Habilita el registro de clientes sin intervención del
personal; los usuarios operativos se crean por seed/admin, no por registro
libre.

**Independent Test**: Puede probarse registrando un correo institucional,
iniciando sesión con la nueva cuenta y verificando que accede a `/menu`.

**Acceptance Scenarios**:

1. **Given** un correo institucional no registrado, **When** se completa el
   registro, **Then** la cuenta queda creada con rol Alumno/Docente y puede
   iniciar sesión.
2. **Given** un correo ya registrado, **When** se intenta registrarlo otra vez,
   **Then** el sistema lo rechaza con un mensaje claro.
3. **Given** datos de registro incompletos o inválidos (correo inválido,
   contraseña corta), **When** se envía el formulario, **Then** el sistema
   muestra errores en línea y no crea la cuenta.
4. **Given** un correo no institucional, **When** se intenta registrarlo,
   **Then** el sistema lo rechaza según la política de correos institucionales.

---

### User Story 3 - Cuentas operativas iniciales (Priority: P3)

Como administrador del sistema, quiero que al arrancar existan cuentas
operativas iniciales (admin, cajero, cocinero) para poder operar el sistema
desde el primer día.

**Why this priority**: Condición habilitadora de operación y demo; la gestión
completa de usuarios es la US6 de la spec maestra y queda para el sprint de
gestión de usuarios.

**Independent Test**: Puede probarse verificando que el proceso de arranque crea
las cuentas precargadas y que cada una inicia sesión con su rol.

**Acceptance Scenarios**:

1. **Given** una base de datos vacía, **When** se ejecuta la carga inicial,
   **Then** existen cuentas de administrador, cajero y cocinero.
2. **Given** las cuentas precargadas, **When** se reinicia el sistema,
   **Then** no se duplican.

---

### User Story 4 - Gestionar usuarios operativos (Priority: P3)

Como administrador, quiero crear y gestionar a los usuarios operativos
(cajeros y cocineros) y asignarles roles, para que cada persona acceda
únicamente a las funciones que le corresponden.

**Why this priority**: Es la US6 de la spec maestra; condición habilitadora de
seguridad y operación. Puede posponerse con cuentas precargadas mientras tanto.

**Independent Test**: Puede probarse creando un cajero y un cocinero,
iniciando sesión con cada uno y verificando que cada rol accede sólo a sus
funciones.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado en `/admin`, **When** crea un
   usuario operativo con un rol, **Then** el usuario puede iniciar sesión y
   accede sólo a las funciones de ese rol.
2. **Given** un usuario con rol Cocinero, **When** intenta acceder a funciones
   de cajero o administrador, **Then** el acceso le es denegado.
3. **Given** datos inválidos al crear un usuario (correo duplicado o inválido,
   contraseña corta), **When** se envía el formulario, **Then** el sistema
   muestra errores claros y no crea el usuario.
4. **Given** un usuario intenta gestionar usuarios sin rol Administrador,
   **When** llama a la operación, **Then** el sistema responde denegado.

---

### Edge Cases

- Intento de login con la cuenta bloqueada por intentos fallidos: el sistema
  MUST informar sin revelar detalles internos (MVP: mensaje genérico).
- Registro con correo que no pertenece al plantel: MUST rechazarse.
- Token expirado o inválido: el sistema MUST responder 401 y redirigir a
  `/login`.
- Acceso directo a una URL protegida con sesión de otro rol: MUST denegarse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST disponer de un framework de migraciones y MUST
  crear las tablas iniciales `usuarios` y `roles` en PostgreSQL.
- **FR-002**: El sistema MUST permitir registro e inicio de sesión con correo
  electrónico y contraseña (spec maestra FR-001).
- **FR-003**: El sistema MUST asignar a cada usuario un rol: Administrador,
  Cajero, Cocinero o Alumno/Docente (spec maestra FR-002).
- **FR-004**: Las contraseñas MUST almacenarse cifradas (bcrypt) y MUST NUNCA
  guardarse en texto plano.
- **FR-005**: La sesión MUST gestionarse con JWT; cada ruta del frontend MUST
  estar protegida por sesión y rol.
- **FR-006**: El registro libre MUST estar disponible solo para el rol
  Alumno/Docente; los usuarios operativos MUST crearse por carga inicial o por
  el administrador.
- **FR-007**: El sistema MUST crear en la carga inicial las cuentas
  operativas de administrador, cajero y cocinero, sin duplicarlas en reinicios.
- **FR-008**: El frontend MUST ser una sola aplicación web (React + TypeScript
  + Vite, Tailwind + shadcn/ui) con las rutas `/login`, `/admin`, `/caja`,
  `/cocina`, `/menu`, `/mis-pedidos` (spec maestra FR-031 y reglas §2).
- **FR-009**: El administrador MUST poder crear, editar y deshabilitar
  usuarios operativos (cajeros y cocineros) con su rol, y estas operaciones
  MUST estar restringidas al rol Administrador (spec maestra US6 y FR-002).

### Key Entities

- **Usuario**: persona con cuenta (correo, contraseña cifrada) y un rol
  asignado.
- **Rol**: conjunto de funciones accesibles; determina los permisos y la ruta
  de entrada del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario de cada rol puede iniciar sesión y llegar a su
  módulo en menos de 30 segundos.
- **SC-002**: El 100 % de las rutas protegidas deniega el acceso sin sesión o
  con rol incorrecto.
- **SC-003**: Ningún error de login revela si la cuenta existe.
- **SC-004**: `npm test` y `npm run typecheck` en verde en backend y frontend.

## Assumptions

- Hereda las suposiciones de la spec maestra 001 (correos institucionales,
  JWT, PostgreSQL, hosting de bajo costo).
- El schema inicial solo incluye `usuarios` y `roles`; el resto de tablas se
  crea en los sprints posteriores.
- La política de correos institucionales se valida por dominio configurable en
  variables de entorno.
- El frontend ya cuenta con el scaffold Vite + Tailwind + shadcn/ui; este
  sprint agrega router, auth y layouts por rol.
