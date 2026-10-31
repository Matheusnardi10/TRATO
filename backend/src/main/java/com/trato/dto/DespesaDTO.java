package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespesaDTO {
    private Long id;
    private Long servicoId;
    private String categoria;
    private String descricao;
    private double valor;
    private LocalDate data;
}
