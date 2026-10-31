package com.trato.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clausulas_contrato")
@Getter
@Setter
@NoArgsConstructor
public class ClausulaContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contrato_id")
    private Contrato contrato;

    private int numero;
    private String titulo;

    @Column(length = 4000)
    private String texto;

    /** Fundamento legal da cláusula (vem do modelo do advogado). */
    @Column(length = 500)
    private String baseLegal;
}
