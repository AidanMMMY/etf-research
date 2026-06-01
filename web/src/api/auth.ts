import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
}

export const authApi = {
  login: (data: LoginRequest) => client.post<LoginResponse>('/auth/login', data),
  me: () => client.get<{ username: string; role: string }>('/auth/me'),
};
