package esprit.dialysisreadinesstransportservice.dto.readiness;

import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessResponseDto {
    private UUID scheduledSessionId;
    private ReadinessStatus readinessStatus;
    private Double globalScore;
    private String blockingReason;
    private String warningReason;
}
