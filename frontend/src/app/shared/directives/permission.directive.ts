import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appPermission]'
})
export class PermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() set appPermission(permission: string | string[]) {
    this.checkPermission(permission);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-check permissions when user changes
        this.checkPermission(this.permission);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private permission: string | string[] = '';

  private checkPermission(permission: string | string[]): void {
    this.permission = permission;

    if (!permission) {
      this.showElement();
      return;
    }

    const hasPermission = Array.isArray(permission)
      ? permission.some(p => this.authService.hasPermission(p))
      : this.authService.hasPermission(permission);

    if (hasPermission) {
      this.showElement();
    } else {
      this.hideElement();
    }
  }

  private showElement(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  private hideElement(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}