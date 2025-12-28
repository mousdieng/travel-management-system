import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TravelService } from '../../../core/services/travel.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Travel, Subscription, Payment } from '../../../core/models';
import { SubscriptionStatus } from '../../../core/models/subscription.model';
import { PaymentStatus } from '../../../core/models/payment.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { FeedbackModalComponent } from '../../../shared/components/feedback-modal/feedback-modal.component';
import { ReportModalComponent } from '../reports/report-modal.component';
import { ReportType } from '../../../core/models/report.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-travel-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    FeedbackModalComponent,
    ReportModalComponent,
    AlertComponent
  ],
  template: `
    <!-- Loading State -->
    @if (loading) {
      <div class="flex justify-center items-center min-h-screen">
        <div class="text-center space-y-4">
          <div class="spinner spinner-lg mx-auto"></div>
          <p class="text-gray-600 font-medium">Loading travel details...</p>
        </div>
      </div>
    }

    <!-- Alert Messages (Fixed Position) -->
    <div class="fixed top-4 right-4 z-50 max-w-md animate-slide-left">
      <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success"></app-alert>
      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error"></app-alert>
    </div>

    @if (!loading && travel) {
      <div class="min-h-screen bg-gray-50">

        <!-- Hero Section with Image Gallery -->
        <div class="relative bg-gray-900">
          <!-- Main Image -->
          <div class="relative h-[500px] lg:h-[600px] overflow-hidden">
            <img [src]="travel.images[selectedImageIndex]"
                 [alt]="travel.title"
                 class="w-full h-full object-cover">

            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            <!-- Hero Content -->
            <div class="absolute inset-0 flex items-end">
              <div class="container mx-auto px-4 pb-12">
                <div class="max-w-4xl animate-slide-up">

                  <!-- Status Badges -->
                  <div class="flex flex-wrap gap-3 mb-6">
                    @if (!travel.active) {
                      <span class="badge bg-red-500 text-white shadow-lg backdrop-blur-sm">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
                        </svg>
                        Inactive
                      </span>
                    }
                    @if (travel.currentParticipants >= travel.maxParticipants) {
                      <span class="badge bg-yellow-500 text-white shadow-lg backdrop-blur-sm">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                        </svg>
                        Fully Booked
                      </span>
                    }
                    @if (travel.category) {
                      <span class="glass px-4 py-2 rounded-full text-sm font-bold text-white backdrop-blur-md shadow-lg">
                        {{ travel.category }}
                      </span>
                    }
                  </div>

                  <!-- Title -->
                  <h1 class="text-4xl lg:text-6xl font-display font-black text-white mb-4 leading-tight">
                    {{ travel.title }}
                  </h1>

                  <!-- Quick Info Bar -->
                  <div class="flex flex-wrap gap-6 text-white/90">
                    <!-- Location -->
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span class="font-medium">{{ travel.destination }}</span>
                    </div>

                    <!-- Duration -->
                    @if (getDuration()) {
                      <div class="flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="font-medium">{{ getDuration() }} days</span>
                      </div>
                    }

                    <!-- Rating -->
                    @if (travel.averageRating && travel.averageRating > 0) {
                      <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span class="font-medium">{{ travel.averageRating.toFixed(1) }} ({{ travel.totalReviews || 0 }} reviews)</span>
                      </div>
                    }

                    <!-- Participants -->
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span class="font-medium">{{ travel.currentParticipants }}/{{ travel.maxParticipants }} spots filled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Image Navigation -->
            @if (travel.images && travel.images.length > 1) {
              <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                @for (image of travel.images; track image; let i = $index) {
                  <button
                    (click)="selectImage(i)"
                    [class]="selectedImageIndex === i ? 'w-3 h-3 rounded-full bg-white' : 'w-3 h-3 rounded-full bg-white/50 hover:bg-white/80'"
                    class="transition-all duration-300">
                  </button>
                }
              </div>
            }
          </div>

          <!-- Image Thumbnails -->
          @if (travel.images && travel.images.length > 1) {
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent hidden lg:block">
              <div class="container mx-auto">
                <div class="flex gap-3 overflow-x-auto pb-2">
                  @for (image of travel.images; track image; let i = $index) {
                    <button
                      (click)="selectImage(i)"
                      class="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105"
                      [class]="selectedImageIndex === i ? 'border-white' : 'border-white/30'">
                      <img [src]="image" class="w-full h-full object-cover">
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-12">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Left Column - Travel Details -->
            <div class="lg:col-span-2 space-y-8">

              <!-- Description Card -->
              <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 animate-slide-up">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h2 class="text-3xl font-display font-bold text-gray-900">About This Trip</h2>
                </div>
                <div class="prose prose-lg max-w-none">
                  <p class="text-gray-700 leading-relaxed">{{ travel.description }}</p>
                </div>
              </div>

              <!-- Travel Dates Card -->
              <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-100 animate-slide-up" style="animation-delay: 0.1s;">
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm text-gray-600 mb-1">Departure</div>
                      <div class="text-xl font-bold text-gray-900">{{ formatDate(travel.departureDate || travel.startDate) }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm text-gray-600 mb-1">Return</div>
                      <div class="text-xl font-bold text-gray-900">{{ formatDate(travel.returnDate || travel.endDate) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Itinerary Card -->
              @if (travel.itinerary && travel.itinerary.length > 0) {
                <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 animate-slide-up" style="animation-delay: 0.2s;">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                      </svg>
                    </div>
                    <h2 class="text-3xl font-display font-bold text-gray-900">Day-by-Day Itinerary</h2>
                  </div>
                  <div class="space-y-4">
                    @for (item of travel.itinerary; track item; let i = $index) {
                      <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                          {{ i + 1 }}
                        </div>
                        <div class="flex-1 pt-1">
                          <p class="text-gray-700 leading-relaxed">{{ item }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Included/Excluded Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style="animation-delay: 0.3s;">

                <!-- What's Included -->
                @if (travel.included && travel.included.length > 0) {
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100 hover:shadow-xl transition-all duration-300">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <h3 class="text-xl font-bold text-gray-900">What's Included</h3>
                    </div>
                    <ul class="space-y-3">
                      @for (item of travel.included; track $index) {
                        <li class="flex items-start gap-3 text-gray-700">
                          <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                          <span>{{ item }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }

                <!-- What's Excluded -->
                @if (travel.excluded && travel.excluded.length > 0) {
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-100 hover:shadow-xl transition-all duration-300">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <h3 class="text-xl font-bold text-gray-900">What's Excluded</h3>
                    </div>
                    <ul class="space-y-3">
                      @for (item of travel.excluded; track $index) {
                        <li class="flex items-start gap-3 text-gray-700">
                          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                          <span>{{ item }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }

              </div>
            </div>

            <!-- Right Column - Booking Card -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-2xl shadow-2xl p-8 sticky top-24 border-2 border-gray-100 hover:border-blue-200 transition-colors duration-300 animate-slide-up" style="animation-delay: 0.4s;">

                <!-- Price Display -->
                <div class="text-center mb-8 pb-8 border-b-2 border-gray-100">
                  <div class="text-sm text-gray-500 mb-2">From</div>
                  <div class="flex items-center justify-center gap-2">
                    <span class="text-5xl font-black gradient-text">\${{ travel.price }}</span>
                    <span class="text-gray-500 text-lg">/person</span>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="space-y-4 mb-8">
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span class="text-gray-600 flex items-center gap-2">
                      <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      Departure
                    </span>
                    <span class="font-bold text-gray-900">{{ formatDateShort(travel.departureDate || travel.startDate) }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span class="text-gray-600 flex items-center gap-2">
                      <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      Return
                    </span>
                    <span class="font-bold text-gray-900">{{ formatDateShort(travel.returnDate || travel.endDate) }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span class="text-gray-600 flex items-center gap-2">
                      <svg class="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      Available
                    </span>
                    <span class="font-bold text-gray-900">{{ travel.maxParticipants - travel.currentParticipants }} spots</span>
                  </div>
                </div>

                <!-- Manager Info -->
                @if (travel.managerId) {
                  <div class="mb-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div class="flex items-center gap-3 mb-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <span class="text-white text-lg font-bold">{{ (travel.managerName || 'TM').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs text-gray-600 mb-1">Organized by</div>
                        <div class="font-bold text-gray-900 truncate">{{ travel.managerName || 'Travel Manager' }}</div>
                      </div>
                    </div>
                    <a
                      [routerLink]="['/managers', travel.managerId]"
                      class="block w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      View Profile →
                    </a>
                  </div>
                }

                <!-- Registration Status -->
                @if (isUserSubscribed()) {
                  <div class="mb-6 p-5 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200">
                    <div class="flex items-center text-green-700 mb-4">
                      <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span class="font-bold text-lg">You're Registered!</span>
                    </div>

                    <!-- Inactive Travel Warning -->
                    @if (!travel.active) {
                      <div class="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div class="flex items-start gap-3">
                          <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                          </svg>
                          <div class="flex-1">
                            <h4 class="font-bold text-red-900 mb-1">Travel Inactive</h4>
                            <p class="text-sm text-red-700">This travel has been deactivated by the manager. Please contact support or cancel your subscription for a refund.</p>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Pay Now Button (if payment not completed and travel is active) -->
                    @if (needsPayment() && travel.active) {
                      <button
                        (click)="proceedToPayment()"
                        class="w-full btn-primary mb-3 flex items-center justify-center gap-2"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                        </svg>
                        Pay Now
                      </button>
                    }

                    <!-- Disabled Pay Now Button (if payment not completed but travel is inactive) -->
                    @if (needsPayment() && !travel.active) {
                      <button
                        disabled
                        class="w-full btn-primary mb-3 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                        title="Cannot pay for inactive travel"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                        </svg>
                        Payment Unavailable
                      </button>
                    }

                    <!-- Cancel Subscription Button (if cancellable) -->
                    @if (canCancelSubscription()) {
                      <button
                        (click)="cancelSubscription()"
                        class="w-full btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 mb-3 flex items-center justify-center gap-2"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Cancel Subscription
                      </button>
                    }

                    <!-- Leave Feedback Button (if travel completed) -->
                    @if (canLeaveFeedback()) {
                      <button
                        (click)="openFeedbackModal()"
                        class="w-full btn-accent flex items-center justify-center gap-2"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                        Leave Feedback
                      </button>
                    }
                  </div>
                } @else {
                  <!-- Booking Action -->
                  @if (canBook()) {
                    <button
                      (click)="subscribeToTravel()"
                      class="w-full btn-primary mb-4 flex items-center justify-center gap-2 text-lg py-4 shadow-xl hover:shadow-2xl"
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Subscribe Now
                    </button>
                  } @else {
                    <!-- Check if inactive or fully booked -->
                    @if (!travel.active) {
                      <div class="mb-4 p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
                        <div class="flex items-center text-red-700 mb-2">
                          <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
                          </svg>
                          <span class="font-bold text-lg">Travel Unavailable</span>
                        </div>
                        <p class="text-sm text-red-600">This travel has been deactivated and is no longer accepting new subscriptions</p>
                      </div>
                    } @else {
                      <div class="mb-4 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                        <div class="flex items-center text-yellow-700 mb-2">
                          <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                          </svg>
                          <span class="font-bold text-lg">Fully Booked</span>
                        </div>
                        <p class="text-sm text-yellow-600">This travel has reached maximum capacity</p>
                      </div>
                    }
                  }
                }

                <!-- Report Button -->
                <button
                  (click)="openReportModal()"
                  class="w-full btn-ghost text-sm flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Report This Travel
                </button>

                <!-- Trust Badges -->
                <div class="mt-6 pt-6 border-t-2 border-gray-100 space-y-3">
                  <div class="flex items-center gap-3 text-sm text-gray-600">
                    <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Secure payment processing</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-gray-600">
                    <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    <span>24/7 customer support</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-gray-600">
                    <svg class="w-5 h-5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                    </svg>
                    <span>Flexible booking options</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    }

    <!-- Modals -->
    <app-feedback-modal
      #feedbackModal
      *ngIf="travel && currentSubscription()"
      [travelId]="travel.id"
      [travelTitle]="travel.title"
      (submitted)="onFeedbackSubmitted()"
    ></app-feedback-modal>

    <app-report-modal
      #reportModal
      *ngIf="travel"
      [reportType]="ReportType.TRAVEL"
      [targetId]="Number(travel.id)"
      [targetName]="travel.title"
      (submitted)="onReportSubmitted()"
    ></app-report-modal>
  `
})
export class TravelDetailComponent implements OnInit {
  @ViewChild('feedbackModal') feedbackModal!: FeedbackModalComponent;
  @ViewChild('reportModal') reportModal!: ReportModalComponent;

  travel: Travel | null = null;
  loading = false;
  selectedImageIndex = 0;
  currentSubscription = signal<Subscription | null>(null);
  userSubscription = signal<Subscription | null>(null);
  userPayments = signal<Payment[]>([]);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ReportType = ReportType;
  Number = Number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private travelService: TravelService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTravel(id);
      this.checkUserSubscription(id);
      this.loadUserPayments();
    }
  }

  loadTravel(id: string): void {
    this.loading = true;
    this.travelService.getTravelById(id).subscribe({
      next: (travel) => {
        this.travel = travel;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage.set('Failed to load travel details');
      }
    });
  }

  checkUserSubscription(travelId: string): void {
    this.subscriptionService.getMySubscriptions().subscribe({
      next: (subscriptions) => {
        // Convert both to strings for comparison to handle type mismatch
        const subscription = subscriptions.find(s => String(s.travelId) === String(travelId));
        if (subscription) {
          this.userSubscription.set(subscription);
        }
      },
      error: () => {
        // User might not be authenticated or has no subscriptions
      }
    });
  }

  loadUserPayments(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Convert user.id to number if it's a string
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    this.paymentService.getUserPayments(userId).subscribe({
      next: (payments) => {
        this.userPayments.set(payments);
      },
      error: () => {
        // Failed to load payments, keep empty array
        this.userPayments.set([]);
      }
    });
  }

  isUserSubscribed(): boolean {
    return this.userSubscription() !== null;
  }

  canBook(): boolean {
    if (!this.travel) return false;
    const availableSpots = this.travel.maxParticipants - this.travel.currentParticipants;
    return this.travel.active && availableSpots > 0 && !this.isUserSubscribed();
  }

  canLeaveFeedback(): boolean {
    if (!this.travel || !this.userSubscription()) return false;
    // Check if travel has ended
    const returnDate = new Date(this.travel.returnDate);
    return returnDate < new Date();
  }

  needsPayment(): boolean {
    const subscription = this.userSubscription();
    if (!subscription) return false;

    // Convert subscription.id to number for comparison
    const subscriptionId = typeof subscription.id === 'string' ? parseInt(subscription.id, 10) : subscription.id;

    // Check if a COMPLETED payment exists for this subscription
    // The payment's bookingId should match the subscription ID
    const hasCompletedPayment = this.userPayments().some(
      payment => payment.bookingId === subscriptionId &&
                 payment.status === PaymentStatus.COMPLETED
    );

    console.log('=== Payment Check ===');
    console.log('Subscription ID:', subscriptionId);
    console.log('User payments:', this.userPayments());
    console.log('Has completed payment?', hasCompletedPayment);
    console.log('Needs payment?', !hasCompletedPayment);
    console.log('====================');

    return !hasCompletedPayment;
  }

  canCancelSubscription(): boolean {
    const subscription = this.userSubscription();
    if (!subscription) return false;
    // Can cancel if subscription allows it and travel hasn't started
    return subscription.canBeCancelled !== false &&
           subscription.status !== 'CANCELLED' &&
           subscription.status !== 'COMPLETED';
  }

  proceedToPayment(): void {
    if (!this.travel || !this.userSubscription()) return;

    // Navigate to checkout with correct route
    this.router.navigate(['/travels', this.travel.id, 'checkout'], {
      queryParams: { subscriptionId: this.userSubscription()!.id }
    });
  }

  cancelSubscription(): void {
    const subscription = this.userSubscription();
    if (!subscription) return;

    this.confirmDialog.confirm({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel this subscription? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Subscription',
      confirmColor: 'warn',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.subscriptionService.cancelSubscription(subscription.id).subscribe({
          next: () => {
            this.userSubscription.set(null);
            this.successMessage.set('Subscription cancelled successfully');
            setTimeout(() => this.successMessage.set(null), 3000);
          },
          error: (error) => {
            this.confirmDialog.error('Cancellation Failed', error.error?.message || 'Failed to cancel subscription. Please try again.');
          }
        });
      }
    });
  }

  subscribeToTravel(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage.set('Please login to subscribe');
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      return;
    }

    if (!this.travel) return;

    // Create subscription (no payment required yet)
    const subscriptionRequest = {
      travelId: this.travel.id,
      numberOfParticipants: 1,
      passengerDetails: []
    };

    this.subscriptionService.createSubscription(subscriptionRequest).subscribe({
      next: (subscription) => {
        this.userSubscription.set(subscription);
        // Reload payments to ensure accurate payment status
        this.loadUserPayments();
        this.successMessage.set('Successfully subscribed! You can manage your subscription or pay now.');

        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);

          // Ask user if they want to pay now or later using professional dialog
          this.confirmDialog.confirm({
            title: 'Payment',
            message: 'Would you like to proceed to payment now?',
            confirmText: 'Pay Now',
            cancelText: 'Pay Later',
            confirmColor: 'primary',
            icon: 'payment'
          }).subscribe(confirmed => {
            if (confirmed && this.travel) {
              // Navigate to checkout with correct route
              this.router.navigate(['/travels', this.travel.id, 'checkout'], {
                queryParams: { subscriptionId: subscription.id }
              });
            } else {
              // Navigate to My Subscriptions page
              this.router.navigate(['/traveler/subscriptions']);
            }
          });
        }, 2000);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to create subscription');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  openFeedbackModal(): void {
    this.feedbackModal.open();
  }

  openReportModal(): void {
    this.reportModal.open();
  }

  onFeedbackSubmitted(): void {
    this.successMessage.set('Thank you for your feedback!');
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }

  onReportSubmitted(): void {
    this.successMessage.set('Report submitted successfully. Our team will review it.');
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }

  // Image Gallery
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  // Date Formatting
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateShort(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Duration Calculation
  getDuration(): number | null {
    if (!this.travel) return null;

    const startDate = new Date(this.travel.departureDate || this.travel.startDate);
    const endDate = new Date(this.travel.returnDate || this.travel.endDate);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  }
}
