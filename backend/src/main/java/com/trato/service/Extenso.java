package com.trato.service;

import java.util.ArrayList;
import java.util.List;

/** Escreve valores em reais por extenso (ex.: 1800.50 -> "mil e oitocentos reais e cinquenta centavos"). */
public final class Extenso {

    private static final String[] UNIDADES = {"zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito",
            "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"};
    private static final String[] DEZENAS = {"", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta",
            "setenta", "oitenta", "noventa"};
    private static final String[] CENTENAS = {"", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
            "seiscentos", "setecentos", "oitocentos", "novecentos"};

    private Extenso() {}

    private static String ate999(int n) {
        if (n == 0) return "";
        if (n == 100) return "cem";
        List<String> partes = new ArrayList<>();
        int c = n / 100;
        int r = n % 100;
        if (c > 0) partes.add(CENTENAS[c]);
        if (r > 0) {
            if (r < 20) {
                partes.add(UNIDADES[r]);
            } else {
                partes.add(DEZENAS[r / 10]);
                if (r % 10 > 0) partes.add(UNIDADES[r % 10]);
            }
        }
        return String.join(" e ", partes);
    }

    public static String inteiro(long n) {
        if (n == 0) return "zero";
        long bilhoes = n / 1_000_000_000L;
        long milhoes = (n / 1_000_000L) % 1000;
        long milhares = (n / 1000L) % 1000;
        long resto = n % 1000;

        List<String> grupos = new ArrayList<>();
        if (bilhoes > 0) grupos.add(ate999((int) bilhoes) + (bilhoes == 1 ? " bilhão" : " bilhões"));
        if (milhoes > 0) grupos.add(ate999((int) milhoes) + (milhoes == 1 ? " milhão" : " milhões"));
        if (milhares > 0) grupos.add(milhares == 1 ? "mil" : ate999((int) milhares) + " mil");
        if (resto > 0) grupos.add(ate999((int) resto));

        StringBuilder sb = new StringBuilder(grupos.get(0));
        for (int i = 1; i < grupos.size(); i++) {
            boolean ultimo = i == grupos.size() - 1;
            boolean usaE = ultimo && (resto < 100 || resto % 100 == 0);
            sb.append(usaE ? " e " : " ").append(grupos.get(i));
        }
        return sb.toString();
    }

    public static String reais(double valor) {
        long totalCentavos = Math.round(valor * 100);
        long reais = totalCentavos / 100;
        long centavos = totalCentavos % 100;
        String parteReais = reais == 0 ? "" : inteiro(reais) + (reais == 1 ? " real" : " reais");
        String parteCentavos = centavos == 0 ? "" : inteiro(centavos) + (centavos == 1 ? " centavo" : " centavos");
        if (parteReais.isEmpty() && parteCentavos.isEmpty()) return "zero reais";
        if (parteReais.isEmpty()) return parteCentavos;
        if (parteCentavos.isEmpty()) return parteReais;
        return parteReais + " e " + parteCentavos;
    }
}
