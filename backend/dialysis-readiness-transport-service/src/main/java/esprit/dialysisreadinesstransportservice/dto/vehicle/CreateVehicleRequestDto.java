package esprit.dialysisreadinesstransportservice.dto.vehicle;

import esprit.dialysisreadinesstransportservice.enums.VehicleStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVehicleRequestDto {
    private String code;
    private Integer capacity;
    private boolean wheelchairSupported;
    private VehicleStatus status;
    private Double currentLat;
    private Double currentLng;
    private boolean active;
}
