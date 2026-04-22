package esprit.dialysisreadinesstransportservice.dto.preference;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientTransportPreferenceDto {
    private UUID id;
    private UUID patientId;
    private boolean defaultTransportNeeded;
    private boolean hasTransportAlternative;
    private String preferredPickupZone;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private boolean wheelchairRequired;
    private String notes;
}
