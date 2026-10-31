package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrcamentoDTO {
    private Long id;
    private String numero;
    private Long clienteId;
    private String clienteNome;
    private String titulo;
    private String descricao;
    private String nicho;
    private LocalDate dataPrevista;
    private String prazoEstimado;
    private String formaPagamento;
    private LocalDate validade;
    private List<ItemDTO> itens;
    private Map<String, Double> custos;
    private double margem;
    private double valor;
    private String status;
    private Map<String, String> camposNicho;
    private LocalDate criadoEm;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDTO {
        private Long id;
        private String descricao;
        private double quantidade;
        private double valorUnitario;
    }
}
