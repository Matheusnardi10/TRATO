package com.trato.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificacoes")
@Getter
@Setter
@NoArgsConstructor
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long usuarioId;

    /** success | info | warning | danger */
    private String tipo = "info";

    private String titulo;

    @Column(length = 1000)
    private String texto;

    private LocalDateTime data = LocalDateTime.now();
    private boolean lida = false;

    /** Chave única usada para não duplicar a mesma notificação automática
     *  (ex.: "pagamento-atrasado-42") — mesma ideia do NotificationService
     *  original (criarSeNaoExiste). */
    @Column(unique = true)
    private String chave;
}
