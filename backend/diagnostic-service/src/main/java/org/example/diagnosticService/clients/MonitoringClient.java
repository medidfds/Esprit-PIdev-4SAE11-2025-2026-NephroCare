package org.example.diagnosticService.clients;

import org.example.diagnosticService.dto.DiagnosticResultDTO;
import org.example.diagnosticService.dto.AlertResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "monitoring-service")
public interface MonitoringClient {

    @PostMapping("/api/alerts/from-diagnostic")
    AlertResponseDTO send(@RequestBody DiagnosticResultDTO dto);
}
