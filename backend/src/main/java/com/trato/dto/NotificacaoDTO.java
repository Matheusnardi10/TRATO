package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoDTO {
    private Long id;
    private String tipo;
    private String titulo;
    private String texto;
    private LocalDateTime data;
    private boolean lida;
}
