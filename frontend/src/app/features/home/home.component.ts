import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TravelService } from '../../core/services/travel.service';
import { Travel } from '../../core/models/travel.model';
import { TravelCardComponent } from '../../shared/components/travel-card/travel-card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TravelCardComponent, LoadingComponent],
  template: `
    <div class="min-h-screen">

      <!-- Hero Section with Gradient Background -->
      <div class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <!-- Animated Background Shapes -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div class="absolute top-60 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
          <div class="absolute bottom-20 right-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" style="animation-delay: 4s;"></div>
        </div>

        <div class="relative container mx-auto px-4 py-24 lg:py-32">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Left Content -->
            <div class="text-white space-y-8 animate-slide-right">
              <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span class="text-sm font-semibold">✨ Your Next Adventure Awaits</span>
              </div>

              <h1 class="text-5xl lg:text-7xl font-display font-black leading-tight">
                Discover <span class="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200">Extraordinary</span> Travel Experiences
              </h1>

              <p class="text-xl lg:text-2xl text-blue-100 leading-relaxed">
                Explore curated journeys crafted by expert travel managers.
                From hidden gems to iconic destinations, your perfect adventure is just a click away.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 pt-4">
                <a routerLink="/travels" class="group btn-lg bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-blue-200/50 hover:scale-105 transform transition-all duration-300 font-bold">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  Explore Destinations
                  <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </a>

                @if (!authService.isAuthenticated()) {
                  <a routerLink="/auth/register" class="btn-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                    </svg>
                    Join Free Today
                  </a>
                }
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div class="animate-fade-in" style="animation-delay: 0.2s;">
                  <div class="text-4xl font-bold">500+</div>
                  <div class="text-blue-200 text-sm">Destinations</div>
                </div>
                <div class="animate-fade-in" style="animation-delay: 0.4s;">
                  <div class="text-4xl font-bold">50K+</div>
                  <div class="text-blue-200 text-sm">Happy Travelers</div>
                </div>
                <div class="animate-fade-in" style="animation-delay: 0.6s;">
                  <div class="text-4xl font-bold">4.9★</div>
                  <div class="text-blue-200 text-sm">Average Rating</div>
                </div>
              </div>
            </div>

            <!-- Right Visual -->
            <div class="relative hidden lg:block animate-slide-left">
              <div class="relative z-10">
                <!-- Floating Cards -->
                <div class="absolute top-0 left-0 w-64 glass rounded-2xl p-4 shadow-2xl animate-float">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                      </svg>
                    </div>
                    <div class="text-white">
                      <div class="font-bold">Best Deals</div>
                      <div class="text-sm opacity-80">Save up to 40%</div>
                    </div>
                  </div>
                </div>

                <div class="absolute top-40 right-0 w-72 glass rounded-2xl p-4 shadow-2xl animate-float" style="animation-delay: 1s;">
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                      <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    </div>
                    <div class="text-white flex-1">
                      <div class="font-bold">Maldives Paradise</div>
                      <div class="flex items-center gap-1 text-sm">
                        <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span>4.9 (2.3k reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="absolute bottom-0 left-20 w-56 glass rounded-2xl p-4 shadow-2xl animate-float" style="animation-delay: 2s;">
                  <div class="text-white">
                    <div class="text-sm opacity-80 mb-1">Starting from</div>
                    <div class="text-3xl font-bold">$899</div>
                    <div class="text-xs opacity-60">per person</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Wave Divider -->
        <div class="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" class="text-gray-50"/>
          </svg>
        </div>
      </div>

      <!-- Features Section -->
      <div class="section bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
            <h2 class="section-title">
              Why Travelers <span class="gradient-text">Love Us</span>
            </h2>
            <p class="section-subtitle">
              Everything you need for an unforgettable journey, all in one platform
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-animation">
            <!-- Feature 1 -->
            <div class="card hover-lift group">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Smart Search</h3>
              <p class="text-gray-600 leading-relaxed">
                Find your dream destination with our AI-powered search engine and intelligent filters
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="card hover-lift group">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Personalized</h3>
              <p class="text-gray-600 leading-relaxed">
                Get tailored recommendations based on your preferences, history, and travel style
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="card hover-lift group">
              <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-teal-500/30 transition-shadow">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Secure Payment</h3>
              <p class="text-gray-600 leading-relaxed">
                Book with confidence using our encrypted payment system powered by Stripe
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="card hover-lift group">
              <div class="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-pink-500/30 transition-shadow">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">24/7 Support</h3>
              <p class="text-gray-600 leading-relaxed">
                Our travel experts are always here to help you plan the perfect vacation
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Travels -->
      <div class="section bg-white">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-end mb-12 animate-slide-up">
            <div>
              <h2 class="section-title mb-2">
                Top <span class="gradient-text">Rated</span> Adventures
              </h2>
              <p class="text-xl text-gray-600">Handpicked by our travel experts</p>
            </div>
            <a routerLink="/travels" class="btn-outline btn-sm group">
              View All
              <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-20">
              <div class="spinner-lg"></div>
            </div>
          } @else if (topTravels().length > 0) {
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
              @for (travel of topTravels(); track travel.id) {
                <app-travel-card [travel]="travel" class="animate-slide-up"/>
              }
            </div>
          } @else {
            <div class="text-center py-20">
              <div class="w-32 h-32 mx-auto mb-6 opacity-20">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-xl text-gray-500">No travels available at the moment</p>
              <p class="text-gray-400 mt-2">Check back soon for amazing destinations!</p>
            </div>
          }
        </div>
      </div>

      <!-- CTA Section -->
      <div class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20">
        <!-- Animated Background -->
        <div class="absolute inset-0">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 1.5s;"></div>
        </div>

        <div class="relative container mx-auto px-4 text-center">
          <div class="max-w-4xl mx-auto animate-scale-in">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
              <svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span class="text-white font-semibold">Rated 4.9/5 by 50,000+ travelers</span>
            </div>

            <h2 class="text-4xl lg:text-6xl font-display font-black text-white mb-6 leading-tight">
              Ready to Create <span class="text-yellow-300">Unforgettable</span> Memories?
            </h2>

            <p class="text-xl lg:text-2xl text-blue-100 mb-10 leading-relaxed">
              Join our community of adventurers and discover exclusive travel deals,
              personalized recommendations, and insider tips from expert travel managers.
            </p>

            @if (!authService.isAuthenticated()) {
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a routerLink="/auth/register" class="btn-lg bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/20 hover:scale-105 transform transition-all">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  Start Your Journey
                </a>
                <a routerLink="/travels" class="btn-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg">
                  Browse Destinations
                </a>
              </div>
            } @else {
              <a routerLink="/travels" class="btn-lg bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/20 hover:scale-105 transform transition-all inline-flex">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Explore All Destinations
              </a>
            }
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent implements OnInit {
  private travelService = inject(TravelService);
  public authService = inject(AuthService);

  topTravels = signal<Travel[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadTopTravels();
  }

  loadTopTravels(): void {
    this.travelService.getTopRated(6).subscribe({
      next: (travels) => {
        this.topTravels.set(travels);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
