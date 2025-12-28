import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

export interface FileUploadConfig {
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  uploadUrl?: string;
  showPreview?: boolean;
  autoUpload?: boolean;
  dragAndDrop?: boolean;
  compressionEnabled?: boolean;
  compressionQuality?: number;
}

export interface UploadedFile {
  file: File;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadResponse?: any;
  error?: string;
  id?: string;
}

@Component({
  selector: 'app-file-upload',
  template: `
    <div class="file-upload-container" [class.drag-over]="isDragOver">
      <!-- File Input -->
      <input
        #fileInput
        type="file"
        [multiple]="config.multiple"
        [accept]="acceptedTypes"
        (change)="onFileSelected($event)"
        style="display: none;">

      <!-- Upload Area -->
      <div
        class="upload-area"
        [class.drag-drop-enabled]="config.dragAndDrop"
        (click)="openFileDialog()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">

        <div class="upload-content">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <h3>{{ getUploadTitle() }}</h3>
          <p>{{ getUploadDescription() }}</p>

          <button mat-raised-button color="primary" type="button">
            <mat-icon>attach_file</mat-icon>
            Choose Files
          </button>

          <div class="upload-restrictions" *ngIf="hasRestrictions()">
            <small>
              <span *ngIf="config.maxFileSize">Max size: {{ formatFileSize(config.maxFileSize) }}</span>
              <span *ngIf="config.maxFiles"> • Max files: {{ config.maxFiles }}</span>
              <span *ngIf="config.allowedTypes?.length"> • Types: {{ config.allowedTypes.join(', ') }}</span>
            </small>
          </div>
        </div>
      </div>

      <!-- Selected Files List -->
      <div class="files-list" *ngIf="selectedFiles.length > 0">
        <h4>Selected Files ({{ selectedFiles.length }})</h4>

        <div class="file-item" *ngFor="let fileItem of selectedFiles; let i = index">
          <!-- File Preview -->
          <div class="file-preview">
            <img
              *ngIf="fileItem.preview && isImage(fileItem.file)"
              [src]="fileItem.preview"
              [alt]="fileItem.file.name"
              class="image-preview">

            <div
              *ngIf="!isImage(fileItem.file)"
              class="file-icon">
              <mat-icon>{{ getFileIcon(fileItem.file) }}</mat-icon>
            </div>
          </div>

          <!-- File Info -->
          <div class="file-info">
            <div class="file-name">{{ fileItem.file.name }}</div>
            <div class="file-details">
              <span class="file-size">{{ formatFileSize(fileItem.file.size) }}</span>
              <span class="file-type">{{ fileItem.file.type || 'Unknown' }}</span>
            </div>

            <!-- Upload Progress -->
            <div class="upload-progress" *ngIf="fileItem.uploadStatus === 'uploading'">
              <mat-progress-bar
                mode="determinate"
                [value]="fileItem.uploadProgress || 0">
              </mat-progress-bar>
              <span class="progress-text">{{ fileItem.uploadProgress || 0 }}%</span>
            </div>

            <!-- Upload Status -->
            <div class="upload-status" *ngIf="fileItem.uploadStatus">
              <mat-chip [class]="'status-' + fileItem.uploadStatus">
                <mat-icon>{{ getStatusIcon(fileItem.uploadStatus) }}</mat-icon>
                {{ getStatusText(fileItem.uploadStatus) }}
              </mat-chip>
            </div>

            <!-- Error Message -->
            <div class="error-message" *ngIf="fileItem.error">
              <mat-icon color="warn">error</mat-icon>
              {{ fileItem.error }}
            </div>
          </div>

          <!-- File Actions -->
          <div class="file-actions">
            <button
              mat-icon-button
              (click)="removeFile(i)"
              matTooltip="Remove file">
              <mat-icon>close</mat-icon>
            </button>

            <button
              *ngIf="!config.autoUpload && fileItem.uploadStatus !== 'uploading'"
              mat-icon-button
              color="primary"
              (click)="uploadFile(fileItem)"
              matTooltip="Upload file">
              <mat-icon>cloud_upload</mat-icon>
            </button>

            <button
              *ngIf="config.compressionEnabled && isImage(fileItem.file)"
              mat-icon-button
              (click)="compressImage(fileItem)"
              matTooltip="Compress image">
              <mat-icon>compress</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="bulk-actions" *ngIf="selectedFiles.length > 0">
        <button
          mat-button
          color="primary"
          (click)="uploadAll()"
          [disabled]="isUploading"
          *ngIf="!config.autoUpload">
          <mat-icon>cloud_upload</mat-icon>
          Upload All
        </button>

        <button
          mat-button
          color="warn"
          (click)="removeAll()">
          <mat-icon>delete</mat-icon>
          Remove All
        </button>

        <button
          mat-button
          (click)="compressAllImages()"
          *ngIf="config.compressionEnabled && hasImages()">
          <mat-icon>compress</mat-icon>
          Compress All Images
        </button>
      </div>

      <!-- Upload Summary -->
      <div class="upload-summary" *ngIf="uploadSummary.total > 0">
        <mat-card>
          <mat-card-content>
            <div class="summary-stats">
              <div class="stat">
                <span class="label">Total:</span>
                <span class="value">{{ uploadSummary.total }}</span>
              </div>
              <div class="stat">
                <span class="label">Uploaded:</span>
                <span class="value success">{{ uploadSummary.success }}</span>
              </div>
              <div class="stat">
                <span class="label">Failed:</span>
                <span class="value error">{{ uploadSummary.failed }}</span>
              </div>
              <div class="stat">
                <span class="label">Size:</span>
                <span class="value">{{ formatFileSize(uploadSummary.totalSize) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      width: 100%;
      max-width: 100%;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      background-color: #fafafa;

      &:hover {
        border-color: #3f51b5;
        background-color: #f0f0f0;
      }

      &.drag-drop-enabled {
        &.drag-over {
          border-color: #3f51b5;
          background-color: rgba(63, 81, 181, 0.1);
          transform: scale(1.02);
        }
      }
    }

    .upload-content {
      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-weight: 500;
      }

      p {
        margin: 0 0 1.5rem 0;
        color: #666;
      }

      .upload-restrictions {
        margin-top: 1rem;
        color: #999;
        font-size: 0.875rem;
      }
    }

    .files-list {
      margin-top: 2rem;

      h4 {
        margin: 0 0 1rem 0;
        color: #333;
        font-weight: 500;
      }
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 1rem;
      background-color: white;

      .file-preview {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;

        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon {
          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #666;
          }
        }
      }

      .file-info {
        flex: 1;
        min-width: 0;

        .file-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;

          mat-progress-bar {
            flex: 1;
          }

          .progress-text {
            font-size: 0.875rem;
            color: #666;
            min-width: 40px;
          }
        }

        .upload-status {
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
          }

          .status-uploading {
            background-color: #d1ecf1;
            color: #0c5460;
          }

          .status-success {
            background-color: #d4edda;
            color: #155724;
          }

          .status-error {
            background-color: #f8d7da;
            color: #721c24;
          }
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #f44336;
          margin-top: 0.5rem;
        }
      }

      .file-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }
    }

    .bulk-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .upload-summary {
      margin-top: 1.5rem;

      .summary-stats {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .label {
            font-size: 0.875rem;
            color: #666;
          }

          .value {
            font-weight: 600;
            font-size: 1.125rem;

            &.success {
              color: #4caf50;
            }

            &.error {
              color: #f44336;
            }
          }
        }
      }
    }

    /* Dark theme support */
    :host-context(.dark-theme) {
      .upload-area {
        border-color: #555;
        background-color: #424242;

        &:hover {
          background-color: #555;
        }
      }

      .upload-content h3 {
        color: #fff;
      }

      .upload-content p {
        color: #ccc;
      }

      .file-item {
        background-color: #424242;
        border-color: #555;

        .file-info .file-name {
          color: #fff;
        }

        .file-info .file-details {
          color: #ccc;
        }
      }

      .files-list h4 {
        color: #fff;
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .upload-area {
        padding: 1rem;
      }

      .file-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;

        .file-preview {
          width: 100%;
          height: 120px;
        }

        .file-actions {
          justify-content: center;
        }
      }

      .bulk-actions {
        flex-direction: column;
      }

      .summary-stats {
        justify-content: center;
      }
    }
  `]
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() config: FileUploadConfig = {
    multiple: true,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx'],
    showPreview: true,
    autoUpload: false,
    dragAndDrop: true,
    compressionEnabled: true,
    compressionQuality: 0.8
  };

  @Output() filesSelected = new EventEmitter<UploadedFile[]>();
  @Output() fileUploaded = new EventEmitter<UploadedFile>();
  @Output() uploadProgress = new EventEmitter<{ file: UploadedFile; progress: number }>();
  @Output() uploadComplete = new EventEmitter<UploadedFile[]>();
  @Output() uploadError = new EventEmitter<{ file: UploadedFile; error: string }>();

  selectedFiles: UploadedFile[] = [];
  isDragOver = false;
  isUploading = false;
  uploadSummary = {
    total: 0,
    success: 0,
    failed: 0,
    totalSize: 0
  };

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Set default config values
    this.config = {
      multiple: true,
      maxFiles: 10,
      maxFileSize: 10 * 1024 * 1024,
      allowedTypes: ['image/*', 'application/pdf'],
      showPreview: true,
      autoUpload: false,
      dragAndDrop: true,
      compressionEnabled: true,
      compressionQuality: 0.8,
      ...this.config
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get acceptedTypes(): string {
    return this.config.allowedTypes?.join(',') || '*';
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    if (!this.config.dragAndDrop) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (!this.config.dragAndDrop) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (!this.config.dragAndDrop) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  private async processFiles(files: File[]): Promise<void> {
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        console.warn(`File ${file.name} rejected: ${validation.error}`);
      }
    }

    if (validFiles.length === 0) return;

    // Check total file limit
    if (this.config.maxFiles && this.selectedFiles.length + validFiles.length > this.config.maxFiles) {
      const remainingSlots = this.config.maxFiles - this.selectedFiles.length;
      validFiles.splice(remainingSlots);
    }

    // Process valid files
    for (const file of validFiles) {
      const uploadedFile: UploadedFile = {
        file,
        uploadStatus: 'pending',
        id: this.generateFileId()
      };

      // Generate preview for images
      if (this.config.showPreview && this.isImage(file)) {
        uploadedFile.preview = await this.generatePreview(file);
      }

      this.selectedFiles.push(uploadedFile);

      // Auto upload if enabled
      if (this.config.autoUpload) {
        this.uploadFile(uploadedFile);
      }
    }

    this.updateUploadSummary();
    this.filesSelected.emit(this.selectedFiles);
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.formatFileSize(this.config.maxFileSize)}`
      };
    }

    // Check file type
    if (this.config.allowedTypes?.length) {
      const isAllowed = this.config.allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  private generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private generateFileId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  async uploadFile(fileItem: UploadedFile): Promise<void> {
    if (!this.config.uploadUrl) {
      console.warn('No upload URL configured');
      return;
    }

    fileItem.uploadStatus = 'uploading';
    fileItem.uploadProgress = 0;

    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          fileItem.uploadProgress = progress;
          this.uploadProgress.emit({ file: fileItem, progress });
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          fileItem.uploadStatus = 'success';
          fileItem.uploadResponse = JSON.parse(xhr.responseText);
          this.fileUploaded.emit(fileItem);
        } else {
          fileItem.uploadStatus = 'error';
          fileItem.error = `Upload failed: ${xhr.statusText}`;
          this.uploadError.emit({ file: fileItem, error: fileItem.error });
        }
        this.updateUploadSummary();
      });

      // Handle upload error
      xhr.addEventListener('error', () => {
        fileItem.uploadStatus = 'error';
        fileItem.error = 'Upload failed: Network error';
        this.uploadError.emit({ file: fileItem, error: fileItem.error });
        this.updateUploadSummary();
      });

      xhr.open('POST', this.config.uploadUrl);
      xhr.send(formData);

    } catch (error) {
      fileItem.uploadStatus = 'error';
      fileItem.error = `Upload failed: ${error}`;
      this.uploadError.emit({ file: fileItem, error: fileItem.error });
      this.updateUploadSummary();
    }
  }

  uploadAll(): void {
    this.isUploading = true;
    const pendingFiles = this.selectedFiles.filter(f => f.uploadStatus === 'pending');

    Promise.all(pendingFiles.map(file => this.uploadFile(file)))
      .finally(() => {
        this.isUploading = false;
        this.uploadComplete.emit(this.selectedFiles);
      });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateUploadSummary();
    this.filesSelected.emit(this.selectedFiles);
  }

  removeAll(): void {
    this.selectedFiles = [];
    this.updateUploadSummary();
    this.filesSelected.emit(this.selectedFiles);
  }

  async compressImage(fileItem: UploadedFile): Promise<void> {
    if (!this.isImage(fileItem.file)) return;

    try {
      const compressedFile = await this.compressImageFile(
        fileItem.file,
        this.config.compressionQuality || 0.8
      );

      fileItem.file = compressedFile;
      if (fileItem.preview) {
        fileItem.preview = await this.generatePreview(compressedFile);
      }

      this.updateUploadSummary();
    } catch (error) {
      console.error('Image compression failed:', error);
    }
  }

  async compressAllImages(): Promise<void> {
    const imageFiles = this.selectedFiles.filter(f => this.isImage(f.file));
    await Promise.all(imageFiles.map(file => this.compressImage(file)));
  }

  private compressImageFile(file: File, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        }, file.type, quality);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private updateUploadSummary(): void {
    this.uploadSummary = {
      total: this.selectedFiles.length,
      success: this.selectedFiles.filter(f => f.uploadStatus === 'success').length,
      failed: this.selectedFiles.filter(f => f.uploadStatus === 'error').length,
      totalSize: this.selectedFiles.reduce((sum, f) => sum + f.file.size, 0)
    };
  }

  // Utility methods
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    const type = file.type.toLowerCase();

    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'grid_on';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'slideshow';
    if (type.includes('text')) return 'description';
    if (type.includes('video')) return 'videocam';
    if (type.includes('audio')) return 'audiotrack';
    if (type.includes('archive') || type.includes('zip')) return 'archive';

    return 'insert_drive_file';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'uploading': return 'cloud_upload';
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading';
      case 'success': return 'Uploaded';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  }

  getUploadTitle(): string {
    if (this.config.multiple) {
      return this.config.dragAndDrop ? 'Drag & drop files here' : 'Select files to upload';
    }
    return this.config.dragAndDrop ? 'Drag & drop a file here' : 'Select a file to upload';
  }

  getUploadDescription(): string {
    if (this.config.multiple) {
      return 'or click to browse files from your computer';
    }
    return 'or click to browse a file from your computer';
  }

  hasRestrictions(): boolean {
    return !!(this.config.maxFileSize || this.config.maxFiles || this.config.allowedTypes?.length);
  }

  hasImages(): boolean {
    return this.selectedFiles.some(f => this.isImage(f.file));
  }
}