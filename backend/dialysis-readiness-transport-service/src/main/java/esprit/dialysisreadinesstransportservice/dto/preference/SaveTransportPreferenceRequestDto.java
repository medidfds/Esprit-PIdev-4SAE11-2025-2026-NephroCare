package esprit.dialysisreadinesstransportservice.dto.preference;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveTransportPreferenceRequestDto {
    private boolean defaultTransportNeeded;
    private boolean hasTransportAlternative;
    private String preferredPickupZone;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private boolean wheelchairRequired;
    private String notes;
}
