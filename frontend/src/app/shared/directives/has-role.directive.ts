import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

/**
 * Structural directive for role-based UI visibility
 *
 * Usage:
 * ```html
 * <!-- Show only to admins -->
 * <div *hasRole="[UserRole.ADMIN]">
 *   Admin only content
 * </div>
 *
 * <!-- Show to managers and admins -->
 * <div *hasRole="[UserRole.ADMIN, UserRole.TRAVEL_MANAGER]">
 *   Manager and admin content
 * </div>
 *
 * <!-- Show to everyone except admins -->
 * <div *hasRole="[UserRole.TRAVELER, UserRole.TRAVEL_MANAGER]">
 *   Non-admin content
 * </div>
 * ```
 *
 * Note: ADMIN can see all content by default (hierarchical permissions)
 * TRAVEL_MANAGER can see TRAVELER content
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private allowedRoles: UserRole[] = [];
  private destroy$ = new Subject<void>();

  @Input() set hasRole(roles: UserRole | UserRole[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Listen to auth state changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const user = this.authService.getCurrentUser();

    if (!user || !user.role) {
      // User not logged in or no role, hide content
      this.viewContainer.clear();
      return;
    }

    const userRole = user.role as UserRole;

    // Check if user has required role
    if (this.hasRequiredRole(userRole)) {
      // User has permission, show content
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // User doesn't have permission, hide content
      this.viewContainer.clear();
    }
  }

  private hasRequiredRole(userRole: UserRole): boolean {
    // ADMIN can see everything (hierarchical permission)
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Check if user's role is in allowed roles
    if (this.allowedRoles.includes(userRole)) {
      return true;
    }

    // TRAVEL_MANAGER can see TRAVELER content (hierarchical permission)
    if (userRole === UserRole.TRAVEL_MANAGER && this.allowedRoles.includes(UserRole.TRAVELER)) {
      return true;
    }

    return false;
  }
}
