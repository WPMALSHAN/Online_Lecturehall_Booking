package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IncidentCommentResponse {
    private Long id;
    private Long incidentId;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

