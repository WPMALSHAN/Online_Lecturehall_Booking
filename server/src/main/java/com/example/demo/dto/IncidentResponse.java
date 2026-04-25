package com.example.demo.dto;

import com.example.demo.entity.Incident;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class IncidentResponse {
    private Long id;
    private Long reportedById;
    private String reportedByName;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String location;
    private String category;
    private String description;
    private Incident.Priority priority;
    private Incident.Status status;
    private String preferredContact;
    private String rejectionReason;
    private String resolutionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private List<AttachmentInfo> attachments;

    @Data
    @Builder
    public static class AttachmentInfo {
        private Long id;
        private String originalFileName;
        private String contentType;
        private long fileSize;
        private String previewDataUrl;
    }
}

