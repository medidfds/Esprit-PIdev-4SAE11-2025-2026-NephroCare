package esprit.dialysisservice.dtos.request;

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
    private String category; // ADEQUACY, HEMODYNAMIC, WEIGHT, COMPLICATION, READINESS, VITAL, SYSTEM
    private String title;
    private String message;
}
