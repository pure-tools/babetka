import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AUTH_PROVIDER } from '../provide-securka';

/** Redirects users who are not logged in or do not have Pro access to '/' */
export const proGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PROVIDER);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/']);
  return auth.isPro?.() ?? router.createUrlTree(['/']);
};
