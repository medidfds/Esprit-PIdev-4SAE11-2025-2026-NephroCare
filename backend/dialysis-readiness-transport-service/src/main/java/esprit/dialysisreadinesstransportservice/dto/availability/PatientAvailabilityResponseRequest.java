package esprit.dialysisreadinesstransportservice.dto.availability;

import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.ChildMood;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAvailabilityResponseRequest {
    private AvailabilityStatus availabilityStatus;
    private ChildMood childMood;
    private boolean transportNeeded;
    private boolean hasTransportAlternative;
    private String comment;
}
