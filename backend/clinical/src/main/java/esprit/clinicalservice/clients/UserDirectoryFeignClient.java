package esprit.clinicalservice.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(
        name = "user-service",
        url = "${user.service.base-url:http://localhost:8069/api/users}"
)
public interface UserDirectoryFeignClient {

    @GetMapping("/patient-ids")
    List<Long> getPatientIds();

    @GetMapping("/doctor-ids")
    List<Long> getDoctorIds();
}
