package esprit.dialysisreadinesstransportservice.dto.transport;

import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRequestResponseDto {
    private UUID id;
    private UUID scheduledSessionId;
    private UUID patientId;
    private TransportRequestStatus status;
    private String pickupZone;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;

    private boolean wheelchairRequired;
    private String rejectionReason;

    // Assignment visibility for patient
    // null = not yet assigned to a ride group / no vehicle
    private String assignedVehicleCode;
    private String assignedGroupStatus;
}
