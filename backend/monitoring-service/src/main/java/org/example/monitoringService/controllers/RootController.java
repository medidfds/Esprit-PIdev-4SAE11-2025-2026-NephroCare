package org.example.monitoringService.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> index() {
        return Map.of(
                "service", "monitoring-service",
                "status", "running",
                "message", "Use one of the API endpoints instead of the root path.",
                "endpoints", Map.of(
                        "alerts", "/api/alerts",
                        "appointments", "/api/appointments"
                )
        );
    }
}
