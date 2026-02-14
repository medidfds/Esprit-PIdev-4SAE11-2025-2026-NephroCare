package esprit.clinicalservice.controllers;

import esprit.clinicalservice.entities.Consultation;
import esprit.clinicalservice.services.ConsultationService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @PostMapping
    public Consultation create(@RequestBody Consultation consultation) {
        return consultationService.create(consultation);
    }

    @PutMapping("/{id}")
    public Consultation update(@PathVariable UUID id, @RequestBody Consultation consultation) {
        return consultationService.update(id, consultation);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        consultationService.delete(id);
    }

    @GetMapping("/{id}")
    public Consultation getById(@PathVariable UUID id) {
        return consultationService.getById(id);
    }

    @GetMapping
    public List<Consultation> getAll() {
        return consultationService.getAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Consultation> getByPatientId(@PathVariable UUID patientId) {
        return consultationService.getByPatientId(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Consultation> getByDoctorId(@PathVariable UUID doctorId) {
        return consultationService.getByDoctorId(doctorId);
    }
}