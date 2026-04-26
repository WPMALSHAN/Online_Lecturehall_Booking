package com.example.demo.service;

import com.example.demo.entity.Incident;
import com.example.demo.entity.TechnicianFeedback;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.IncidentRepository;
import com.example.demo.repository.TechnicianFeedbackRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TechnicianFeedbackService {

    private final TechnicianFeedbackRepository feedbackRepository;
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    // Admin submits feedback for a resolved incident
    public TechnicianFeedback submitFeedback(Long incidentId, int rating, String comment, String adminEmail) {

        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        if (incident.getStatus() != Incident.Status.RESOLVED && incident.getStatus() != Incident.Status.CLOSED) {
            throw new RuntimeException("Feedback can only be given on RESOLVED or CLOSED incidents");
        }

        if (incident.getAssignedTechnician() == null) {
            throw new RuntimeException("This incident has no assigned technician");
        }

        // Prevent duplicate feedback for the same incident
        if (feedbackRepository.findByIncidentId(incidentId).isPresent()) {
            throw new RuntimeException("Feedback has already been submitted for this incident");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        TechnicianFeedback feedback = TechnicianFeedback.builder()
                .technician(incident.getAssignedTechnician())
                .incident(incident)
                .admin(admin)
                .rating(rating)
                .comment(comment != null ? comment.trim() : "")
                .build();

        return feedbackRepository.save(feedback);
    }

    // Get all feedback for a technician (technician views own feedback)
    public List<TechnicianFeedback> getMyFeedback(String email) {
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));
        return feedbackRepository.findByTechnicianOrderByCreatedAtDesc(technician);
    }

    // Get all feedback for a specific technician by ID (admin view)
    public List<TechnicianFeedback> getFeedbackByTechnicianId(Long technicianId) {
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + technicianId));
        return feedbackRepository.findByTechnicianOrderByCreatedAtDesc(technician);
    }

    // Get feedback summary for a technician (avg rating + count)
    public Map<String, Object> getTechnicianSummary(String email) {
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        Double avg = feedbackRepository.findAverageRatingByTechnician(technician);
        long count = feedbackRepository.countByTechnician(technician);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("technicianId", technician.getId());
        summary.put("technicianName", technician.getName());
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        summary.put("totalFeedback", count);
        return summary;
    }

    // Check if incident already has feedback (for UI)
    public boolean hasExistingFeedback(Long incidentId) {
        return feedbackRepository.findByIncidentId(incidentId).isPresent();
    }
}
