import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://colegiorp-b.jumproyect.me';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(accessToken, newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  rol: string;
  nombres?: string;
  apellidos?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  user: UserInfo;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ConfiguracionSiagieDto {
  id?: string;
  institucionEducativa: string;
  codigoModularAnexo: string;
  nivel: string;
  nombreReporte: string;
  anioAcademico: number;
  disenoModular?: string;
  periodo?: string;
  grado?: string;
  seccion?: string;
  areasCursos?: string;
}

export interface SiagieExportRequest {
  anioEscolarId: string;
  bimestreId: string;
  cursoIds?: string[];
  gradoId?: string;
  seccionId?: string;
  tipo: string;
}

export interface SiagieExportResponse {
  exportacionId: string;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
}

export interface ExportacionSiagieDto {
  id: string;
  tipo: string;
  periodo: string;
  archivoUrl: string;
  usuarioId: string;
  usuarioUsername: string;
  fecha: string;
}

export interface CursoDto {
  id: string;
  nombre: string;
  nivel: string;
}

export interface GradoDto {
  id: string;
  nombre: string;
  nivel: string;
}

export interface SeccionDto {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre?: string;
}

export interface AnioEscolarDto {
  id: string;
  anio: number;
  activo: boolean;
}

export interface BimestreDto {
  id: string;
  numero: number;
  anioEscolarId: string;
  anio?: number;
  cerrado: boolean;
}

export interface SiagieFiltrosResponse {
  anios: AnioEscolarDto[];
  bimestres: BimestreDto[];
  grados: GradoDto[];
  secciones: SeccionDto[];
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/api/auth/logout', { refreshToken });
  },

  me: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>('/api/auth/me');
    return response.data;
  },
};

export const siagieApi = {
  getConfiguracion: async (): Promise<ConfiguracionSiagieDto> => {
    const response = await api.get<ConfiguracionSiagieDto>('/api/siagie/configuracion');
    return response.data;
  },

  upsertConfiguracion: async (payload: ConfiguracionSiagieDto): Promise<ConfiguracionSiagieDto> => {
    const response = await api.put<ConfiguracionSiagieDto>('/api/siagie/configuracion', payload);
    return response.data;
  },

  exportar: async (payload: SiagieExportRequest): Promise<SiagieExportResponse> => {
    const response = await api.post<SiagieExportResponse>('/api/siagie/exportar', payload);
    return response.data;
  },

  listExportaciones: async (page = 0, size = 20): Promise<PageResponse<ExportacionSiagieDto>> => {
    const response = await api.get<PageResponse<ExportacionSiagieDto>>(`/api/siagie/exportaciones?page=${page}&size=${size}`);
    return response.data;
  },

  cursosDisponibles: async (): Promise<CursoDto[]> => {
    const response = await api.get<CursoDto[]>('/api/siagie/cursos-disponibles');
    return response.data;
  },

  filtros: async (): Promise<SiagieFiltrosResponse> => {
    const response = await api.get<SiagieFiltrosResponse>('/api/siagie/filtros');
    return response.data;
  },

  descargarExportacion: async (id: string, fileName?: string): Promise<void> => {
    const response = await api.get(`/api/siagie/exportaciones/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `siagie_${id}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
