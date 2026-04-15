package esprit.dialysisreadinesstransportservice.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLocationDTO {
    private UUID vehicleId;
    private String code;
    private Double currentLat;
    private Double currentLng;
}
