package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public class FinanceiroDtos {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResumoFinanceiroDTO {
        private double receitas;
        private double despesas;
        private double lucro;
        private double aReceber;
        private double recebidoNoPeriodo;
        private double saldo;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoriaDespesaDTO {
        private String id;
        private String nome;
        private String emoji;
        private double valor;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PontoFluxoCaixaDTO {
        private LocalDate data;
        private double entradas;
        private double saidas;
        private double saldo;
    }
}
