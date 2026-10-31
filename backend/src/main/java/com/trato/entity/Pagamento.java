package com.trato.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "pagamentos")
@Getter
@Setter
@NoArgsConstructor
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    private double valorTotal = 0;
    private double valorRecebido = 0;
    private String forma = "A combinar";

    private LocalDate dataPrevista;
    private LocalDate dataRecebida;

    /** pendente | parcial | pago | atrasado — sempre recalculado no backend
     *  (ver PagamentoService.statusAtual), nunca recebido pronto do frontend. */
    private String status = "pendente";
}
