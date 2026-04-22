package esprit.dialysisreadinesstransportservice.dto.client;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRequestDTO {
    private UUID patientId;
    private UUID sessionId;
    private String severity; // INFO, WARNING, CRITICAL
    private String category; // READINESS
    private String title;
    private String message;
}
