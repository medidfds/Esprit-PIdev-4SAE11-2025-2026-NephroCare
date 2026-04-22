package esprit.dialysisreadinesstransportservice.entity;

import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import esprit.dialysisreadinesstransportservice.enums.RideDecisionType;
import esprit.dialysisreadinesstransportservice.enums.RideGroupStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shared_ride_group")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedRideGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate day;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DialysisShift shift;

    @Column(name = "pickup_zone", nullable = false)
    private String pickupZone;

    @Column(name = "pickup_address")
    private String pickupAddress;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "compatibility_score")
    private Double compatibilityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type")
    private RideDecisionType decisionType;

    @Enumerated(EnumType.STRING)
    private RideGroupStatus status;

    @Column(name = "validated_by")
    private UUID validatedBy;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Builder.Default
    @OneToMany(mappedBy = "sharedRideGroup", cascade = CascadeType.ALL)
    private List<TransportRequest> requests = new ArrayList<>();

    @PreRemove
    private void preRemove() {
        if (this.vehicle != null) {
            this.vehicle.setStatus(esprit.dialysisreadinesstransportservice.enums.VehicleStatus.IDLE);
        }
    }
}
