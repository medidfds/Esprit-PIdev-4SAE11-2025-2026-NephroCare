package esprit.clinicalservice.services.impl;

import esprit.clinicalservice.repositories.ConsultationRepository;
import esprit.clinicalservice.services.UserDirectoryClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceImplTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private UserDirectoryClient userDirectoryClient;

    @InjectMocks
    private ConsultationServiceImpl consultationService;

    @Test
    void getAvailablePatientIds_returnsIdsFromUserDirectoryWhenPresent() {
        List<Long> patientIds = List.of(3L, 7L, 12L);
        when(userDirectoryClient.getPatientIds()).thenReturn(patientIds);

        List<Long> result = consultationService.getAvailablePatientIds();

        assertThat(result).containsExactlyElementsOf(patientIds);
    }

    @Test
    void getAvailablePatientIds_fallsBackToRepositoryWhenUserDirectoryIsEmpty() {
        List<Long> fallbackIds = List.of(2L, 5L);
        when(userDirectoryClient.getPatientIds()).thenReturn(List.of());
        when(consultationRepository.findDistinctPatientIds()).thenReturn(fallbackIds);

        List<Long> result = consultationService.getAvailablePatientIds();

        assertThat(result).containsExactlyElementsOf(fallbackIds);
        verify(consultationRepository).findDistinctPatientIds();
    }

    @Test
    void getAvailableDoctorIds_returnsIdsFromUserDirectoryWhenPresent() {
        List<Long> doctorIds = List.of(11L, 19L);
        when(userDirectoryClient.getDoctorIds()).thenReturn(doctorIds);

        List<Long> result = consultationService.getAvailableDoctorIds();

        assertThat(result).containsExactlyElementsOf(doctorIds);
    }

    @Test
    void getAvailableDoctorIds_fallsBackToRepositoryWhenUserDirectoryReturnsNull() {
        List<Long> fallbackIds = List.of(13L, 17L);
        when(userDirectoryClient.getDoctorIds()).thenReturn(null);
        when(consultationRepository.findDistinctDoctorIds()).thenReturn(fallbackIds);

        List<Long> result = consultationService.getAvailableDoctorIds();

        assertThat(result).containsExactlyElementsOf(fallbackIds);
        verify(consultationRepository).findDistinctDoctorIds();
    }
}
