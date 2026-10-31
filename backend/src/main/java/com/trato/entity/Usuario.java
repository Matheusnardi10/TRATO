package com.trato.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String nome;

    private String nomeProfissional;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    private String telefone;

    /** Hash BCrypt — nunca a senha em texto puro. */
    @NotBlank
    @Column(nullable = false)
    private String senhaHash;

    /** id de um dos Nicho definidos no frontend (core/data/nichos.ts). */
    private String nicho;

    @jakarta.persistence.Embedded
    private Negocio negocio = new Negocio();

    private LocalDate criadoEm = LocalDate.now();
}
