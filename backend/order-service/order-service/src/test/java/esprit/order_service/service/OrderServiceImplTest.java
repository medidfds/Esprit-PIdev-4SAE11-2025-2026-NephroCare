package esprit.order_service.service;

import esprit.order_service.dto.OrderItemRequest;
import esprit.order_service.dto.OrderRequest;
import esprit.order_service.dto.OrderResponse;
import esprit.order_service.entity.Order;
import esprit.order_service.entity.Enumerations.OrderStatus;
import esprit.order_service.repository.DeliveryRepository;
import esprit.order_service.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DeliveryRepository deliveryRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    void createOrder_buildsItemsAndComputesTotalAmount() {
        OrderRequest request = new OrderRequest();
        request.setPatientId("patient-1");
        request.setPatientName("Ali");
        request.setDeliveryAddress("Tunis");
        request.setPhoneNumber("12345678");
        request.setNotes("deliver fast");
        request.setItems(List.of(item("med-1", "Drug A", 2), item("med-2", "Drug B", 3)));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setId("order-1");
            return saved;
        });

        OrderResponse response = orderService.createOrder(request);

        assertThat(response.getId()).isEqualTo("order-1");
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(response.getTotalAmount()).isEqualTo(50.0);
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems().get(0).getSubtotal()).isEqualTo(20.0);
        assertThat(response.getItems().get(1).getSubtotal()).isEqualTo(30.0);
    }

    @Test
    void updateStatus_rejectsClosedOrders() {
        Order order = Order.builder()
                .id("order-9")
                .patientId("patient-1")
                .status(OrderStatus.CANCELLED)
                .deliveryAddress("Tunis")
                .build();

        when(orderRepository.findById("order-9")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus("order-9", OrderStatus.CONFIRMED))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Impossible de modifier le statut");
    }

    @Test
    void updateStatus_persistsNewStatusForOpenOrder() {
        Order order = Order.builder()
                .id("order-2")
                .patientId("patient-2")
                .patientName("Meriem")
                .status(OrderStatus.PENDING)
                .deliveryAddress("Sfax")
                .build();

        when(orderRepository.findById("order-2")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(deliveryRepository.findByOrderId("order-2")).thenReturn(Optional.empty());

        OrderResponse response = orderService.updateStatus("order-2", OrderStatus.CONFIRMED);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(order);
    }

    private OrderItemRequest item(String medicationId, String medicationName, int quantity) {
        OrderItemRequest item = new OrderItemRequest();
        item.setMedicationId(medicationId);
        item.setMedicationName(medicationName);
        item.setDosage("1/day");
        item.setRoute("oral");
        item.setQuantity(quantity);
        return item;
    }
}
