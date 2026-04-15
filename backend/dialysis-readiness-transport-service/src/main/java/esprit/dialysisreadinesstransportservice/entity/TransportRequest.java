package esprit.dialysisreadinesstransportservice.entity;

import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import esprit.dialysisreadinesstransportservice.enums.RequestSource;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transport_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRequest {

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

    @Column(name = "pickup_zone")
    private String pickupZone;

    @Column(name = "pickup_address")
    private String pickupAddress;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "wheelchair_required")
    private boolean wheelchairRequired;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportRequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_by")
    private RequestSource requestedBy;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "admin_comment")
    private String adminComment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_ride_group_id")
    private SharedRideGroup sharedRideGroup;
}
