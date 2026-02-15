package org.example.hospitalizationservice.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VitalSigns {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime recordDate;
    private Float temperature;
    private String bloodPressure;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Float oxygenSaturation;
    private String notes;
    private String recordedBy;

    // Many VitalSigns belong to one Hospitalization
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalization_id")
    @JsonBackReference // Helps avoid infinite recursion in JSON
    private Hospitalization hospitalization;
}
