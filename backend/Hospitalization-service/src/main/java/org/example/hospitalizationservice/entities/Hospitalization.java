package org.example.hospitalizationservice.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
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
@JsonInclude(JsonInclude.Include.ALWAYS) // Always include fields in JSON
public class Hospitalization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime admissionDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dischargeDate;

    private String roomNumber;
    private String admissionReason;
    private String status;
    private String userId;
    private String attendingDoctorId;

    // One Hospitalization has many VitalSigns
    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference // Helps avoid infinite recursion in JSON
    private List<VitalSigns> vitalSignsRecords = new ArrayList<>();
}
