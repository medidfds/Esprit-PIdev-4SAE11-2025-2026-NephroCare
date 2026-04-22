package esprit.dialysisreadinesstransportservice.controller.admin;

import esprit.dialysisreadinesstransportservice.dto.readiness.ReadinessResponseDto;
import esprit.dialysisreadinesstransportservice.service.readiness.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/readiness")
@RequiredArgsConstructor
public class AdminReadinessController {

    private final ReadinessService service;

    @GetMapping
    public ResponseEntity<List<ReadinessResponseDto>> getAllReadinessChecks() {
        return ResponseEntity.ok(service.getAllReadinessChecks());
    }
}
