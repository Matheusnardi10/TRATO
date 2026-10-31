package com.trato.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "servicos")
@Getter
@Setter
@NoArgsConstructor
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;

    @Column(nullable = false)
    private Long usuarioId;

    /** Preenchido quando o serviço nasce de um contrato (ver
     *  ContratoService.criarServico); fica null para serviços criados
     *  diretamente de um orçamento aprovado. */
    private Long contratoId;

    private Long orcamentoId;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @NotBlank
    private String titulo;

    private String nicho;

    private LocalDate data;
    private LocalTime hora;
    private double duracaoHoras = 0;

    private double valor = 0;
    private double custoPrevisto = 0;

    /** Sempre recalculado no backend como a soma das despesas do serviço
     *  (ver ServicoService.recalcularCustoReal) — nunca confia em valor
     *  enviado diretamente pelo frontend para este campo. */
    private double custoReal = 0;

    private double horasTrabalhadas = 0;

    /** agendado | em_andamento | pausado | concluido | cancelado */
    private String status = "agendado";
}
