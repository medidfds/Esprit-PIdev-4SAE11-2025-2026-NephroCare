package org.example.hospitalizationservice.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class Hospitalization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Admission date is required")
    @PastOrPresent(message = "Admission date cannot be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime admissionDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dischargeDate;

    // ── Replaces the old plain String roomNumber field ────────────────────
    // EAGER fetch so the room is always included in JSON serialization
    // without needing an open Hibernate session.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    @NotNull(message = "Room is required")
    private Room room;

    @NotBlank(message = "Admission reason is required")
    @Size(max = 255, message = "Admission reason cannot exceed 255 characters")
    private String admissionReason;

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "^(pending|active|discharged)$",
            message = "Status must be 'pending', 'active' or 'discharged'"
    )
    private String status;

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Attending doctor ID is required")
    private String attendingDoctorId;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<VitalSigns> vitalSignsRecords = new ArrayList<>();
}