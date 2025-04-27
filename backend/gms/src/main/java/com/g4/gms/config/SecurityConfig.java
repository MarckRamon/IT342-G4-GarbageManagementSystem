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
                // Auth endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/request-password-reset").permitAll()
                
                // Pickup location endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/pickup-locations", "/api/pickup-locations/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/pickup-locations").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/pickup-locations/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/pickup-locations/**").authenticated()
                
                // Feedback endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/feedback", "/api/feedback/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/feedback").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/feedback/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/feedback/**").authenticated()
                
                // Schedule endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/schedule", "/api/schedule/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/schedule").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/schedule/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/schedule/**").authenticated()
                
                // Tip endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/tip", "/api/tip/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tip").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/tip/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/tip/**").authenticated()
                
                // History endpoints - GET is public, POST needs authentication
                .requestMatchers(HttpMethod.GET, "/api/history", "/api/history/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/history").authenticated()
                
                // Missed endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/missed", "/api/missed/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/missed").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/missed/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/missed/**").authenticated()
                
                // Reminder endpoints - GET is public, others need authentication
                .requestMatchers(HttpMethod.GET, "/api/reminder", "/api/reminder/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reminder").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/reminder/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/reminder/**").authenticated()
                
                // User profile endpoints
                .requestMatchers(HttpMethod.GET, "/api/users/{userId}/profile", "/api/users/{userId}/profile/email", "/api/users/{userId}/profile/notifications").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/users/{userId}/profile", "/api/users/{userId}/profile/email", "/api/users/{userId}/profile/notifications").authenticated()
                
                // Example: Secure a hypothetical admin endpoint - requires ADMIN role
                // .requestMatchers("/api/admin/**").hasRole("ADMIN") 
                
                // Any other request needs authentication
                .anyRequest().authenticated()
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