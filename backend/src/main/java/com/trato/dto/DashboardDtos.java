package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DashboardDtos {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResumoMesDTO {
        private double faturamento;
        private double custos;
        private double lucro;
        private double margem;
        private long emAndamento;
        private double aReceber;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HistoricoMesDTO {
        private int mes;
        private int ano;
        private double faturamento;
        private double custos;
        private double lucro;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AlertaDTO {
        private String tipo;
        private String icone;
        private String titulo;
        private String texto;
    }
}
