package esprit.pharmacy_service.service;
import esprit.pharmacy_service.dto.StockStatsResponse;
import esprit.pharmacy_service.dto.StockUpdateRequest;
import esprit.pharmacy_service.entity.Enumerations.MovementReason;
import esprit.pharmacy_service.entity.Enumerations.MovementType;
import esprit.pharmacy_service.entity.Medication;
import esprit.pharmacy_service.entity.Prescription;
import esprit.pharmacy_service.entity.StockMovement;
import esprit.pharmacy_service.repository.MedicationRepository;
import esprit.pharmacy_service.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockServiceImpl implements IStockService {

    private final MedicationRepository  medicationRepository;
    private final StockMovementRepository movementRepository;

    // ════════════════════════════════════════════════
    // Mise à jour manuelle du stock
    // ════════════════════════════════════════════════
    @Override
    public Medication updateStock(String medicationId, StockUpdateRequest request) {

        // 1. Récupérer le médicament
        Medication med = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException(
                        "Medication not found: " + medicationId));

        // 2. Calculer nouveau stock
        int stockBefore = med.getQuantity() != null ? med.getQuantity() : 0;
        int stockAfter  = stockBefore + request.getQuantityChange();

        // 3. Vérifier stock suffisant pour les sorties
        if (stockAfter < 0) {
            throw new RuntimeException(
                    "Insufficient stock for '" + med.getMedicationName() + "'. " +
                            "Available: " + stockBefore + ", " +
                            "Required: " + Math.abs(request.getQuantityChange())
            );
        }

        // 4. Mettre à jour la quantité
        med.setQuantity(stockAfter);
        medicationRepository.save(med);

        // 5. Enregistrer le mouvement
        StockMovement movement = StockMovement.builder()
                .medicationId(medicationId)
                .medicationName(med.getMedicationName())
                .type(request.getQuantityChange() >= 0 ? MovementType.IN : MovementType.OUT)
                .quantity(Math.abs(request.getQuantityChange()))
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .reason(request.getReason() != null
                        ? request.getReason() : MovementReason.ADJUSTMENT)
                .prescriptionId(request.getPrescriptionId())
                .notes(request.getNotes())
                .performedBy(request.getPerformedBy() != null
                        ? request.getPerformedBy() : "Admin")
                .build();

        movementRepository.save(movement);

        log.info("✅ Stock updated: {} | {}→{} | reason: {}",
                med.getMedicationName(), stockBefore, stockAfter, request.getReason());

        return med;
    }

    // ════════════════════════════════════════════════
    // Décrémentation automatique quand DISPENSED
    // ════════════════════════════════════════════════
    @Override
    public void decrementStockForPrescription(Prescription prescription) {
        if (prescription.getMedications() == null
                || prescription.getMedications().isEmpty()) {
            log.warn("⚠️ Prescription {} has no medications", prescription.getId());
            return;
        }

        List<String> errors = new ArrayList<>();

        for (Medication prescMed : prescription.getMedications()) {

            // Chercher le médicament dans le stock global par nom
            Optional<Medication> stockMedOpt = medicationRepository
                    .findByMedicationNameIgnoreCase(prescMed.getMedicationName());

            if (stockMedOpt.isEmpty()) {
                log.warn("⚠️ Medication '{}' not found in global stock",
                        prescMed.getMedicationName());
                continue;
            }

            Medication stockMed = stockMedOpt.get();

            // Quantité à déduire
            int qtyToDecrement = prescMed.getQuantity() != null
                    ? prescMed.getQuantity() : 0;

            if (qtyToDecrement <= 0) continue;

            try {
                StockUpdateRequest req = new StockUpdateRequest();
                req.setQuantityChange(-qtyToDecrement);
                req.setReason(MovementReason.PRESCRIPTION_DISPENSED);
                req.setPrescriptionId(prescription.getId());
                req.setNotes("Auto-decremented — prescription DISPENSED");
                req.setPerformedBy("System");

                updateStock(stockMed.getId(), req);

                log.info("📦 Auto-decrement: {} -{} (prescription {})",
                        prescMed.getMedicationName(),
                        qtyToDecrement,
                        prescription.getId());

            } catch (RuntimeException e) {
                // Stock insuffisant → log mais on continue pour les autres méds
                log.error("❌ Stock error for {}: {}", prescMed.getMedicationName(), e.getMessage());
                errors.add(prescMed.getMedicationName() + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            log.error("⚠️ Some medications had insufficient stock: {}", errors);
            // On ne lève pas d'exception pour ne pas bloquer le changement de statut
        }
    }

    // ════════════════════════════════════════════════
    // Historique
    // ════════════════════════════════════════════════
    @Override
    @Transactional(readOnly = true)
    public List<StockMovement> getMovementsByMedication(String medicationId) {
        return movementRepository.findByMedicationIdOrderByCreatedAtDesc(medicationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovement> getAllMovements() {
        return movementRepository.findAllByOrderByCreatedAtDesc();
    }

    // ════════════════════════════════════════════════
    // Stats
    // ════════════════════════════════════════════════
    @Override
    @Transactional(readOnly = true)
    public StockStatsResponse getStats() {
        List<Medication> all = medicationRepository.findAll();
        List<StockMovement> moves = movementRepository.findAll();

        return StockStatsResponse.builder()
                .total(all.size())
                .available(all.stream()
                        .filter(m -> m.getQuantity() != null && m.getQuantity() > 10)
                        .count())
                .low(all.stream()
                        .filter(m -> m.getQuantity() != null
                                && m.getQuantity() > 0
                                && m.getQuantity() <= 10)
                        .count())
                .out(all.stream()
                        .filter(m -> m.getQuantity() == null || m.getQuantity() == 0)
                        .count())
                .totalMovements(moves.size())
                .totalIn(moves.stream()
                        .filter(mv -> mv.getType() == MovementType.IN)
                        .count())
                .totalOut(moves.stream()
                        .filter(mv -> mv.getType() == MovementType.OUT)
                        .count())
                .build();
    }
}