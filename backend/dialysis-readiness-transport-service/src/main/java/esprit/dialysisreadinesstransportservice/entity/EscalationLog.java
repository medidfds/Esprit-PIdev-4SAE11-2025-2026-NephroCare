package esprit.dialysisreadinesstransportservice.entity;

import esprit.dialysisreadinesstransportservice.enums.EscalationLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "escalation_log", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"scheduled_session_id", "level"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scheduled_session_id", nullable = false)
    private UUID scheduledSessionId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private EscalationLevel level;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt;
}
