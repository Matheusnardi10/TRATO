package com.trato.entity;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Mesmas categorias de Data.CATEGORIAS_DESPESA do projeto original,
 *  gravadas como colunas simples (nível de estudo — sem tabela à parte). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class CustosOrcamento {
    private double material = 0;
    private double combustivel = 0;
    private double alimentacao = 0;
    private double maoDeObra = 0;
    private double pedagio = 0;
    private double estacionamento = 0;
    private double ferramentas = 0;
    private double outros = 0;

    public double total() {
        return material + combustivel + alimentacao + maoDeObra + pedagio + estacionamento + ferramentas + outros;
    }
}
