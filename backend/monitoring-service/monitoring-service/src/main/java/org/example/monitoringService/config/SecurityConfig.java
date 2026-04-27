package org.example.monitoringService.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ❌ désactiver CSRF (API REST + Angular)
                .csrf(csrf -> csrf.disable())

                // 🌍 activer CORS (utilise CorsConfig)
                .cors(cors -> {})

                // 🔓 autorisation
                .authorizeHttpRequests(auth -> auth
                        // 🔥 WebSocket (IMPORTANT)
                        .requestMatchers("/ws-alerts/**").permitAll()

                        // 🔓 API publique (pour ton projet)
                        .requestMatchers("/api/**").permitAll()

                        // 🔐 sinon (au cas où)
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}