import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/'], {
      queryParams: { error: 'Please login to continue.' }
    });
  }

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard'], {
    queryParams: { error: 'Admin access is required for the history dashboard.' }
  });
};
