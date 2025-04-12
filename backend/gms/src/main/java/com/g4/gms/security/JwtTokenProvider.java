package com.g4.gms.security;

import com.g4.gms.config.JwtProperties;
import com.g4.gms.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final JwtProperties jwtProperties;
    private SecretKey jwtSecretKey;

    @Autowired
    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        String secret = jwtProperties.getSecret();
        if (secret == null || secret.length() < 64 || secret.equals("YOUR_VERY_STRONG_BASE64_ENCODED_512_BIT_SECRET_KEY_HERE_REPLACE_ME")) {
             logger.warn("JWT Secret is not configured or too short or using default placeholder. Using a default, insecure key. PLEASE CONFIGURE 'app.jwt.secret' with a strong, base64-encoded secret of at least 512 bits (64 characters) in your environment or application properties.");
             this.jwtSecretKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
        } else {
            try {
                byte[] keyBytes = Base64.getDecoder().decode(secret);
                this.jwtSecretKey = Keys.hmacShaKeyFor(keyBytes);
                 logger.info("JWT Secret Key loaded successfully.");
            } catch (IllegalArgumentException e) {
                 logger.error("Invalid Base64 encoding for JWT secret. Using a default, insecure key. PLEASE CHECK 'app.jwt.secret'.", e);
                 this.jwtSecretKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
            }
        }
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        claims.put("email", user.getEmail());
        claims.put("firstName", user.getFirstName());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpirationMs());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUserId())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(jwtSecretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUserIdFromJWT(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

     public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                   .setSigningKey(jwtSecretKey)
                   .build()
                   .parseClaimsJws(token)
                   .getBody();
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

     public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    private Boolean isTokenExpired(String token) {
        try {
            final Date expiration = getExpirationDateFromToken(token);
            return expiration.before(new Date());
        } catch (ExpiredJwtException ex) {
            return true;
        }
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(jwtSecretKey).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT token compact of handler are invalid: {}", ex.getMessage());
        }
        return false;
    }
} 