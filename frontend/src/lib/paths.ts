export function homePathForRol(rol: string): string {
  switch (rol) {
    case "administrador":
      return "/admin";
    case "cajero":
      return "/caja";
    case "cocinero":
      return "/cocina";
    default:
      return "/menu";
  }
}
