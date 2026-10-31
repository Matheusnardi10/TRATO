package com.trato.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "despesas")
@Getter
@Setter
@NoArgsConstructor
public class Despesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    /** material | combustivel | alimentacao | maoDeObra | pedagio |
     *  estacionamento | ferramentas | outros */
    @NotBlank
    private String categoria;

    private String descricao;
    private double valor = 0;
    private LocalDate data = LocalDate.now();
}
