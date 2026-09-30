import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AUTH_PROVIDER } from '../provide-securka';

/** Redirects unauthenticated users to '/' */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PROVIDER);
  const router = inject(Router);
  return auth.isLoggedIn() || router.createUrlTree(['/']);
};
