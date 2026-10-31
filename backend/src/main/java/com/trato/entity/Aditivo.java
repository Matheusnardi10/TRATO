package com.trato.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "aditivos")
@Getter
@Setter
@NoArgsConstructor
public class Aditivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contrato_id")
    private Contrato contrato;

    private String numero;

    /** data | valor | prazo | servico | outras */
    private String tipo = "valor";

    @Column(length = 1000)
    private String descricao;

    private double valor = 0;
    private LocalDate data = LocalDate.now();

    @Column(length = 1000)
    private String condicoes;
}
