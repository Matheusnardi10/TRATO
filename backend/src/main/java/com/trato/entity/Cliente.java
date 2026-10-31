package com.trato.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Dono do cadastro — cada profissional só enxerga os próprios clientes. */
    @Column(nullable = false)
    private Long usuarioId;

    @NotBlank
    private String nome;

    private String telefone;
    private String email;
    private String documento;

    @Column(length = 500)
    private String endereco;

    @Column(length = 1000)
    private String observacoes;

    /** "ativo" ou "inativo" — nível de projeto de estudo, sem enum à parte. */
    private String status = "ativo";

    private LocalDate criadoEm = LocalDate.now();
}
