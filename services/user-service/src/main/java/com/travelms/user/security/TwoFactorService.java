package com.travelms.user.security;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.CodeGenerationException;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

/**
 * Service for Two-Factor Authentication operations
 */
@Service
public class TwoFactorService {

    private final SecretGenerator secretGenerator;
    private final QrGenerator qrGenerator;
    private final CodeGenerator codeGenerator;
    private final CodeVerifier codeVerifier;

    public TwoFactorService() {
        this.secretGenerator = new DefaultSecretGenerator();
        this.qrGenerator = new ZxingPngQrGenerator();
        this.codeGenerator = new DefaultCodeGenerator();

        TimeProvider timeProvider = new SystemTimeProvider();
        this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    }

    /**
     * Generate a new secret for 2FA
     */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /**
     * Generate QR code data URL for 2FA setup
     */
    public String generateQrCodeImageUri(String secret, String username) {
        QrData data = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer("Neo4flix")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            byte[] imageData = qrGenerator.generate(data);
            return convertBytesToDataUri(imageData);
        } catch (QrGenerationException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Verify 2FA code
     */
    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }

    /**
     * Generate current TOTP code (for testing purposes)
     */
    public String getCurrentCode(String secret) {
        try {
            TimeProvider timeProvider = new SystemTimeProvider();
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 30);
            return codeGenerator.generate(secret, currentBucket);
        } catch (CodeGenerationException e) {
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }

    /**
     * Convert byte array to data URI
     */
    private String convertBytesToDataUri(byte[] imageData) {
        String base64Image = java.util.Base64.getEncoder().encodeToString(imageData);
        return "data:image/png;base64," + base64Image;
    }

    /**
     * Validate secret format
     */
    public boolean isValidSecret(String secret) {
        return secret != null && secret.length() >= 16 && secret.matches("[A-Z2-7]+");
    }
}