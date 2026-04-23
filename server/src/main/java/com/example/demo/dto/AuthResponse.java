package com.example.demo.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String role;
    private String name;

    public AuthResponse(String token, String role, String name) {
        this.token = token;
        this.role  = role;
        this.name  = name;
    }
}