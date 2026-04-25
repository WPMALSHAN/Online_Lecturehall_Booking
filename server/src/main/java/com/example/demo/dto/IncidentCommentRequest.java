package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IncidentCommentRequest {

    @NotBlank(message = "Comment message is required")
    @Size(max = 1000, message = "Comment must be less than 1000 characters")
    private String message;
}

