package com.example.demo.dto;

import com.example.demo.entity.Incident;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateIncidentRequest {

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must be less than 255 characters")
    private String location;

    @NotBlank(message = "Category is required")
    @Size(max = 120, message = "Category must be less than 120 characters")
    private String category;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private Incident.Priority priority;

    @Size(max = 255, message = "Preferred contact must be less than 255 characters")
    private String preferredContact;
}

