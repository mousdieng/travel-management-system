import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionText?: string;
  data?: any;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface NotificationConfig {
  enableDesktop: boolean;
  enableToast: boolean;
  enableSound: boolean;
  autoClose: boolean;
  closeTimeout: number;
  maxNotifications: number;
}

/**
 * Notification service that manages application notifications including
 * toast messages, desktop notifications, and in-app notification center.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private config$ = new BehaviorSubject<NotificationConfig>(this.getDefaultConfig());

  // Public observables
  public readonly notifications = this.notifications$.asObservable();
  public readonly unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.read).length)
  );

  constructor(private toastr: ToastrService) {
    this.loadConfig();
    this.requestDesktopPermission();
  }

  /**
   * Show success message
   */
  showSuccess(message: string, title: string = 'Success', options?: any): void {
    this.showToast(NotificationType.SUCCESS, message, title, options);
    this.addNotification(NotificationType.SUCCESS, title, message);
  }

  /**
   * Show error message
   */
  showError(message: string, title: string = 'Error', options?: any): void {
    this.showToast(NotificationType.ERROR, message, title, options);
    this.addNotification(NotificationType.ERROR, title, message, true);
  }

  /**
   * Show warning message
   */
  showWarning(message: string, title: string = 'Warning', options?: any): void {
    this.showToast(NotificationType.WARNING, message, title, options);
    this.addNotification(NotificationType.WARNING, title, message);
  }

  /**
   * Show info message
   */
  showInfo(message: string, title: string = 'Info', options?: any): void {
    this.showToast(NotificationType.INFO, message, title, options);
    this.addNotification(NotificationType.INFO, title, message);
  }

  /**
   * Show custom notification
   */
  showNotification(
    type: NotificationType,
    title: string,
    message: string,
    persistent: boolean = false,
    actionUrl?: string,
    actionText?: string,
    data?: any
  ): void {
    this.showToast(type, message, title);
    this.addNotification(type, title, message, persistent, actionUrl, actionText, data);

    // Show desktop notification if enabled
    if (this.config$.value.enableDesktop) {
      this.showDesktopNotification(title, message, type);
    }
  }

  /**
   * Add notification to the notification center
   */
  private addNotification(
    type: NotificationType,
    title: string,
    message: string,
    persistent: boolean = false,
    actionUrl?: string,
    actionText?: string,
    data?: any
  ): void {
    const notification: AppNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      persistent,
      actionUrl,
      actionText,
      data
    };

    const currentNotifications = this.notifications$.value;
    const maxNotifications = this.config$.value.maxNotifications;

    // Add new notification and remove old ones if exceeding max
    const updatedNotifications = [notification, ...currentNotifications];
    if (updatedNotifications.length > maxNotifications) {
      updatedNotifications.splice(maxNotifications);
    }

    this.notifications$.next(updatedNotifications);
  }

  /**
   * Show toast notification
   */
  private showToast(type: NotificationType, message: string, title: string, options?: any): void {
    if (!this.config$.value.enableToast) {
      return;
    }

    const config = {
      timeOut: this.config$.value.autoClose ? this.config$.value.closeTimeout : 0,
      extendedTimeOut: 2000,
      progressBar: true,
      progressAnimation: 'increasing',
      positionClass: 'toast-top-right',
      ...options
    };

    switch (type) {
      case NotificationType.SUCCESS:
        this.toastr.success(message, title, config);
        break;
      case NotificationType.ERROR:
        this.toastr.error(message, title, config);
        break;
      case NotificationType.WARNING:
        this.toastr.warning(message, title, config);
        break;
      case NotificationType.INFO:
        this.toastr.info(message, title, config);
        break;
    }
  }

  /**
   * Show desktop notification
   */
  private showDesktopNotification(title: string, message: string, type: NotificationType): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const icon = this.getNotificationIcon(type);
    const notification = new Notification(title, {
      body: message,
      icon,
      badge: icon,
      tag: 'travel-admin',
      renotify: true
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click event
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notifications$.value.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    this.notifications$.next(notifications);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const notifications = this.notifications$.value.map(notification => ({
      ...notification,
      read: true
    }));

    this.notifications$.next(notifications);
  }

  /**
   * Remove notification
   */
  removeNotification(notificationId: string): void {
    const notifications = this.notifications$.value.filter(
      notification => notification.id !== notificationId
    );

    this.notifications$.next(notifications);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notifications$.next([]);
  }

  /**
   * Clear read notifications
   */
  clearReadNotifications(): void {
    const notifications = this.notifications$.value.filter(
      notification => !notification.read || notification.persistent
    );

    this.notifications$.next(notifications);
  }

  /**
   * Get all notifications
   */
  getAllNotifications(): Observable<AppNotification[]> {
    return this.notifications;
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<AppNotification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.read))
    );
  }

  /**
   * Get notification count
   */
  getNotificationCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.length)
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Update notification configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    const currentConfig = this.config$.value;
    const newConfig = { ...currentConfig, ...config };

    this.config$.next(newConfig);
    this.saveConfig(newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): Observable<NotificationConfig> {
    return this.config$.asObservable();
  }

  /**
   * Request desktop notification permission
   */
  async requestDesktopPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Private helper methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getNotificationIcon(type: NotificationType): string {
    const baseUrl = '/assets/icons/notifications/';

    switch (type) {
      case NotificationType.SUCCESS:
        return `${baseUrl}success.png`;
      case NotificationType.ERROR:
        return `${baseUrl}error.png`;
      case NotificationType.WARNING:
        return `${baseUrl}warning.png`;
      case NotificationType.INFO:
        return `${baseUrl}info.png`;
      default:
        return `${baseUrl}default.png`;
    }
  }

  private getDefaultConfig(): NotificationConfig {
    return {
      enableDesktop: true,
      enableToast: true,
      enableSound: false,
      autoClose: true,
      closeTimeout: 5000,
      maxNotifications: 50
    };
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('notification-config');
      if (stored) {
        const config = JSON.parse(stored);
        this.config$.next({ ...this.getDefaultConfig(), ...config });
      }
    } catch (error) {
      console.warn('Failed to load notification config:', error);
    }
  }

  private saveConfig(config: NotificationConfig): void {
    try {
      localStorage.setItem('notification-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save notification config:', error);
    }
  }
}