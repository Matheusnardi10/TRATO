package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagamentoDTO {
    private Long id;
    private Long servicoId;
    private Long clienteId;
    private double valorTotal;
    private double valorRecebido;
    private String forma;
    private LocalDate dataPrevista;
    private LocalDate dataRecebida;
    private String status;
}
