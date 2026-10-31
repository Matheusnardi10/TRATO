package com.trato.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "orcamentos")
@Getter
@Setter
@NoArgsConstructor
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Número sequencial de exibição (ex.: "001"), por usuário — gerado no service. */
    private String numero;

    @Column(nullable = false)
    private Long usuarioId;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @NotBlank
    private String titulo;

    @Column(length = 2000)
    private String descricao;

    /** id de um Nicho (fotografo, eletricista, designer, etc. — ver nichos.ts). */
    private String nicho;

    private LocalDate dataPrevista;
    private String prazoEstimado;
    private String formaPagamento;
    private LocalDate validade;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemOrcamento> itens = new ArrayList<>();

    @Embedded
    private CustosOrcamento custos = new CustosOrcamento();

    /** Margem desejada (%) — o backend recalcula este valor a partir do
     *  valor final e do custo total sempre que salva (ver OrcamentoService). */
    private double margem = 40;

    /** Preço final cobrado do cliente. */
    private double valor = 0;

    /** rascunho | enviado | aguardando | aprovado | recusado | expirado */
    private String status = "rascunho";

    @ElementCollection
    @CollectionTable(name = "orcamento_campos_nicho", joinColumns = @JoinColumn(name = "orcamento_id"))
    @MapKeyColumn(name = "chave")
    @Column(name = "valor", length = 1000)
    private Map<String, String> camposNicho = new HashMap<>();

    private LocalDate criadoEm = LocalDate.now();
}
