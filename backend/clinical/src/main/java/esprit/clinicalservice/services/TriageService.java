package esprit.clinicalservice.services;

import esprit.clinicalservice.dtos.DoctorEfficiencyDTO;
import esprit.clinicalservice.entities.TriageAssessment;
import esprit.clinicalservice.entities.TriageQueueItem;
import esprit.clinicalservice.entities.enums.TriageLevel;

import java.time.LocalDateTime;
import java.util.List;

public interface TriageService {

    TriageQueueItem createAssessmentAndQueueItem(TriageAssessment assessment);

    List<TriageQueueItem> getPrioritizedQueue();

    TriageQueueItem startCare(Long queueItemId, Long doctorId);

    TriageQueueItem closeQueueItem(Long queueItemId, Long doctorId);

    TriageQueueItem overridePriority(Long queueItemId, Long doctorId, TriageLevel triageLevel, Integer maxWaitMinutes, String reason);

    List<DoctorEfficiencyDTO> getDoctorEfficiency(LocalDateTime from, LocalDateTime to);

    void processOverdueEscalations();

    void processStalledInProgressItems();
}
