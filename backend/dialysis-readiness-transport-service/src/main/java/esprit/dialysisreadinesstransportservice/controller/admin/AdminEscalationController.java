package esprit.dialysisreadinesstransportservice.controller.admin;

import esprit.dialysisreadinesstransportservice.entity.EscalationLog;
import esprit.dialysisreadinesstransportservice.repository.EscalationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/escalations")
@RequiredArgsConstructor
public class AdminEscalationController {

    private final EscalationLogRepository repository;

    @GetMapping
    public ResponseEntity<List<EscalationLog>> getAllEscalationLogs() {
        return ResponseEntity.ok(repository.findAll());
    }
}
