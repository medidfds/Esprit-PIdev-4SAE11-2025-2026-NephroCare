package esprit.dialysisreadinesstransportservice.dto.ridegroup;

import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import esprit.dialysisreadinesstransportservice.enums.RideDecisionType;
import esprit.dialysisreadinesstransportservice.enums.RideGroupStatus;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedRideGroupResponseDto {
    private UUID id;
    private LocalDate day;
    private DialysisShift shift;
    private String pickupZone;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private RideDecisionType decisionType;
    private RideGroupStatus status;
    private Double compatibilityScore;
    private LocalDateTime validatedAt;
    
    private UUID vehicleId;
    private String vehicleCode;
    
    private Integer memberCount;
    private Boolean requiresWheelchair;
}
