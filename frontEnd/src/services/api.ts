import axios, { type AxiosInstance } from 'axios';

export interface FileRecord {
  id: string;
  ownerId: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      // Use a relative URL so the Vite dev server proxy (configured in vite.config.ts)
      // can forward requests to the backend during development and avoid CORS.
      baseURL: import.meta.env.VITE_API_URL || '',
      withCredentials: false,
    });

    // Request interceptor to add Authorization header when token is set
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // Auth endpoints
  async register(username: string, password: string): Promise<{ id: string; username: string; token: string }> {
    const response = await this.client.post('/auth/register', { username, password });
    return response.data;
  }

  async login(username: string, password: string): Promise<{ token: string }> {
    const response = await this.client.post('/auth/login', { username, password });
    return response.data;
  }

  // List all files for authenticated user
  async listFiles(): Promise<FileRecord[]> {
    const response = await this.client.get<FileRecord[]>('/files');
    return response.data;
  }

  // Upload a file with progress tracking
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<FileRecord>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
        }
      },
    });

    return response.data;
  }

  // Download a file
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    const response = await this.client.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Delete a file
  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(`/files/${fileId}`);
  }

  // Get file preview (for images)
  async getFilePreviewUrl(fileId: string): Promise<string> {
    // For images, we can construct a download URL
    // This returns a blob URL that can be used in img src
    const response = await this.client.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return window.URL.createObjectURL(response.data);
  }
}

export const api = new ApiService();
