package esprit.dialysisreadinesstransportservice.dto.transport;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTransportRequestDto {
    private UUID scheduledSessionId;
    private String pickupZone;
    private boolean wheelchairRequired;
}
