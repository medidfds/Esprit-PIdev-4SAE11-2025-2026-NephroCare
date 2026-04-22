package esprit.dialysisservice.services;

import esprit.dialysisservice.entities.SystemConfig;
import esprit.dialysisservice.repositories.SystemConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemConfigServiceImplTest {

    @Mock
    private SystemConfigRepository repo;

    @InjectMocks
    private SystemConfigServiceImpl systemConfigService;

    @Test
    void getOrCreate_createsDefaultConfigWhenRepositoryIsEmpty() {
        when(repo.findTopByOrderByIdAsc()).thenReturn(Optional.empty());
        when(repo.save(any(SystemConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemConfig result = systemConfigService.getOrCreate();

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getMaxConcurrentSessionsPerShift()).isEqualTo(10);
        verify(repo).save(any(SystemConfig.class));
    }

    @Test
    void update_throwsWhenShiftTimesOverlap() {
        SystemConfig existing = SystemConfig.defaults();
        SystemConfig update = SystemConfig.builder()
                .morningEnd(LocalTime.of(14, 0))
                .build();

        when(repo.findTopByOrderByIdAsc()).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> systemConfigService.update(update))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Morning end must be <= Afternoon start");
    }

    @Test
    void update_appliesValidChangesAndPersistsConfig() {
        SystemConfig existing = SystemConfig.defaults();
        SystemConfig update = SystemConfig.builder()
                .maxConcurrentSessionsPerShift(12)
                .ktvAlertThreshold(1.4)
                .afternoonStart(LocalTime.of(14, 0))
                .afternoonEnd(LocalTime.of(18, 0))
                .build();

        when(repo.findTopByOrderByIdAsc()).thenReturn(Optional.of(existing));
        when(repo.save(existing)).thenReturn(existing);

        SystemConfig result = systemConfigService.update(update);

        assertThat(result.getMaxConcurrentSessionsPerShift()).isEqualTo(12);
        assertThat(result.getKtvAlertThreshold()).isEqualTo(1.4);
        assertThat(result.getAfternoonStart()).isEqualTo(LocalTime.of(14, 0));
        assertThat(result.getAfternoonEnd()).isEqualTo(LocalTime.of(18, 0));
        verify(repo).save(existing);
    }
}
