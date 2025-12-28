package com.travelms.travel.service;

import com.travelms.travel.config.MinioProperties;
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

    public FileStorageService(@Autowired(required = false) MinioClient minioClient,
                              MinioProperties minioProperties) {
        this.minioClient = minioClient;
        this.minioProperties = minioProperties;
        if (minioClient == null) {
            log.warn("FileStorageService initialized without MinIO client. File operations will not be available.");
        }
    }

    /**
     * Upload a file to MinIO
     *
     * @param file      The file to upload
     * @param folder    The folder/prefix to store the file under (e.g., "posters", "trailers")
     * @return The object key (path) of the uploaded file (e.g., "posters/uuid.png")
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

            // Return just the object key, not a presigned URL
            // Presigned URLs will be generated on-demand when retrieving movies
            return filename;

        } catch (Exception e) {
            log.error("Error uploading file to MinIO", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    /**
     * Get a presigned URL to access a file
     *
     * @param filename The name of the file in MinIO
     * @return A presigned URL valid for 7 days
     */
    public String getFileUrl(String filename) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. Cannot generate file URL.");
            return null;
        }

        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucketName())
                            .object(filename)
                            .expiry(7, TimeUnit.DAYS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error generating presigned URL for file: {}", filename, e);
            throw new RuntimeException("Failed to generate file URL", e);
        }
    }

    /**
     * Get the file content as byte array
     *
     * @param filename The name of the file in MinIO
     * @return The file content as byte array
     */
    public byte[] getFileContent(String filename) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. Cannot fetch file content.");
            throw new RuntimeException("File storage service is not available");
        }

        try {
            try (InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(filename)
                            .build()
            )) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            log.error("Error fetching file content from MinIO: {}", filename, e);
            throw new RuntimeException("Failed to fetch file content", e);
        }
    }

    /**
     * Delete a file from MinIO
     *
     * @param fileUrlOrKey The URL or object key of the file to delete
     */
    public void deleteFile(String fileUrlOrKey) {
        if (minioClient == null) {
            log.warn("MinIO client is not available. File deletion skipped.");
            return;
        }

        try {
            String filename;

            // Check if it's a URL or just an object key
            if (fileUrlOrKey.startsWith("http://") || fileUrlOrKey.startsWith("https://")) {
                // Extract filename from URL
                filename = extractFilenameFromUrl(fileUrlOrKey);
            } else {
                // Already an object key
                filename = fileUrlOrKey;
            }

            if (filename != null && !filename.isEmpty()) {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(minioProperties.getBucketName())
                                .object(filename)
                                .build()
                );
                log.info("Successfully deleted file: {}", filename);
            }
        } catch (Exception e) {
            log.error("Error deleting file from MinIO", e);
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
