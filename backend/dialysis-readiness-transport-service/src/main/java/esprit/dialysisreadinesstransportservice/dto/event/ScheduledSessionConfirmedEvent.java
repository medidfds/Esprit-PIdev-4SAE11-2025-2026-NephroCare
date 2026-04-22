package esprit.dialysisreadinesstransportservice.dto.event;

import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledSessionConfirmedEvent {
    private UUID scheduledSessionId;
    private UUID patientId;
    private LocalDate day;
    private DialysisShift shift;
}
