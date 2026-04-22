package esprit.dialysisreadinesstransportservice.dto.transport;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectTransportRequestDto {
    private String rejectionReason;
}
