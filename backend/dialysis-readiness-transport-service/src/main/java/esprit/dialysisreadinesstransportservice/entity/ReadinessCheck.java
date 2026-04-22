package esprit.dialysisreadinesstransportservice.entity;

import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "readiness_check", uniqueConstraints = {
    @UniqueConstraint(columnNames = "scheduled_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scheduled_session_id", nullable = false)
    private UUID scheduledSessionId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "availability_id")
    private UUID availabilityId;

    @Column(name = "transport_request_id")
    private UUID transportRequestId;

    @Column(name = "logistical_score")
    private Double logisticalScore;

    @Column(name = "psychosocial_score")
    private Double psychosocialScore;

    @Column(name = "global_score")
    private Double globalScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "readiness_status")
    private ReadinessStatus readinessStatus;

    @Column(name = "blocking_reason")
    private String blockingReason;

    @Column(name = "warning_reason")
    private String warningReason;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;
}
