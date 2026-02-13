package esprit.dialysisservice.mapper;

import esprit.dialysisservice.dtos.request.DialysisSessionRequestDTO;
import esprit.dialysisservice.dtos.request.DialysisTreatmentRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisSessionResponseDTO;
import esprit.dialysisservice.dtos.response.DialysisTreatmentResponseDTO;
import esprit.dialysisservice.entities.DialysisSession;
import esprit.dialysisservice.entities.DialysisTreatment;
import org.springframework.stereotype.Component;

@Component
public class DialysisMapper {

    /*
    =============================
        CREATE MAPPING
    =============================
     */
    public DialysisTreatment toEntity(DialysisTreatmentRequestDTO dto) {
        return DialysisTreatment.builder()
                .patientId(dto.getPatientId())
                .doctorId(dto.getDoctorId())
                .dialysisType(dto.getDialysisType())
                .vascularAccessType(dto.getVascularAccessType())
                .frequencyPerWeek(dto.getFrequencyPerWeek())
                .prescribedDurationMinutes(dto.getPrescribedDurationMinutes())
                .targetDryWeight(dto.getTargetDryWeight())
                .startDate(dto.getStartDate())
                .build();
    }
    public DialysisSession toEntity(DialysisSessionRequestDTO dto) {
        return DialysisSession.builder()
                .nurseId(dto.getNurseId())
                .weightBefore(dto.getWeightBefore())
                .weightAfter(dto.getWeightAfter()) // Can be null at start
                .preBloodPressure(dto.getPreBloodPressure())
                .complications(dto.getComplications())
                // Note: treatment is set manually in service
                .build();
    }

    /*
    =============================
        UPDATE MAPPING
    =============================
     */
    public void updateTreatmentFromDto(DialysisTreatmentRequestDTO dto,
                                       DialysisTreatment entity) {

        if (dto.getPatientId() != null)
            entity.setPatientId(dto.getPatientId());

        if (dto.getDoctorId() != null)
            entity.setDoctorId(dto.getDoctorId());

        if (dto.getDialysisType() != null)
            entity.setDialysisType(dto.getDialysisType());

        if (dto.getVascularAccessType() != null)
            entity.setVascularAccessType(dto.getVascularAccessType());

        if (dto.getFrequencyPerWeek() != null)
            entity.setFrequencyPerWeek(dto.getFrequencyPerWeek());

        if (dto.getPrescribedDurationMinutes() != null)
            entity.setPrescribedDurationMinutes(dto.getPrescribedDurationMinutes());

        if (dto.getTargetDryWeight() != null)
            entity.setTargetDryWeight(dto.getTargetDryWeight());

        if (dto.getStartDate() != null)
            entity.setStartDate(dto.getStartDate());

        /*
         IMPORTANT:
         We intentionally DO NOT update STATUS here.
         Status is business controlled.
        */
    }

    /*
    =============================
        RESPONSE MAPPING
    =============================
     */
    public DialysisTreatmentResponseDTO toResponse(DialysisTreatment entity) {
        return DialysisTreatmentResponseDTO.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .doctorId(entity.getDoctorId())
                .dialysisType(entity.getDialysisType())
                .vascularAccessType(entity.getVascularAccessType())
                .frequencyPerWeek(entity.getFrequencyPerWeek())
                .prescribedDurationMinutes(entity.getPrescribedDurationMinutes())
                .targetDryWeight(entity.getTargetDryWeight())
                .status(entity.getStatus())
                .startDate(entity.getStartDate())
                .build();
    }

    /*
    =============================
        SESSION RESPONSE
    =============================
     */
    public DialysisSessionResponseDTO toSessionResponse(DialysisSession entity) {
        return DialysisSessionResponseDTO.builder()
                .id(entity.getId())
                .treatmentId(entity.getTreatment().getId())
                .nurseId(entity.getNurseId())
                .weightBefore(entity.getWeightBefore())
                .weightAfter(entity.getWeightAfter())
                .ultrafiltrationVolume(entity.getUltrafiltrationVolume())
                .preBloodPressure(entity.getPreBloodPressure())
                .complications(entity.getComplications())
                .build();
    }
}
