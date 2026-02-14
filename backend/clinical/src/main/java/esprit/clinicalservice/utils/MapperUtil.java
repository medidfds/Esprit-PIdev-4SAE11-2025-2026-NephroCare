package esprit.clinicalservice.utils;

import esprit.clinicalservice.dtos.ConsultationDTO;
import esprit.clinicalservice.dtos.MedicalHistoryDTO;
import esprit.clinicalservice.entities.Consultation;
import esprit.clinicalservice.entities.MedicalHistory;

public class MapperUtil {

    public static ConsultationDTO toConsultationDTO(Consultation consultation) {
        if (consultation == null) {
            return null;
        }
        ConsultationDTO dto = new ConsultationDTO();
        dto.setId(consultation.getId());
        dto.setPatientId(consultation.getPatientId());
        dto.setDoctorId(consultation.getDoctorId());
        if (consultation.getMedicalHistory() != null) {
            dto.setMedicalHistoryId(consultation.getMedicalHistory().getId());
        }
        dto.setConsultationDate(consultation.getConsultationDate());
        dto.setDiagnosis(consultation.getDiagnosis());
        dto.setTreatmentPlan(consultation.getTreatmentPlan());
        dto.setFollowUpDate(consultation.getFollowUpDate());
        dto.setStatus(consultation.getStatus());
        return dto;
    }

    public static Consultation toConsultation(ConsultationDTO dto) {
        if (dto == null) {
            return null;
        }
        Consultation consultation = new Consultation();
        consultation.setId(dto.getId());
        consultation.setPatientId(dto.getPatientId());
        consultation.setDoctorId(dto.getDoctorId());
        consultation.setConsultationDate(dto.getConsultationDate());
        consultation.setDiagnosis(dto.getDiagnosis());
        consultation.setTreatmentPlan(dto.getTreatmentPlan());
        consultation.setFollowUpDate(dto.getFollowUpDate());
        consultation.setStatus(dto.getStatus());
        return consultation;
    }

    public static MedicalHistoryDTO toMedicalHistoryDTO(MedicalHistory medicalHistory) {
        if (medicalHistory == null) {
            return null;
        }
        MedicalHistoryDTO dto = new MedicalHistoryDTO();
        dto.setId(medicalHistory.getId());
        dto.setUserId(medicalHistory.getUserId());
        dto.setDiagnosis(medicalHistory.getDiagnosis());
        dto.setAllergies(medicalHistory.getAllergies());
        dto.setChronicConditions(medicalHistory.getChronicConditions());
        dto.setFamilyHistory(medicalHistory.getFamilyHistory());
        dto.setNotes(medicalHistory.getNotes());
        return dto;
    }

    public static MedicalHistory toMedicalHistory(MedicalHistoryDTO dto) {
        if (dto == null) {
            return null;
        }
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setId(dto.getId());
        medicalHistory.setUserId(dto.getUserId());
        medicalHistory.setDiagnosis(dto.getDiagnosis());
        medicalHistory.setAllergies(dto.getAllergies());
        medicalHistory.setChronicConditions(dto.getChronicConditions());
        medicalHistory.setFamilyHistory(dto.getFamilyHistory());
        medicalHistory.setNotes(dto.getNotes());
        return medicalHistory;
    }
}
