export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (msg: string) => new ApiError(400, msg);
export const unauthorized = (msg = "Credenciales inválidas") => new ApiError(401, msg);
export const forbidden = (msg = "No tienes permiso para esta operación") => new ApiError(403, msg);
export const notFound = (msg = "No encontrado") => new ApiError(404, msg);
export const conflict = (msg: string) => new ApiError(409, msg);
