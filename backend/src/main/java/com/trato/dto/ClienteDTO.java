package com.trato.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nome;
    private String telefone;
    private String email;
    private String documento;
    private String endereco;
    private String observacoes;
    private String status;
    private LocalDate criadoEm;
}
