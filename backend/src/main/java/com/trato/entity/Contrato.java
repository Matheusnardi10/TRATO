package com.trato.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "contratos")
@Getter
@Setter
@NoArgsConstructor
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;

    @Column(nullable = false)
    private Long usuarioId;

    private Long orcamentoId;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    private String nicho;
    private String titulo;
    private double valor = 0;

    /** rascunho | aguardando | ativo | concluido | cancelado */
    private String status = "rascunho";

    private LocalDate dataInicio;

    @OneToMany(mappedBy = "contrato", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "ordem")
    private List<ClausulaContrato> clausulas = new ArrayList<>();

    @OneToMany(mappedBy = "contrato", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aditivo> aditivos = new ArrayList<>();

    private LocalDate criadoEm = LocalDate.now();

    /** Título do documento (ex.: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS"). */
    @Column(length = 300)
    private String tituloDocumento;

    /** Versão dos modelos do advogado usada para gerar este contrato. */
    private String versaoModelos;

    /** Qualificação das partes (texto que vem antes das cláusulas). */
    @Column(length = 4000)
    private String cabecalho;

    /** Texto de fechamento: cidade e data da assinatura. */
    @Column(length = 1000)
    private String assinatura;

    /** Valores preenchidos pelo usuário (chave do modelo -> valor). */
    @ElementCollection
    @CollectionTable(name = "contrato_dados", joinColumns = @JoinColumn(name = "contrato_id"))
    @MapKeyColumn(name = "chave")
    @Column(name = "valor", length = 2000)
    private Map<String, String> dados = new HashMap<>();

    /** Código aleatório do link que o cliente recebe por e-mail para aprovar
     *  (página pública /aprovar-contrato/{token}, sem login). */
    @Column(unique = true, length = 64)
    private String tokenAceite;

    private LocalDateTime enviadoEm;
    private String enviadoPara;

    /** Preenchidos quando o próprio cliente aprova pelo link. */
    private LocalDateTime aprovadoEm;
    private String aprovadoIp;

    public double valorTotal() {
        double totalAditivos = aditivos.stream().mapToDouble(Aditivo::getValor).sum();
        return valor + totalAditivos;
    }
}
