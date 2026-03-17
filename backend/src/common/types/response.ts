export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: string[] | null;
}

export function successResponse<T>(data: T, message: string | null = null): ApiResponse<T> {
  return { success: true, data, message, errors: null };
}

export function errorResponse(message: string, errors: string[] | null = null): ApiResponse<null> {
  return { success: false, data: null, message, errors };
}