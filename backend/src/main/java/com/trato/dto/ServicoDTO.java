package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServicoDTO {
    private Long id;
    private String numero;
    private Long contratoId;
    private Long orcamentoId;
    private Long clienteId;
    private String clienteNome;
    private String titulo;
    private String nicho;
    private LocalDate data;
    private LocalTime hora;
    private double duracaoHoras;
    private double valor;
    private double custoPrevisto;
    private double custoReal;
    private double horasTrabalhadas;
    private String status;
}
