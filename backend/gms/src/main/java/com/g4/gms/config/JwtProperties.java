package com.g4.gms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component; // Or use @Configuration
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component // Make it a Spring bean so it can be injected
@ConfigurationProperties(prefix = "app.jwt")
@Validated // Optional: Add validation for properties
public class JwtProperties {

    /**
     * The secret key used for signing JWT tokens. 
     * MUST be a Base64 encoded string representing at least 512 bits (64 characters).
     * Store this securely (e.g., environment variable).
     */
    @NotBlank(message = "JWT secret cannot be blank")
    private String secret = "YOUR_VERY_STRONG_BASE64_ENCODED_512_BIT_SECRET_KEY_HERE_REPLACE_ME"; // Default only for placeholder

    /**
     * Token expiration time in milliseconds (e.g., 3600000 for 1 hour).
     */
    @NotNull(message = "JWT expiration cannot be null")
    private Long expirationMs = 3600000L; // Default 1 hour

    // Getters and Setters (required for @ConfigurationProperties binding)

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public Long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(Long expirationMs) {
        this.expirationMs = expirationMs;
    }
} 