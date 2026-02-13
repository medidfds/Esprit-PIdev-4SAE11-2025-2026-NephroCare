package esprit.dialysisservice.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class DialysisSessionResponseDTO {

    private UUID id;
    private UUID treatmentId;
    private UUID nurseId;
    private Double weightBefore;
    private Double weightAfter;
    private Double ultrafiltrationVolume;
    private String preBloodPressure;
    private String complications;
}
