package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignTechnicianRequest {

    @NotNull(message = "Technician id is required")
    private Long technicianId;
}

