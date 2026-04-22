package esprit.dialysisreadinesstransportservice.dto.vehicle;

import esprit.dialysisreadinesstransportservice.enums.VehicleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleRequestDto {
    private String code;
    private Integer capacity;
    private Boolean wheelchairSupported;
    private VehicleStatus status;
    private Double currentLat;
    private Double currentLng;
    private Boolean active;
}
