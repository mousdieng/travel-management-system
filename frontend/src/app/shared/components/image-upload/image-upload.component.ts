import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Upload Area -->
      <div class="relative">
        <input
          #fileInput
          type="file"
          [accept]="acceptedFileTypes"
          (change)="onFileSelected($event)"
          class="hidden"
        />

        <div
          (click)="fileInput.click()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class]="getUploadAreaClasses()"
        >
          <!-- Preview Image -->
          @if (previewUrl()) {
            <div class="relative">
              <img
                [src]="previewUrl()"
                [alt]="'Image preview'"
                class="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                (click)="removeImage($event)"
                class="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          } @else {
            <!-- Upload Icon and Text -->
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <div class="mt-4">
                <p class="text-sm text-gray-700 font-medium">
                  {{ uploadText || 'Click to upload or drag and drop' }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ acceptText || 'PNG, JPG, GIF up to 10MB' }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Upload Progress -->
      @if (uploading()) {
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-700 font-medium">Uploading...</span>
            <span class="text-gray-500">{{ uploadProgress() }}%</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-600 transition-all duration-300 ease-out"
              [style.width.%]="uploadProgress()"
            ></div>
          </div>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Success Message -->
      @if (successMessage()) {
        <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-600">{{ successMessage() }}</p>
        </div>
      }
    </div>
  `
})
export class ImageUploadComponent {
  @Input() acceptedFileTypes: string = 'image/*';
  @Input() maxSizeMB: number = 10;
  @Input() uploadText?: string;
  @Input() acceptText?: string;
  @Input() currentImageUrl?: string;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() imageRemoved = new EventEmitter<void>();

  previewUrl = signal<string | null>(null);
  isDragging = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    if (this.currentImageUrl) {
      this.previewUrl.set(this.currentImageUrl);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.errorMessage.set(`File size must be less than ${this.maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Emit file selected event
    this.fileSelected.emit(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.imageRemoved.emit();
  }

  getUploadAreaClasses(): string {
    const baseClasses = 'border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200';
    const normalClasses = 'border-gray-300 hover:border-primary-500 hover:bg-primary-50';
    const draggingClasses = 'border-primary-500 bg-primary-50';

    return `${baseClasses} ${this.isDragging() ? draggingClasses : normalClasses}`;
  }

  // Public methods for parent component to control upload state
  setUploading(isUploading: boolean): void {
    this.uploading.set(isUploading);
  }

  setUploadProgress(progress: number): void {
    this.uploadProgress.set(progress);
  }

  setErrorMessage(message: string | null): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
  }

  setSuccessMessage(message: string | null): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
  }
}
