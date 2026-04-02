import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY } from '../app.constants';
import { AuthUser } from '../measurement-data';

type LoginResponse = { token: string };
type JwtPayload = {
  sub?: string;
  role?: string;
  exp?: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userState = signal<AuthUser | null>(this.readStoredUser());

  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly isAdmin = computed(() => this.userState()?.role === 'ROLE_ADMIN');

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, { email, password })
    );
    this.storeToken(response.token);
  }

  async register(email: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post(`${API_BASE_URL}/api/auth/register`, { email, password }));
  }

  storeToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    this.userState.set(this.parseToken(token));
  }

  logout(redirect = true): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    this.userState.set(null);
    if (redirect) {
      void this.router.navigate(['/']);
    }
  }

  googleLogin(): void {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  }

  private readStoredUser(): AuthUser | null {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;

    try {
      const parsed = this.parseToken(token);
      if (parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      return null;
    }
  }

  private parseToken(token: string): AuthUser {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) {
      throw new Error('Invalid token');
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    const payload = JSON.parse(decoded) as JwtPayload;

    if (!payload.sub || !payload.role || !payload.exp) {
      throw new Error('Invalid token payload');
    }

    return {
      email: payload.sub,
      role: payload.role,
      token,
      expiresAt: payload.exp * 1000
    };
  }
}
