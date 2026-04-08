package com.example.demo.dto;

import lombok.Data;

@Data
public class registerrequest {
    private String name;
    private String email;
    private String password;
    private String role; // STUDENT, LECTURER, TECHNICIAN, ADMIN
}