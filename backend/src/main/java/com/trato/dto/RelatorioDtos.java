package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class RelatorioDtos {

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ServicoRentavelDTO {
        private String numero;
        private String titulo;
        private double valor;
        private double custoReal;
        private double lucroAtual;
        private double margem;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ClienteMovimentacaoDTO {
        private String nome;
        private long quantidade;
        private double total;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class StatusOrcamentoDTO {
        private String status;
        private long quantidade;
        private double valor;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class PrevistoRealizadoDTO {
        private String numero;
        private String titulo;
        private double previsto;
        private double real;
        private double diferenca;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class LucroPorHoraDTO {
        private String numero;
        private String titulo;
        private double horas;
        private double lucroPorHora;
    }
}
