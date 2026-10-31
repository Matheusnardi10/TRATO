package com.trato.entity;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Dados do negócio do profissional — tela de Configurações. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class Negocio {
    private String cidade = "";
    private String logo = "";
    private String telefoneProfissional = "";
    private String emailProfissional = "";
    private String pix = "";
    private String formaPagamentoPadrao = "";
    private String prazoPadrao = "";
    /** CPF ou CNPJ do prestador — vai no cabeçalho e na assinatura dos contratos. */
    private String documento = "";
    /** Endereço completo do prestador (rua, número, bairro, cidade/UF, CEP). */
    private String endereco = "";
}
