package esprit.dialysisreadinesstransportservice.entity;

import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.ChildMood;
import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patient_availability", uniqueConstraints = {
    @UniqueConstraint(columnNames = "scheduled_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scheduled_session_id", nullable = false)
    private UUID scheduledSessionId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "session_day", nullable = false)
    private LocalDate sessionDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DialysisShift shift;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false)
    private AvailabilityStatus availabilityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "child_mood")
    private ChildMood childMood;

    @Column(name = "transport_needed")
    private boolean transportNeeded;

    @Column(name = "has_transport_alternative")
    private boolean hasTransportAlternative;

    private String comment;

    @Column(name = "response_time")
    private LocalDateTime responseTime;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
