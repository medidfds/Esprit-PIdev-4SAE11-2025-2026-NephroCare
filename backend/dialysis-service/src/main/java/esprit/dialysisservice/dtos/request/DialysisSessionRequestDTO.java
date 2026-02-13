package esprit.dialysisservice.dtos.request;


import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class DialysisSessionRequestDTO {

    @NotNull(message = "Treatment ID required")
    private UUID treatmentId;

    @NotNull(message = "Nurse ID required")
    private UUID nurseId;

    @NotNull
    @Positive(message = "Weight before must be positive")
    private Double weightBefore;

    private Double weightAfter;

    @Pattern(regexp = "\\d{2,3}/\\d{2,3}", message = "Blood pressure must be like 120/80")
    private String preBloodPressure;

    private String complications;
}
