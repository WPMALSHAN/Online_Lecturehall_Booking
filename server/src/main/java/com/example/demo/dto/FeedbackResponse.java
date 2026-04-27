package com.example.demo.dto;

import com.example.demo.entity.TechnicianFeedback;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Safe DTO for TechnicianFeedback — avoids Jackson infinite recursion
 * by flattening nested User/Incident relations into plain fields.
 */
@Data
public class FeedbackResponse {

    private Long id;

    // Technician info
    private Long technicianId;
    private String technicianName;
    private String technicianEmail;

    // Incident info
    private Long incidentId;
    private String incidentLocation;
    private String incidentCategory;
    private String incidentStatus;

    // Admin info
    private Long adminId;
    private String adminName;

    // Rating data
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    /** Static factory — convert entity → DTO */
    public static FeedbackResponse from(TechnicianFeedback fb) {
        FeedbackResponse dto = new FeedbackResponse();
        dto.setId(fb.getId());

        if (fb.getTechnician() != null) {
            dto.setTechnicianId(fb.getTechnician().getId());
            dto.setTechnicianName(fb.getTechnician().getName());
            dto.setTechnicianEmail(fb.getTechnician().getEmail());
        }

        if (fb.getIncident() != null) {
            dto.setIncidentId(fb.getIncident().getId());
            dto.setIncidentLocation(fb.getIncident().getLocation());
            dto.setIncidentCategory(fb.getIncident().getCategory());
            dto.setIncidentStatus(fb.getIncident().getStatus() != null
                    ? fb.getIncident().getStatus().name() : null);
        }

        if (fb.getAdmin() != null) {
            dto.setAdminId(fb.getAdmin().getId());
            dto.setAdminName(fb.getAdmin().getName());
        }

        dto.setRating(fb.getRating());
        dto.setComment(fb.getComment());
        dto.setCreatedAt(fb.getCreatedAt());
        return dto;
    }
}
