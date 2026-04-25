package com.example.demo.service;

import com.example.demo.dto.CreateIncidentRequest;
import com.example.demo.dto.UpdateIncidentStatusRequest;
import com.example.demo.entity.Incident;
import com.example.demo.entity.User;
import com.example.demo.repository.IncidentAttachmentRepository;
import com.example.demo.repository.IncidentRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentAttachmentRepository incidentAttachmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private IncidentAttachmentStorageService attachmentStorageService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private IncidentService incidentService;

    private User reporter;
    private User technician;

    @BeforeEach
    void setUp() {
        reporter = User.builder()
                .id(10L)
                .name("Reporter")
                .email("reporter@test.com")
                .password("pwd")
                .role(User.Role.STUDENT)
                .build();

        technician = User.builder()
                .id(20L)
                .name("Tech")
                .email("tech@test.com")
                .password("pwd")
                .role(User.Role.TECHNICIAN)
                .build();
    }

    @Test
    void createIncident_shouldPersistAndReturnResponse() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setLocation("L4 Building");
        request.setCategory("Projector");
        request.setDescription("Projector not turning on");
        request.setPriority(Incident.Priority.HIGH);
        request.setPreferredContact("0771234567");

        when(userRepository.findByEmail("reporter@test.com")).thenReturn(Optional.of(reporter));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident incident = invocation.getArgument(0);
            incident.setId(101L);
            return incident;
        });
        when(attachmentStorageService.saveAttachments(any(Incident.class), any())).thenReturn(List.of());

        var response = incidentService.createIncident("reporter@test.com", request, List.of());

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(Incident.Status.OPEN, response.getStatus());
        assertEquals("Projector", response.getCategory());
        verify(incidentRepository, times(1)).save(any(Incident.class));
    }

    @Test
    void updateStatus_shouldFailWhenRejectReasonMissing() {
        Incident incident = Incident.builder()
                .id(500L)
                .reportedBy(reporter)
                .status(Incident.Status.OPEN)
                .location("Main Hall")
                .category("AC")
                .description("AC not cooling")
                .priority(Incident.Priority.MEDIUM)
                .build();

        User admin = User.builder()
                .id(1L)
                .name("Admin")
                .email("admin@test.com")
                .password("pwd")
                .role(User.Role.ADMIN)
                .build();

        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setStatus(Incident.Status.REJECTED);

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(incidentRepository.findById(500L)).thenReturn(Optional.of(incident));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> incidentService.updateStatus(500L, request, "admin@test.com"));

        assertTrue(ex.getMessage().contains("Reason is required"));
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void updateStatus_assignedTechnicianCanSetInProgress() {
        Incident incident = Incident.builder()
                .id(700L)
                .reportedBy(reporter)
                .assignedTechnician(technician)
                .status(Incident.Status.OPEN)
                .location("Lab 1")
                .category("Network")
                .description("No internet")
                .priority(Incident.Priority.HIGH)
                .build();

        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setStatus(Incident.Status.IN_PROGRESS);

        when(userRepository.findByEmail("tech@test.com")).thenReturn(Optional.of(technician));
        when(incidentRepository.findById(700L)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = incidentService.updateStatus(700L, request, "tech@test.com");

        assertEquals(Incident.Status.IN_PROGRESS, response.getStatus());
        verify(incidentRepository).save(any(Incident.class));
    }
}

