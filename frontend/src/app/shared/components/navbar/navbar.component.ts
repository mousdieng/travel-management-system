import {Component, computed, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {UserRole} from '../../../core/models';
import {environment} from '@environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div class="container mx-auto px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center space-x-10">
            <!-- Logo -->
            <a routerLink="/" class="group flex items-center space-x-2">
              <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                TravelMS
              </span>
            </a>

            <!-- Navigation Links -->
            <div class="hidden lg:flex items-center space-x-1">
              <!-- Public: Browse Travels -->
              <a routerLink="/travels" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                 class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                Explore
              </a>
              <a routerLink="/travels/search" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                 class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                Search
              </a>

              <!-- Admin Navigation -->
              <ng-container *ngIf="isAdmin()">
                <a routerLink="/admin/dashboard" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  Dashboard
                </a>
                <a routerLink="/admin/users" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  Users
                </a>
                <a routerLink="/admin/reports" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  Reports
                </a>
              </ng-container>

              <!-- Manager Navigation -->
              <ng-container *ngIf="isManager()">
                <a routerLink="/manager/travels" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  My Travels
                </a>
                <a routerLink="/manager/dashboard" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  Stats
                </a>
              </ng-container>

              <!-- Traveler Navigation (also available to managers) -->
              <ng-container *ngIf="currentUser() && !isAdmin()">
                <a routerLink="/traveler/recommendations" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  For You
                </a>
                <a routerLink="/traveler/subscriptions" routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
                   class="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 font-medium">
                  My Trips
                </a>
              </ng-container>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <ng-container *ngIf="currentUser(); else authButtons">
              <!-- Role Badge -->
              <span class="hidden lg:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide"
                    [ngClass]="{
                      'bg-gradient-to-r from-red-50 to-red-100 text-red-700 ring-1 ring-red-200': isAdmin(),
                      'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-200': isManager(),
                      'bg-gradient-to-r from-green-50 to-green-100 text-green-700 ring-1 ring-green-200': isTraveler()
                    }">
                {{ isAdmin() ? 'ADMIN' : isManager() ? 'MANAGER' : 'TRAVELER' }}
              </span>

              <!-- User Dropdown -->
              <div class="relative user-menu">
                <button (click)="toggleUserMenu()" class="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                  <span class="hidden md:block text-sm font-medium text-gray-700 group-hover:text-primary-600">
                    {{ currentUser()?.username }}
                  </span>
                  @if (currentUser()?.profilePictureUrl) {
                    <div class="w-10 h-10 rounded-full ring-2 ring-gray-200 group-hover:ring-primary-500 transition-all overflow-hidden">
                      <img [src]="getAvatarUrl(currentUser()?.profilePictureUrl)" alt="Profile" class="w-full h-full object-cover">
                    </div>
                  } @else {
                    <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-primary-500 transition-all shadow-md">
                      <span class="text-white text-sm font-bold">{{ (currentUser()?.username || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                  }
                  <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                @if (showUserMenu()) {
                  <div class="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    <!-- User Profile Header -->
                    <div class="relative px-5 py-5 bg-gradient-to-br from-primary-50 to-white border-b border-gray-100">
                      <div class="flex items-center space-x-3">
                        @if (currentUser()?.profilePictureUrl) {
                          <div class="w-14 h-14 rounded-full ring-2 ring-primary-500 overflow-hidden flex-shrink-0 shadow-lg">
                            <img [src]="getAvatarUrl(currentUser()?.profilePictureUrl)" alt="Profile" class="w-full h-full object-cover">
                          </div>
                        } @else {
                          <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center ring-2 ring-primary-400 shadow-lg flex-shrink-0">
                            <span class="text-white text-xl font-bold">{{ (currentUser()?.username || 'U').charAt(0).toUpperCase() }}</span>
                          </div>
                        }
                        <div class="flex-1 min-w-0">
                          <p class="text-base font-bold text-gray-900 truncate">{{ currentUser()?.username }}</p>
                          <p class="text-xs text-gray-500 truncate">{{ currentUser()?.email }}</p>
                          @if (isAdmin()) {
                            <div class="flex items-center mt-1.5">
                              <svg class="w-3.5 h-3.5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd"/>
                              </svg>
                              <span class="text-xs text-yellow-600 font-semibold tracking-wide">ADMINISTRATOR</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Menu Items -->
                    <div class="py-2">
                      <a routerLink="/traveler/profile" (click)="showUserMenu.set(false)"
                         class="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all group font-medium">
                        <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        My Profile
                      </a>
                      @if (isTraveler() || isManager()) {
                        <a routerLink="/traveler/recommendations" (click)="showUserMenu.set(false)"
                           class="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all group font-medium">
                          <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                          </svg>
                          Personalized Recommendations
                        </a>
                        <a routerLink="/traveler/statistics" (click)="showUserMenu.set(false)"
                           class="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all group font-medium">
                          <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                          </svg>
                          My Statistics
                        </a>
                      }
                      @if (isAdmin()) {
                        <a routerLink="/admin" (click)="showUserMenu.set(false)"
                           class="flex items-center px-5 py-3 text-sm text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 transition-all group font-medium">
                          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          Admin Panel
                        </a>
                      }
                      <div class="border-t border-gray-100 my-2"></div>
                      <button
                          (click)="logout()"
                          class="flex items-center w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all group font-medium"
                      >
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                }
              </div>
              
            </ng-container>
            <ng-template #authButtons>
              <a routerLink="/auth/login"
                 class="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
                Login
              </a>
              <a routerLink="/auth/register"
                 class="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Sign Up
              </a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  public showUserMenu = signal(false);
  public showMobileMenu = signal(false);

  public isAuthenticated = computed(() => this.authService.isAuthenticated());
  public currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  public isAdmin = computed(() => {return this.checkRole(UserRole.ADMIN);});
  public isTraveler = computed(() => {return this.checkRole(UserRole.TRAVELER);});
  public isManager = computed(() => {return this.checkRole(UserRole.TRAVEL_MANAGER);});

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize user profile to fetch fresh profile picture URL
    this.authService.initializeUserProfile();

    // Close user menu when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        this.showUserMenu.set(false);
      }
    });
  }

  public toggleMobileMenu(): void {
    this.showMobileMenu.set(!this.showMobileMenu());
  }

  public toggleUserMenu(): void {
    this.showUserMenu.set(!this.showUserMenu());
  }

  checkRole(role: UserRole): boolean {
    const user = this.currentUser();
    return user?.role == role;
  }

  public logout(): void {
    this.authService.logout();
    this.showUserMenu.set(false);
    this.router.navigate(['/home']);
  }

  public getAvatarUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // If it's already an absolute URL (for backward compatibility), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it's a relative path, prepend the gateway URL
    if (url.startsWith('/')) {
      return environment.apiUrl + url;
    }

    return url;
  }
}
