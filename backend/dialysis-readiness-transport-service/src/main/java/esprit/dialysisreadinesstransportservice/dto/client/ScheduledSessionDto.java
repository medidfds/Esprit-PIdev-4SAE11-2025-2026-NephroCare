package esprit.dialysisreadinesstransportservice.dto.client;

import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO mirroring ScheduledSessionResponseDTO from dialysis-service.
 * Used only for fallback PatientAvailability creation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledSessionDto {
    private UUID id;
    private UUID patientId;
    private LocalDate day;
    private DialysisShift shift;
    private String nurseConfirmation;
}
