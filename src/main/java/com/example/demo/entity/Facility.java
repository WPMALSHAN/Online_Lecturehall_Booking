package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;       // classroom, lab, seminar hall
    private int capacity;
    private String location;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        ACTIVE, OUT_OF_SERVICE
    }
}