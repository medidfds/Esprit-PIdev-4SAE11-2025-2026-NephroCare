package esprit.dialysisreadinesstransportservice.dto.availability;

import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.ChildMood;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAvailabilityResponseDto {
    private UUID scheduledSessionId;
    private UUID patientId;
    private AvailabilityStatus availabilityStatus;
    private ChildMood childMood;
    private boolean transportNeeded;
    private boolean hasTransportAlternative;
    private LocalDateTime responseTime;
}
