package org.example.diagnosticService.dto;

import lombok.Data;

@Data
public class DiagnosticResultDTO {
    private String patientMatricule;
    private String testType;
    private Double numericValue;
    private String orderId;
}