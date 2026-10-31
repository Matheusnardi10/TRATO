package com.trato.service;

/** Validação de CPF/CNPJ com dígito verificador (exigida pelo modelo do advogado). */
public final class DocumentoValidador {

    private DocumentoValidador() {}

    public static String somenteDigitos(String texto) {
        return texto == null ? "" : texto.replaceAll("\\D", "");
    }

    public static boolean valido(String documento) {
        String d = somenteDigitos(documento);
        if (d.length() == 11) return cpfValido(d);
        if (d.length() == 14) return cnpjValido(d);
        return false;
    }

    private static boolean todosIguais(String d) {
        return d.chars().distinct().count() == 1;
    }

    private static boolean cpfValido(String d) {
        if (todosIguais(d)) return false;
        return digito(d, 9, 10) == d.charAt(9) - '0' && digito(d, 10, 11) == d.charAt(10) - '0';
    }

    private static int digito(String d, int tamanho, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) soma += (d.charAt(i) - '0') * (pesoInicial - i);
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    private static boolean cnpjValido(String d) {
        if (todosIguais(d)) return false;
        int[] p1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] p2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return digitoCnpj(d, p1) == d.charAt(12) - '0' && digitoCnpj(d, p2) == d.charAt(13) - '0';
    }

    private static int digitoCnpj(String d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) soma += (d.charAt(i) - '0') * pesos[i];
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
