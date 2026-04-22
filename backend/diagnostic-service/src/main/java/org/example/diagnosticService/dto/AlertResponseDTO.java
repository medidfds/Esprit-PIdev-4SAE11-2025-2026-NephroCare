package org.example.diagnosticService.dto;

import lombok.Data;

@Data
public class AlertResponseDTO {
    private String id;
    private String message;
    private String severity;
}