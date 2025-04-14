package com.g4.gms.config;

import com.g4.gms.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer; 
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Apply CORS configuration using defaults (picks up WebMvcConfigurer bean)
            .cors(Customizer.withDefaults())
             // Disable CSRF protection as we are using JWT (stateless)
            .csrf(AbstractHttpConfigurer::disable)
            // Configure exception handling for unauthorized access
            .exceptionHandling(exceptions -> 
                exceptions.authenticationEntryPoint((request, response, authException) -> 
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")
                )
            )
            // Set session management to stateless
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Define authorization rules for different endpoints
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/request-password-reset").permitAll() // Allow public access to register, login, and password reset request
                // Example: Secure user profile endpoints - requires authentication
                .requestMatchers(HttpMethod.GET, "/api/users/{userId}/profile", "/api/users/{userId}/profile/email", "/api/users/{userId}/profile/notifications").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/users/{userId}/profile", "/api/users/{userId}/profile/email", "/api/users/{userId}/profile/notifications").authenticated()
                // Example: Secure a hypothetical admin endpoint - requires ADMIN role
                // .requestMatchers("/api/admin/**").hasRole("ADMIN") 
                // Add more specific rules as needed
                .anyRequest().authenticated() // Require authentication for any other request
            )
            // Add the JWT filter before the standard username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Note: You might need an AuthenticationManager bean if you were doing
    // traditional form login or password grants, but for JWT validation within
    // the filter, it's often not strictly necessary unless you have other
    // authentication providers.
} 