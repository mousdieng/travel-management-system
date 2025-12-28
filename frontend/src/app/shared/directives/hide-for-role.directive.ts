import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

/**
 * Structural directive for hiding UI based on roles (inverse of hasRole)
 *
 * Usage:
 * ```html
 * <!-- Hide from admins -->
 * <div *hideForRole="[UserRole.ADMIN]">
 *   This is hidden from admins
 * </div>
 *
 * <!-- Hide from managers and admins -->
 * <div *hideForRole="[UserRole.ADMIN, UserRole.TRAVEL_MANAGER]">
 *   Only travelers can see this
 * </div>
 * ```
 */
@Directive({
  selector: '[hideForRole]',
  standalone: true
})
export class HideForRoleDirective implements OnInit, OnDestroy {
  private hiddenRoles: UserRole[] = [];
  private destroy$ = new Subject<void>();

  @Input() set hideForRole(roles: UserRole | UserRole[]) {
    this.hiddenRoles = Array.isArray(roles) ? roles : [roles];
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
      // User not logged in or no role, show content (useful for public content)
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    const userRole = user.role as UserRole;

    // Check if user's role should hide this content
    if (this.shouldHideForRole(userRole)) {
      // Hide content
      this.viewContainer.clear();
    } else {
      // Show content
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  private shouldHideForRole(userRole: UserRole): boolean {
    // Check if user's role is in hidden roles
    if (this.hiddenRoles.includes(userRole)) {
      return true;
    }

    // ADMIN is in hidden roles, hide from admin
    if (this.hiddenRoles.includes(UserRole.ADMIN) && userRole === UserRole.ADMIN) {
      return true;
    }

    // If TRAVELER is hidden and user is traveler
    if (this.hiddenRoles.includes(UserRole.TRAVELER) && userRole === UserRole.TRAVELER) {
      return true;
    }

    return false;
  }
}
