package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContratoDTO {
    private Long id;
    private String numero;
    private Long orcamentoId;
    private Long clienteId;
    private String clienteNome;
    private String nicho;
    private String titulo;
    private double valor;
    private double valorTotal;
    private String status;
    private LocalDate dataInicio;
    private List<ClausulaDTO> clausulas;
    private List<AditivoDTO> aditivos;
    private LocalDate criadoEm;
    private String tituloDocumento;
    private String versaoModelos;
    private String cabecalho;
    private String assinatura;
    private String avisoLegal;
    private Map<String, String> dados;
    private List<CampoDTO> campos;
    private List<String> pendentes;
    /** Link público que o cliente recebe por e-mail (null até o primeiro envio). */
    private String linkAceite;
    private LocalDateTime enviadoEm;
    private String enviadoPara;
    private LocalDateTime aprovadoEm;
    /** Mensagem para o toast após o envio (ex.: e-mail não configurado). */
    private String mensagem;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CampoDTO {
        private String chave;
        private String rotulo;
        private String tipo;
        private boolean obrigatorio;
        private List<String> opcoes;
        private String grupo;
        private String valor;
        private boolean pendente;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClausulaDTO {
        private Long id;
        private int numero;
        private String titulo;
        private String texto;
        private String baseLegal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AditivoDTO {
        private Long id;
        private String numero;
        private String tipo;
        private String descricao;
        private double valor;
        private LocalDate data;
        private String condicoes;
    }
}
