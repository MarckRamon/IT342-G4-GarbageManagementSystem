package com.g4.gms.security;

import com.g4.gms.service.UserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    // Injecting UserService to potentially load more user details if needed in the future,
    // but currently relying on claims from the token.
    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String userId = tokenProvider.getUserIdFromJWT(jwt);
                Claims claims = tokenProvider.getAllClaimsFromToken(jwt);
                String role = claims.get("role", String.class);

                // Ensure role is not null before creating authority
                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                if (role != null) {
                    // Spring Security expects roles to start with "ROLE_" convention
                    authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                } else {
                    logger.warn("Role claim missing in JWT for user {}", userId);
                    // Handle missing role case if necessary (e.g., assign default role or deny access)
                }

                // Create authentication token directly from token data (userId as principal)
                 UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userId, // Principal is the user ID
                        null,   // Credentials - not needed for JWT
                        authorities); // Authorities derived from token claims

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set authentication in the security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                 logger.debug("Successfully authenticated user {} with roles {} from JWT", userId, authorities);
            }
        } catch (Exception ex) {
            // Log the error but allow the request to proceed.
            // SecurityContextHolder remains unauthenticated.
            // Access decisions will be made later in the filter chain (e.g., by authorization rules).
            logger.error("Could not set user authentication in security context", ex);
        }

        // Proceed with the filter chain whether authentication succeeded or not.
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // Check if the header exists and starts with "Bearer "
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            // Return the token part after "Bearer "
            return bearerToken.substring(7);
        }
        // Return null if the header is missing or doesn't follow the Bearer scheme
        return null;
    }
} 