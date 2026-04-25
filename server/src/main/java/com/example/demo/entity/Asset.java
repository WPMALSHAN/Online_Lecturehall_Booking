package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;  // projector, laptop, microphone
    private String location;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        ACTIVE, OUT_OF_SERVICE
    }
}