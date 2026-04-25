package com.example.demo.dto;

import com.example.demo.entity.Incident;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateIncidentStatusRequest {

    @NotNull(message = "Status is required")
    private Incident.Status status;

    @Size(max = 500, message = "Reason must be less than 500 characters")
    private String reason;

    @Size(max = 1000, message = "Resolution notes must be less than 1000 characters")
    private String resolutionNotes;
}

