package esprit.dialysisservice.dtos.request;


import esprit.dialysisservice.entities.enums.VascularAccessType;
import esprit.dialysisservice.entities.enums.DialysisType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class DialysisTreatmentRequestDTO {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotNull(message = "Doctor ID is required")
    private UUID doctorId;

    @NotNull(message = "Dialysis type is required")
    private DialysisType dialysisType;

    @NotNull(message = "Access type is required")
    private VascularAccessType vascularAccessType;

    @Min(value = 1, message = "Frequency must be at least once per week")
    @Max(value = 7, message = "Frequency cannot exceed 7")
    private Integer frequencyPerWeek;

    @Positive(message = "Duration must be positive")
    private Integer prescribedDurationMinutes;

    @Positive(message = "Target dry weight must be positive")
    private Double targetDryWeight;

    private LocalDate startDate;
}
