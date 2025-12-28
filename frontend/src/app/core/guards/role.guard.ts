import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

/**
 * Role Guard with hierarchical permissions
 * - ADMIN: Can access all routes
 * - TRAVEL_MANAGER: Can access manager routes + all traveler routes
 * - TRAVELER: Can only access traveler routes
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();

    if (!user) {
      // User not logged in, redirect to login
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Normalize role to enum value
    const userRole = user.role as UserRole;

    // ADMIN can access everything
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Check if user's role is in the allowed roles
    if (allowedRoles.includes(userRole)) {
      return true;
    }

    // TRAVEL_MANAGER can access all TRAVELER routes
    if (userRole === UserRole.TRAVEL_MANAGER && allowedRoles.includes(UserRole.TRAVELER)) {
      return true;
    }

    // User doesn't have permission, redirect based on their role
    if (userRole === UserRole.TRAVEL_MANAGER) {
      router.navigate(['/manager/travels']);
    } else if (userRole === UserRole.TRAVELER) {
      router.navigate(['/travels']);
    } else {
      router.navigate(['/unauthorized']);
    }

    return false;
  };
};

/**
 * Predefined guards for common use cases
 */
export const adminGuard: CanActivateFn = roleGuard([UserRole.ADMIN]);
export const managerGuard: CanActivateFn = roleGuard([UserRole.TRAVEL_MANAGER]);
export const travelerGuard: CanActivateFn = roleGuard([UserRole.TRAVELER]);
export const managerOrAdminGuard: CanActivateFn = roleGuard([UserRole.ADMIN, UserRole.TRAVEL_MANAGER]);
export const authenticatedGuard: CanActivateFn = roleGuard([UserRole.ADMIN, UserRole.TRAVEL_MANAGER, UserRole.TRAVELER]);
