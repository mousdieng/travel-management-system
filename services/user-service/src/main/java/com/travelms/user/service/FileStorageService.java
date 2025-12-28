package com.travelms.user.service;

import com.travelms.user.config.MinioProperties;
import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class FileStorageService {

    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    public FileStorageService(MinioProperties minioProperties, @Autowired(required = false) MinioClient minioClient) {
        this.minioProperties = minioProperties;
        this.minioClient = minioClient;
        if (minioClient == null) {
            log.warn("MinIO client is not available. File storage operations will be disabled.");
        }
    }

    /**
     * Upload a file to MinIO
     *
     * @param file      The file to upload
     * @param folder    The folder/prefix to store the file under (e.g., "avatars")
     * @return The object key (filename) - NOT a presigned URL
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. File upload skipped.");
            throw new RuntimeException("File storage service is not available");
        }

        try {
            // Validate file
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Cannot upload empty file");
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = folder + "/" + UUID.randomUUID() + extension;

            // Upload to MinIO
            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(minioProperties.getBucketName())
                                .object(filename)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
            }

            log.info("Successfully uploaded file: {}", filename);

            // Return ONLY the object key, not a presigned URL
            // The presigned URL should be generated on-demand when needed
            return filename;

        } catch (Exception e) {
            log.error("Error uploading file to MinIO", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    /**
     * Get a presigned URL to access a file
     * THIS METHOD GENERATES TEMPORARY URLs - NEVER STORE THESE IN DATABASE!
     *
     * @param objectKey The object key/filename in MinIO (e.g., "avatars/abc123.png")
     * @return A presigned URL valid for 15 minutes
     */
    public String getFileUrl(String objectKey) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. Cannot generate file URL.");
            return null;
        }

        try {
            // If objectKey is null or empty, return null
            if (objectKey == null || objectKey.isEmpty()) {
                return null;
            }

            // If it's already a full URL (legacy data), extract the object key first
            if (objectKey.startsWith("http")) {
                objectKey = extractFilenameFromUrl(objectKey);
                if (objectKey == null) {
                    return null;
                }
            }

            // Generate a SHORT-LIVED presigned URL (15 minutes)
            // These URLs should NEVER be stored in database
            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucketName())
                            .object(objectKey)
                            .expiry(15, TimeUnit.MINUTES)
                            .build()
            );

            // Replace internal URL with public URL for browser access
            if (minioProperties.getPublicUrl() != null && !minioProperties.getPublicUrl().equals(minioProperties.getUrl())) {
                presignedUrl = presignedUrl.replace(minioProperties.getUrl(), minioProperties.getPublicUrl());
            }

            return presignedUrl;
        } catch (Exception e) {
            log.error("Error generating presigned URL for file: {}", objectKey, e);
            return null; // Return null instead of throwing exception
        }
    }

    /**
     * Delete a file from MinIO
     *
     * @param objectKey The object key/filename (e.g., "avatars/abc123.png") or legacy URL
     */
    public void deleteFile(String objectKey) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. File deletion skipped.");
            return;
        }

        try {
            // If null or empty, nothing to delete
            if (objectKey == null || objectKey.isEmpty()) {
                return;
            }

            // If it's a URL (legacy data), extract the object key
            if (objectKey.startsWith("http")) {
                objectKey = extractFilenameFromUrl(objectKey);
            }

            if (objectKey != null && !objectKey.isEmpty()) {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(minioProperties.getBucketName())
                                .object(objectKey)
                                .build()
                );
                log.info("Successfully deleted file: {}", objectKey);
            }
        } catch (Exception e) {
            log.error("Error deleting file from MinIO: {}", objectKey, e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    /**
     * Extract filename from MinIO URL
     *
     * @param url The MinIO presigned URL
     * @return The filename/object key
     */
    private String extractFilenameFromUrl(String url) {
        try {
            // URL format: http://localhost:9000/bucket-name/folder/filename?query-params
            String[] parts = url.split("\\?")[0].split("/");
            // Skip protocol, host, port, and bucket name to get the object path
            if (parts.length > 4) {
                StringBuilder filename = new StringBuilder();
                for (int i = 4; i < parts.length; i++) {
                    if (i > 4) filename.append("/");
                    filename.append(parts[i]);
                }
                return filename.toString();
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting filename from URL: {}", url, e);
            return null;
        }
    }

    /**
     * Get a presigned URL to access a file using internal MinIO URL (for server-side access)
     *
     * @param objectKey The object key/filename in MinIO (e.g., "avatars/abc123.png")
     * @return A presigned URL using internal MinIO URL, valid for 15 minutes
     */
    public String getInternalFileUrl(String objectKey) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. Cannot generate file URL.");
            return null;
        }

        try {
            // If objectKey is null or empty, return null
            if (objectKey == null || objectKey.isEmpty()) {
                return null;
            }

            // If it's already a full URL (legacy data), extract the object key first
            if (objectKey.startsWith("http")) {
                objectKey = extractFilenameFromUrl(objectKey);
                if (objectKey == null) {
                    return null;
                }
            }

            // Generate a presigned URL using internal MinIO URL
            // This URL uses the internal Docker network address (http://minio:9000)
            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucketName())
                            .object(objectKey)
                            .expiry(15, TimeUnit.MINUTES)
                            .build()
            );

            // Do NOT replace with public URL - keep internal URL for server-side access
            return presignedUrl;
        } catch (Exception e) {
            log.error("Error generating internal presigned URL for file: {}", objectKey, e);
            return null;
        }
    }

    /**
     * Check if a file exists in MinIO
     *
     * @param filename The filename to check
     * @return true if the file exists, false otherwise
     */
    public boolean fileExists(String filename) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. Cannot check file existence.");
            return false;
        }

        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(filename)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
