package com.example.demo.service;

import com.example.demo.dto.IncidentRequest;
import com.example.demo.entity.Incident;
import com.example.demo.entity.TechnicianUpdate;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.IncidentRepository;
import com.example.demo.repository.TechnicianUpdateRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final TechnicianUpdateRepository technicianUpdateRepository;
    private final UserRepository userRepository;

    // Create incident report
    public Incident createIncident(IncidentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Incident incident = Incident.builder()
                .reportedBy(user)
                .location(request.getLocation())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(Incident.Status.OPEN)
                .build();

        return incidentRepository.save(incident);
    }

    // Get my incidents
    public List<Incident> getMyIncidents(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return incidentRepository.findByReportedBy(user);
    }

    // Get all incidents (Admin)
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    // Get incident by ID
    public Incident getIncidentById(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
    }

    // Get incidents by status
    public List<Incident> getByStatus(String status) {
        return incidentRepository.findByStatus(Incident.Status.valueOf(status.toUpperCase()));
    }

    // Assign technician (Admin only)
    public Incident assignTechnician(Long incidentId, Long technicianId) {
        Incident incident = getIncidentById(incidentId);

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        if (technician.getRole() != User.Role.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        incident.setAssignedTechnician(technician);
        incident.setStatus(Incident.Status.IN_PROGRESS);
        return incidentRepository.save(incident);
    }

    // Technician adds update note
    public TechnicianUpdate addUpdate(Long incidentId, String updateText, String email) {
        Incident incident = getIncidentById(incidentId);

        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check this technician is assigned to this incident
        if (incident.getAssignedTechnician() == null ||
                !incident.getAssignedTechnician().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this incident");
        }

        TechnicianUpdate update = TechnicianUpdate.builder()
                .incident(incident)
                .updateText(updateText)
                .build();

        return technicianUpdateRepository.save(update);
    }

    // Get all updates for an incident
    public List<TechnicianUpdate> getUpdates(Long incidentId) {
        return technicianUpdateRepository.findByIncidentIdOrderByDateDesc(incidentId);
    }

    // Mark as resolved (Technician)
    public Incident markResolved(Long incidentId, String email) {
        Incident incident = getIncidentById(incidentId);

        if (incident.getAssignedTechnician() == null ||
                !incident.getAssignedTechnician().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this incident");
        }

        incident.setStatus(Incident.Status.RESOLVED);
        return incidentRepository.save(incident);
    }

    // Close incident (Admin only)
    public Incident closeIncident(Long incidentId) {
        Incident incident = getIncidentById(incidentId);

        if (incident.getStatus() != Incident.Status.RESOLVED) {
            throw new RuntimeException("Only resolved incidents can be closed");
        }

        incident.setStatus(Incident.Status.CLOSED);
        return incidentRepository.save(incident);
    }

    // Reject incident (Admin only)
    public Incident rejectIncident(Long incidentId) {
        Incident incident = getIncidentById(incidentId);

        if (incident.getStatus() != Incident.Status.OPEN) {
            throw new RuntimeException("Only open incidents can be rejected");
        }

        incident.setStatus(Incident.Status.REJECTED);
        return incidentRepository.save(incident);
    }

    // Get assigned incidents (Technician)
    public List<Incident> getMyAssignedIncidents(String email) {
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return incidentRepository.findByAssignedTechnician(technician);
    }
}
