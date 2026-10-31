package com.trato.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trato.entity.Negocio;
import com.trato.entity.Usuario;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Modelos de contrato elaborados com o advogado (resources/contratos/modelos_contratos.json).
 *
 * O arquivo descreve: as cláusulas comuns, a ordem de montagem, os campos que o
 * usuário preenche, e as cláusulas/campos específicos de cada nicho. Este serviço
 * só LÊ o JSON e monta o texto — não inventa nem altera cláusulas. Para trocar um
 * texto jurídico, basta editar o JSON.
 *
 * Sintaxe suportada nos textos: {{chave}}, {{defaults.x}} e {{campo ? 'A' : 'B'}}.
 * Condições das cláusulas: chave == 'valor', chave == true, chave != 'valor'.
 */
@Service
public class ModeloContratoService {

    /** Campo de formulário descrito no modelo. */
    public record Campo(String chave, String rotulo, String tipo, boolean obrigatorio,
                        List<String> opcoes, String padrao, String grupo) {}

    /** Campo + valor atual + se está pendente (obrigatório vazio ou inválido). */
    public record CampoValor(String chave, String rotulo, String tipo, boolean obrigatorio,
                             List<String> opcoes, String grupo, String valor, boolean pendente) {}

    public record ClausulaRenderizada(String titulo, String texto, String baseLegal) {}

    public record Documento(String tituloDocumento, List<String> cabecalho, List<ClausulaRenderizada> clausulas) {}

    /** Nome usado no projeto -> id usado no JSON do advogado. */
    private static final Map<String, String> IDS_NICHO = Map.of(
            "ar-condicionado", "ar_condicionado",
            "tecnico", "tecnico_manutencao",
            "social-media", "social_media",
            "geral", "prestador_geral");

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{([^}]+)}}");
    private static final Pattern TERNARIO = Pattern.compile("^(.+?)\\s*\\?\\s*'(.*)'\\s*:\\s*'(.*)'$", Pattern.DOTALL);
    private static final Pattern CONDICAO = Pattern.compile("^(\\S+)\\s*(==|!=)\\s*(.+)$");

    private final JsonNode raiz;
    private final Map<String, String> padroesSistema = new HashMap<>();

    public ModeloContratoService() {
        try (InputStream in = new ClassPathResource("contratos/modelos_contratos.json").getInputStream()) {
            this.raiz = new ObjectMapper().readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler contratos/modelos_contratos.json", e);
        }
        raiz.path("defaults").fields().forEachRemaining(e -> padroesSistema.put("defaults." + e.getKey(), e.getValue().asText()));
    }

    public String versaoModelos() {
        return raiz.path("meta").path("versao_modelos").asText();
    }

    public String avisoLegal() {
        return raiz.path("meta").path("aviso_legal").asText();
    }

    /* ---------------------------------------------------------------- nichos */

    private JsonNode nicho(String nichoProjeto) {
        String id = IDS_NICHO.getOrDefault(nichoProjeto == null ? "outro" : nichoProjeto, nichoProjeto);
        JsonNode escolhido = null;
        JsonNode outro = null;
        for (JsonNode n : raiz.path("nichos")) {
            if (n.path("nicho_id").asText().equals(id)) escolhido = n;
            if (n.path("nicho_id").asText().equals("outro")) outro = n;
        }
        return escolhido != null ? escolhido : outro;
    }

    public String sugestaoDescricao(String nichoProjeto) {
        return nicho(nichoProjeto).path("sugestao_descricao_servico").asText();
    }

    /* ---------------------------------------------------------------- campos */

    private Campo lerCampo(JsonNode c, String grupoFixo) {
        List<String> opcoes = new ArrayList<>();
        c.path("opcoes").forEach(o -> opcoes.add(o.asText()));
        String chave = c.path("chave").asText();
        String grupo = grupoFixo != null ? grupoFixo : (chave.startsWith("contratante.") ? "contratante" : "contrato");
        String padrao = c.has("default") && !c.get("default").isNull() ? c.get("default").asText() : null;
        return new Campo(chave, c.path("rotulo").asText(), c.path("tipo").asText(),
                c.path("obrigatorio").asBoolean(false), opcoes, padrao, grupo);
    }

    /** Campos que o usuário pode editar: comuns + específicos do nicho (nessa ordem). */
    public List<Campo> campos(String nichoProjeto) {
        List<Campo> lista = new ArrayList<>();
        for (JsonNode c : raiz.path("campos_comuns")) {
            if (c.path("editavel_pelo_usuario").asBoolean(false)) lista.add(lerCampo(c, null));
        }
        for (JsonNode c : nicho(nichoProjeto).path("campos_especificos")) {
            lista.add(lerCampo(c, "especifico"));
        }
        return lista;
    }

    /** Tipo de cada chave (inclusive as calculadas), usado para formatar o valor no texto. */
    private Map<String, String> tipos(String nichoProjeto) {
        Map<String, String> tipos = new HashMap<>();
        for (JsonNode c : raiz.path("campos_comuns")) tipos.put(c.path("chave").asText(), c.path("tipo").asText());
        for (JsonNode c : nicho(nichoProjeto).path("campos_especificos")) tipos.put(c.path("chave").asText(), c.path("tipo").asText());
        return tipos;
    }

    private Map<String, String> rotulos(String nichoProjeto) {
        Map<String, String> r = new HashMap<>();
        for (JsonNode c : raiz.path("campos_comuns")) r.put(c.path("chave").asText(), c.path("rotulo").asText());
        for (JsonNode c : nicho(nichoProjeto).path("campos_especificos")) r.put(c.path("chave").asText(), c.path("rotulo").asText());
        return r;
    }

    /* -------------------------------------------------------------- contexto */

    private static boolean vazio(String s) {
        return s == null || s.isBlank();
    }

    /**
     * Junta tudo o que os textos podem referenciar: os dados digitados, os padrões
     * dos campos vazios, os valores padrão do sistema (defaults.*) e os campos
     * calculados (endereço completo, valor por extenso, dados do prestador...).
     */
    public Map<String, String> contexto(String nichoProjeto, Map<String, String> dados, Usuario contratado) {
        Map<String, String> ctx = new HashMap<>(padroesSistema);
        List<Campo> campos = campos(nichoProjeto);

        for (Campo c : campos) {
            String v = dados == null ? null : dados.get(c.chave());
            if (!vazio(v)) ctx.put(c.chave(), v.trim());
        }
        // padrões dos campos (podem referenciar outros campos, ex.: {{contratante.cidade}})
        for (Campo c : campos) {
            if (vazio(ctx.get(c.chave())) && !vazio(c.padrao())) {
                ctx.put(c.chave(), substituir(c.padrao(), ctx, Map.of(), Map.of(), false));
            }
        }

        // ---- calculados do CONTRATANTE
        boolean pj = "PJ".equals(ctx.get("contratante.tipo_pessoa"));
        ctx.put("contratante.documento_tipo", pj ? "CNPJ" : "CPF");
        ctx.put("contratante.endereco_completo", enderecoContratante(ctx));
        ctx.put("contrato.valor_total_extenso", extensoDoValor(ctx.get("contrato.valor_total")));

        // ---- dados do CONTRATADO (perfil do usuário)
        Negocio n = contratado.getNegocio() == null ? new Negocio() : contratado.getNegocio();
        String docPrestador = n.getDocumento() == null ? "" : n.getDocumento();
        int digitos = DocumentoValidador.somenteDigitos(docPrestador).length();
        ctx.put("contratado.nome", !vazio(contratado.getNomeProfissional()) ? contratado.getNomeProfissional() : contratado.getNome());
        ctx.put("contratado.documento", docPrestador);
        ctx.put("contratado.documento_tipo", digitos == 14 ? "CNPJ" : "CPF");
        ctx.put("contratado.endereco_completo", n.getEndereco() == null ? "" : n.getEndereco());
        ctx.put("contratado.email", !vazio(n.getEmailProfissional()) ? n.getEmailProfissional() : contratado.getEmail());
        ctx.put("contratado.telefone", !vazio(n.getTelefoneProfissional()) ? n.getTelefoneProfissional() : contratado.getTelefone());

        // ---- assinatura
        ctx.put("contrato.cidade_assinatura", n.getCidade() == null ? "" : n.getCidade());
        ctx.put("contrato.data_assinatura", LocalDate.now().format(DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", PT_BR)));
        return ctx;
    }

    private String enderecoContratante(Map<String, String> ctx) {
        String[] obrigatorios = {"logradouro", "numero", "bairro", "cidade", "uf", "cep"};
        for (String k : obrigatorios) if (vazio(ctx.get("contratante." + k))) return "";
        String complemento = vazio(ctx.get("contratante.complemento")) ? "" : ", " + ctx.get("contratante.complemento");
        return ctx.get("contratante.logradouro") + ", " + ctx.get("contratante.numero") + complemento + " – "
                + ctx.get("contratante.bairro") + ", " + ctx.get("contratante.cidade") + "/" + ctx.get("contratante.uf")
                + ", CEP " + ctx.get("contratante.cep");
    }

    private String extensoDoValor(String valor) {
        if (vazio(valor)) return "";
        try {
            return Extenso.reais(new BigDecimal(valor.trim().replace(",", ".")).doubleValue());
        } catch (NumberFormatException e) {
            return "";
        }
    }

    /* ---------------------------------------------------------- pendências */

    public List<CampoValor> camposComValores(String nichoProjeto, Map<String, String> ctx) {
        List<CampoValor> lista = new ArrayList<>();
        for (Campo c : campos(nichoProjeto)) {
            String valor = ctx.getOrDefault(c.chave(), "");
            boolean pendente = false;
            if (c.obrigatorio() && !"booleano".equals(c.tipo())) pendente = vazio(valor);
            if ("contratante.documento".equals(c.chave()) && !vazio(valor) && !DocumentoValidador.valido(valor)) pendente = true;
            lista.add(new CampoValor(c.chave(), c.rotulo(), c.tipo(), c.obrigatorio(), c.opcoes(), c.grupo(), valor, pendente));
        }
        return lista;
    }

    /** Lista legível do que ainda falta preencher antes de enviar o contrato para aceite. */
    public List<String> pendentes(List<CampoValor> campos, Map<String, String> ctx) {
        List<String> faltas = new ArrayList<>();
        for (CampoValor c : campos) {
            if (!c.pendente()) continue;
            boolean invalido = "contratante.documento".equals(c.chave()) && !vazio(c.valor());
            faltas.add(invalido ? c.rotulo() + " (inválido)" : c.rotulo());
        }
        if (vazio(ctx.get("contratado.documento")) || !DocumentoValidador.valido(ctx.get("contratado.documento"))) {
            faltas.add("Seu CPF/CNPJ válido (Configurações → Negócio)");
        }
        if (vazio(ctx.get("contratado.endereco_completo"))) faltas.add("Seu endereço (Configurações → Negócio)");
        if (vazio(ctx.get("contrato.cidade_assinatura"))) faltas.add("Sua cidade (Configurações → Negócio)");
        return faltas;
    }

    /* ------------------------------------------------------------ renderizar */

    public Documento renderizar(String nichoProjeto, Map<String, String> ctx) {
        JsonNode nicho = nicho(nichoProjeto);
        Map<String, String> tipos = tipos(nichoProjeto);
        Map<String, String> rotulos = rotulos(nichoProjeto);

        List<String> cabecalho = new ArrayList<>();
        raiz.path("cabecalho_partes").forEach(p -> cabecalho.add(substituir(p.asText(), ctx, tipos, rotulos, true)));

        Map<String, JsonNode> comuns = new LinkedHashMap<>();
        raiz.path("clausulas_comuns").forEach(c -> comuns.put(c.path("id").asText(), c));

        List<ClausulaRenderizada> clausulas = new ArrayList<>();
        for (JsonNode item : raiz.path("ordem_renderizacao")) {
            String id = item.asText();
            if (id.equals("<clausulas_especificas_do_nicho>")) {
                nicho.path("clausulas_especificas").forEach(c -> adicionar(clausulas, c, ctx, tipos, rotulos));
            } else if (comuns.containsKey(id)) {
                adicionar(clausulas, comuns.get(id), ctx, tipos, rotulos);
            }
        }
        return new Documento(nicho.path("titulo_documento").asText(), cabecalho, clausulas);
    }

    public String textoAssinatura(String nichoProjeto, Map<String, String> ctx) {
        return substituir(raiz.path("bloco_assinatura").path("texto").asText(), ctx, tipos(nichoProjeto), rotulos(nichoProjeto), true);
    }

    private void adicionar(List<ClausulaRenderizada> destino, JsonNode c, Map<String, String> ctx,
                           Map<String, String> tipos, Map<String, String> rotulos) {
        if (c.has("condicao") && !avaliarCondicao(c.get("condicao").asText(), ctx)) return;
        List<String> paragrafos = new ArrayList<>();
        c.path("paragrafos").forEach(p -> paragrafos.add(substituir(p.asText(), ctx, tipos, rotulos, true)));
        List<String> base = new ArrayList<>();
        c.path("base_legal").forEach(b -> base.add(b.asText()));
        destino.add(new ClausulaRenderizada(c.path("titulo").asText(), String.join("\n\n", paragrafos), String.join("; ", base)));
    }

    /* ------------------------------------------------------ texto / valores */

    private boolean avaliarCondicao(String condicao, Map<String, String> ctx) {
        Matcher m = CONDICAO.matcher(condicao.trim());
        if (!m.matches()) return true;
        String atual = ctx.getOrDefault(m.group(1), "");
        String esperado = m.group(3).trim();
        if (esperado.startsWith("'") && esperado.endsWith("'") && esperado.length() >= 2) {
            esperado = esperado.substring(1, esperado.length() - 1);
        } else if (esperado.equals("true") || esperado.equals("false")) {
            if (atual.isBlank()) atual = "false";
        }
        boolean igual = atual.equals(esperado);
        return m.group(2).equals("==") == igual;
    }

    /** Troca cada {{...}} pelo valor. Campo vazio vira "[Rótulo]" quando marcarFaltas = true. */
    private String substituir(String texto, Map<String, String> ctx, Map<String, String> tipos,
                              Map<String, String> rotulos, boolean marcarFaltas) {
        Matcher m = PLACEHOLDER.matcher(texto);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String expr = m.group(1).trim();
            String valor;
            Matcher t = TERNARIO.matcher(expr);
            if (t.matches()) {
                valor = "true".equals(ctx.get(t.group(1).trim())) ? t.group(2) : t.group(3);
            } else {
                String bruto = ctx.get(expr);
                if (vazio(bruto)) {
                    valor = marcarFaltas ? "[" + rotulos.getOrDefault(expr, expr) + "]" : "";
                } else {
                    valor = formatar(bruto, tipos.get(expr));
                }
            }
            m.appendReplacement(sb, Matcher.quoteReplacement(valor));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String formatar(String bruto, String tipo) {
        if (tipo == null) return bruto;
        try {
            switch (tipo) {
                case "moeda":
                    DecimalFormat df = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(PT_BR));
                    return df.format(new BigDecimal(bruto.replace(",", ".")));
                case "data":
                    return LocalDate.parse(bruto).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                case "datahora":
                    return LocalDateTime.parse(bruto).format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"));
                case "numero":
                    return new BigDecimal(bruto.replace(",", ".")).stripTrailingZeros().toPlainString();
                default:
                    return bruto;
            }
        } catch (RuntimeException e) {
            return bruto;
        }
    }
}
