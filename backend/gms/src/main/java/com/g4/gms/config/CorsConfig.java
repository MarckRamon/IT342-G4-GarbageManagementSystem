package com.g4.gms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    // Web frontends
                    "http://localhost:3000",     // React web frontend
                    "http://localhost:4200",     // Angular web frontend
                    "http://localhost:8080",     // Vue.js web frontend
                    "http://localhost:5173",     // Vite web frontend
                    
                    // Mobile app origins
                    "capacitor://localhost",     // Capacitor mobile app
                    "ionic://localhost",         // Ionic mobile app
                    "http://localhost",          // Android emulator
                    "http://10.0.2.2",           // Android emulator special IP
                    "http://10.0.3.2",           // Genymotion emulator
                    "http://192.168.1.*",        // Local network for physical devices
                    "http://127.0.0.1",          // Localhost
                    "file://*",                  // File protocol for mobile apps
                    "app://*"                    // Custom app protocol
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers")
                .exposedHeaders("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials")
                .allowCredentials(true)
                .maxAge(3600);
    }
} 