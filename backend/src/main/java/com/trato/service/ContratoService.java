package com.trato.service;

import com.trato.dto.ContratoDTO;
import com.trato.dto.ContratoDTO.AditivoDTO;
import com.trato.dto.ContratoDTO.ClausulaDTO;
import com.trato.dto.ServicoDTO;
import com.trato.entity.*;
import com.trato.repository.ContratoRepository;
import com.trato.repository.OrcamentoRepository;
import com.trato.repository.UsuarioRepository;
import com.trato.dto.ContratoDTO.CampoDTO;
import com.trato.dto.ContratoPublicoDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Contratos — o texto vem dos modelos elaborados com o advogado
 * (ModeloContratoService). O usuário preenche os dados faltantes e o texto
 * é remontado; o envio para aceite só é liberado sem pendências.
 */
@Service
@Transactional
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final ServicoService servicoService;
    private final NotificacaoService notificacaoService;
    private final UsuarioRepository usuarioRepository;
    private final ModeloContratoService modelos;
    private final EmailService emailService;
    private final String frontendUrl;

    public ContratoService(ContratoRepository contratoRepository, OrcamentoRepository orcamentoRepository,
                            ServicoService servicoService, NotificacaoService notificacaoService,
                            UsuarioRepository usuarioRepository, ModeloContratoService modelos,
                            EmailService emailService, @Value("${trato.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.emailService = emailService;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.usuarioRepository = usuarioRepository;
        this.modelos = modelos;
        this.contratoRepository = contratoRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.servicoService = servicoService;
        this.notificacaoService = notificacaoService;
    }

    public List<ContratoDTO> listar(Long usuarioId, String status) {
        List<Contrato> lista = (status == null || status.isBlank() || status.equals("todos"))
                ? contratoRepository.findByUsuarioId(usuarioId)
                : contratoRepository.findByUsuarioIdAndStatus(usuarioId, status);
        return lista.stream().map(this::paraDTO).toList();
    }

    public ContratoDTO buscar(Long usuarioId, Long id) {
        return paraDTO(buscarEntidade(usuarioId, id));
    }

    public Contrato buscarEntidade(Long usuarioId, Long id) {
        Contrato c = contratoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado."));
        if (!c.getUsuarioId().equals(usuarioId)) throw new EntityNotFoundException("Contrato não encontrado.");
        return c;
    }

    /** Gera o contrato a partir de um orçamento (de preferência aprovado),
     *  usando o modelo de cláusulas do nicho. Se já existir um contrato
     *  para esse orçamento, devolve o existente em vez de duplicar. */
    public ContratoDTO gerarDoOrcamento(Long usuarioId, Long orcamentoId) {
        var existente = contratoRepository.findByOrcamentoId(orcamentoId);
        if (existente.isPresent()) return paraDTO(existente.get());

        Orcamento orcamento = orcamentoRepository.findById(orcamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Orçamento não encontrado."));
        if (!orcamento.getUsuarioId().equals(usuarioId)) throw new EntityNotFoundException("Orçamento não encontrado.");

        Contrato contrato = new Contrato();
        contrato.setUsuarioId(usuarioId);
        contrato.setNumero(String.format("%03d", contratoRepository.countByUsuarioId(usuarioId) + 1));
        contrato.setOrcamentoId(orcamento.getId());
        contrato.setCliente(orcamento.getCliente());
        contrato.setNicho(orcamento.getNicho());
        contrato.setTitulo(orcamento.getTitulo());
        contrato.setValor(orcamento.getValor());
        contrato.setStatus("rascunho");
        contrato.setDataInicio(orcamento.getDataPrevista());

        contrato.setDados(dadosIniciais(orcamento));
        renderizar(contrato);

        Contrato salvo = contratoRepository.save(contrato);
        notificacaoService.criar(usuarioId, "info", "Contrato gerado",
                "O contrato #" + salvo.getNumero() + " foi gerado a partir do orçamento #" + orcamento.getNumero() + ".", null);
        return paraDTO(salvo);
    }

    /** Envia (ou reenvia) o contrato por e-mail com o link de aprovação.
     *  O token é gerado no primeiro envio e mantido nos reenvios, para que
     *  links já enviados continuem funcionando. */
    public ContratoDTO enviarParaAceite(Long usuarioId, Long id) {
        Contrato c = buscarEntidade(usuarioId, id);
        if (!"rascunho".equals(c.getStatus()) && !"aguardando".equals(c.getStatus())) {
            throw new IllegalArgumentException("Só é possível enviar contratos em rascunho ou aguardando aceite.");
        }
        exigirSemPendencias(c);
        String email = emailDoCliente(c);
        if (email == null) {
            throw new IllegalArgumentException("Informe um e-mail válido do contratante para enviar o contrato.");
        }
        if (c.getTokenAceite() == null) c.setTokenAceite(UUID.randomUUID().toString());
        c.setStatus("aguardando");
        c.setEnviadoEm(LocalDateTime.now());
        c.setEnviadoPara(email);
        Contrato salvo = contratoRepository.save(c);

        // Se o envio falhar, a exceção desfaz a transação (o status volta ao anterior).
        boolean enviado = emailService.enviarContratoParaAprovacao(email, nomeDoCliente(c), nomeDoProfissional(c),
                c.getTitulo(), c.getNumero(), linkAceite(c));
        ContratoDTO dto = paraDTO(salvo);
        dto.setMensagem(enviado
                ? "Contrato enviado por e-mail para " + email + "."
                : "E-mail não configurado no servidor — use \"Copiar link\" e mande o link ao cliente.");
        return dto;
    }

    /* ---------------------------------------------- página pública (cliente) */

    public ContratoPublicoDTO buscarPublico(String token) {
        return paraPublico(buscarPorToken(token));
    }

    /** O cliente clicou em "Aprovar" no link do e-mail: o contrato fica ativo
     *  na hora e o profissional recebe uma notificação. */
    public ContratoPublicoDTO aprovarPeloCliente(String token, String ip) {
        Contrato c = buscarPorToken(token);
        if ("ativo".equals(c.getStatus()) || "concluido".equals(c.getStatus())) return paraPublico(c);
        if (!"aguardando".equals(c.getStatus())) {
            throw new IllegalArgumentException("Este contrato não está mais disponível para aprovação. Fale com o profissional.");
        }
        c.setAssinatura(modelos.textoAssinatura(c.getNicho(), contexto(c)));
        c.setStatus("ativo");
        c.setAprovadoEm(LocalDateTime.now());
        c.setAprovadoIp(ip);
        Contrato salvo = contratoRepository.save(c);
        notificacaoService.criar(c.getUsuarioId(), "info", "Contrato #" + c.getNumero() + " aprovado pelo cliente",
                nomeDoCliente(c) + " aprovou o contrato pelo link enviado por e-mail.", "contrato-aprovado-" + c.getId());
        return paraPublico(salvo);
    }

    private Contrato buscarPorToken(String token) {
        if (token == null || token.isBlank()) throw new EntityNotFoundException("Link inválido.");
        return contratoRepository.findByTokenAceite(token)
                .orElseThrow(() -> new EntityNotFoundException("Link inválido ou contrato removido."));
    }

    private String linkAceite(Contrato c) {
        return c.getTokenAceite() == null ? null : frontendUrl + "/aprovar-contrato/" + c.getTokenAceite();
    }

    private String emailDoCliente(Contrato c) {
        String email = c.getDados().get("contratante.email");
        if (email == null || email.isBlank()) email = c.getCliente().getEmail();
        if (email == null) return null;
        email = email.trim();
        return email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") ? email : null;
    }

    private String nomeDoCliente(Contrato c) {
        String nome = c.getDados().get("contratante.nome");
        return nome == null || nome.isBlank() ? c.getCliente().getNome() : nome;
    }

    private String nomeDoProfissional(Contrato c) {
        Usuario u = usuarioRepository.findById(c.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        return u.getNomeProfissional() == null || u.getNomeProfissional().isBlank() ? u.getNome() : u.getNomeProfissional();
    }

    public ContratoDTO marcarAceito(Long usuarioId, Long id) {
        Contrato c = buscarEntidade(usuarioId, id);
        exigirSemPendencias(c);
        // a data de assinatura passa a ser a do aceite
        c.setAssinatura(modelos.textoAssinatura(c.getNicho(), contexto(c)));
        c.setStatus("ativo");
        return paraDTO(contratoRepository.save(c));
    }

    public ContratoDTO concluir(Long usuarioId, Long id) {
        Contrato c = buscarEntidade(usuarioId, id);
        c.setStatus("concluido");
        return paraDTO(contratoRepository.save(c));
    }

    public ContratoDTO cancelar(Long usuarioId, Long id) {
        Contrato c = buscarEntidade(usuarioId, id);
        c.setStatus("cancelado");
        return paraDTO(contratoRepository.save(c));
    }

    public void excluir(Long usuarioId, Long id) {
        contratoRepository.delete(buscarEntidade(usuarioId, id));
    }

    public ContratoDTO atualizarClausulas(Long usuarioId, Long id, List<ClausulaDTO> clausulas) {
        Contrato c = buscarEntidade(usuarioId, id);
        Map<Long, ClausulaContrato> existentes = new HashMap<>();
        c.getClausulas().forEach(cl -> existentes.put(cl.getId(), cl));
        for (ClausulaDTO dto : clausulas) {
            ClausulaContrato alvo = dto.getId() != null ? existentes.get(dto.getId()) : null;
            if (alvo != null) {
                alvo.setTitulo(dto.getTitulo());
                alvo.setTexto(dto.getTexto());
            }
        }
        return paraDTO(contratoRepository.save(c));
    }

    public ContratoDTO adicionarAditivo(Long usuarioId, Long id, AditivoDTO dados) {
        Contrato c = buscarEntidade(usuarioId, id);
        Aditivo aditivo = new Aditivo();
        aditivo.setContrato(c);
        aditivo.setNumero(String.format("%02d", c.getAditivos().size() + 1));
        aditivo.setTipo(dados.getTipo() == null || dados.getTipo().isBlank() ? "valor" : dados.getTipo());
        aditivo.setDescricao(dados.getDescricao());
        aditivo.setValor(dados.getValor());
        aditivo.setData(dados.getData() == null ? java.time.LocalDate.now() : dados.getData());
        aditivo.setCondicoes(dados.getCondicoes());
        c.getAditivos().add(aditivo);
        Contrato salvo = contratoRepository.save(c);
        notificacaoService.criar(usuarioId, "info", "Aditivo criado",
                "Aditivo #" + aditivo.getNumero() + " adicionado ao contrato #" + c.getNumero() + ".", null);
        return paraDTO(salvo);
    }

    public ContratoDTO removerAditivo(Long usuarioId, Long id, Long aditivoId) {
        Contrato c = buscarEntidade(usuarioId, id);
        c.getAditivos().removeIf(a -> a.getId().equals(aditivoId));
        return paraDTO(contratoRepository.save(c));
    }

    /** Cria o serviço a partir de um contrato ativo — mesmo fluxo manual
     *  que existia no botão "Criar serviço" da tela de contrato original. */
    public ServicoDTO criarServico(Long usuarioId, Long id, String data, String hora) {
        Contrato c = buscarEntidade(usuarioId, id);
        ServicoDTO dados = new ServicoDTO();
        dados.setContratoId(c.getId());
        dados.setOrcamentoId(c.getOrcamentoId());
        dados.setClienteId(c.getCliente().getId());
        dados.setTitulo(c.getTitulo());
        dados.setNicho(c.getNicho());
        dados.setData(data != null ? java.time.LocalDate.parse(data) : c.getDataInicio());
        dados.setHora(hora != null ? LocalTime.parse(hora) : LocalTime.of(9, 0));
        dados.setValor(c.valorTotal());
        dados.setCustoPrevisto(0);
        dados.setStatus("agendado");
        return servicoService.criar(usuarioId, dados);
    }

    /* ---------------------------------------------- modelos do advogado */

    /** Preenche o que já se sabe do cliente e do orçamento; o resto o usuário completa na tela. */
    private Map<String, String> dadosIniciais(Orcamento o) {
        Cliente cli = o.getCliente();
        Map<String, String> d = new HashMap<>();
        d.put("contratante.nome", cli.getNome());
        String doc = cli.getDocumento() == null ? "" : cli.getDocumento();
        d.put("contratante.tipo_pessoa", DocumentoValidador.somenteDigitos(doc).length() == 14 ? "PJ" : "PF");
        d.put("contratante.documento", doc);
        d.put("contratante.email", cli.getEmail());
        d.put("contratante.telefone", cli.getTelefone());
        d.put("contratante.logradouro", cli.getEndereco());
        d.put("servico.descricao", o.getDescricao() == null || o.getDescricao().length() < 20
                ? modelos.sugestaoDescricao(o.getNicho()) + (o.getTitulo() == null ? "" : " (" + o.getTitulo() + ")")
                : o.getDescricao());
        if (o.getDataPrevista() != null) d.put("contrato.data_inicio", o.getDataPrevista().toString());
        d.put("contrato.valor_total", String.valueOf(o.getValor()));
        if (o.getFormaPagamento() != null) d.put("pagamento.condicoes", o.getFormaPagamento());
        d.values().removeIf(v -> v == null || v.isBlank());
        return d;
    }

    private Map<String, String> contexto(Contrato c) {
        Usuario u = usuarioRepository.findById(c.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        return modelos.contexto(c.getNicho(), c.getDados(), u);
    }

    /** (Re)monta título, qualificação das partes, cláusulas e assinatura a partir do modelo. */
    private void renderizar(Contrato c) {
        Map<String, String> ctx = contexto(c);
        var doc = modelos.renderizar(c.getNicho(), ctx);
        c.setTituloDocumento(doc.tituloDocumento());
        c.setCabecalho(String.join("\n\n", doc.cabecalho()));
        c.setAssinatura(modelos.textoAssinatura(c.getNicho(), ctx));
        c.setVersaoModelos(modelos.versaoModelos());
        c.getClausulas().clear();
        int n = 0;
        for (var r : doc.clausulas()) {
            ClausulaContrato cl = new ClausulaContrato();
            cl.setContrato(c);
            cl.setNumero(++n);
            cl.setTitulo(r.titulo());
            cl.setTexto(r.texto());
            cl.setBaseLegal(r.baseLegal());
            c.getClausulas().add(cl);
        }
    }

    private void exigirSemPendencias(Contrato c) {
        Map<String, String> ctx = contexto(c);
        List<String> faltas = modelos.pendentes(modelos.camposComValores(c.getNicho(), ctx), ctx);
        if (!faltas.isEmpty()) {
            throw new IllegalArgumentException("Faltam dados no contrato: " + String.join(", ", faltas) + ".");
        }
    }

    /** Salva os campos digitados na tela e refaz o texto do contrato (só enquanto é rascunho). */
    public ContratoDTO atualizarDados(Long usuarioId, Long id, Map<String, String> novos) {
        Contrato c = buscarEntidade(usuarioId, id);
        if (!"rascunho".equals(c.getStatus())) {
            throw new IllegalArgumentException("Só é possível editar os dados de um contrato em rascunho.");
        }
        var permitidas = modelos.campos(c.getNicho()).stream().map(ModeloContratoService.Campo::chave).toList();
        for (var e : novos.entrySet()) {
            if (!permitidas.contains(e.getKey())) continue;
            String v = e.getValue() == null ? "" : e.getValue().trim();
            if (v.isEmpty()) c.getDados().remove(e.getKey()); else c.getDados().put(e.getKey(), v);
        }
        String total = c.getDados().get("contrato.valor_total");
        if (total != null) {
            try {
                double valor = Double.parseDouble(total.replace(",", "."));
                if (valor > 0) c.setValor(valor);
            } catch (NumberFormatException ignorado) { /* fica o valor anterior */ }
        }
        String inicio = c.getDados().get("contrato.data_inicio");
        if (inicio != null) {
            try { c.setDataInicio(java.time.LocalDate.parse(inicio)); } catch (RuntimeException ignorado) { /* idem */ }
        }
        renderizar(c);
        return paraDTO(contratoRepository.save(c));
    }

    private List<ClausulaDTO> clausulasDTO(Contrato c) {
        return c.getClausulas().stream()
                .map(cl -> new ClausulaDTO(cl.getId(), cl.getNumero(), cl.getTitulo(), cl.getTexto(), cl.getBaseLegal()))
                .toList();
    }

    private List<AditivoDTO> aditivosDTO(Contrato c) {
        return c.getAditivos().stream()
                .map(a -> new AditivoDTO(a.getId(), a.getNumero(), a.getTipo(), a.getDescricao(), a.getValor(), a.getData(), a.getCondicoes()))
                .toList();
    }

    private ContratoPublicoDTO paraPublico(Contrato c) {
        return new ContratoPublicoDTO(c.getNumero(), c.getTitulo(), c.getTituloDocumento(), nomeDoProfissional(c),
                nomeDoCliente(c), c.valorTotal(), c.getStatus(), c.getCabecalho(), clausulasDTO(c), aditivosDTO(c),
                c.getAssinatura(), modelos.avisoLegal(), c.getVersaoModelos(), c.getAprovadoEm());
    }

    public ContratoDTO paraDTO(Contrato c) {
        List<ClausulaDTO> clausulas = clausulasDTO(c);
        List<AditivoDTO> aditivos = aditivosDTO(c);
        Map<String, String> ctx = contexto(c);
        var campos = modelos.camposComValores(c.getNicho(), ctx);
        List<CampoDTO> camposDTO = campos.stream()
                .map(f -> new CampoDTO(f.chave(), f.rotulo(), f.tipo(), f.obrigatorio(), f.opcoes(), f.grupo(), f.valor(), f.pendente()))
                .toList();
        return new ContratoDTO(c.getId(), c.getNumero(), c.getOrcamentoId(), c.getCliente().getId(), c.getCliente().getNome(),
                c.getNicho(), c.getTitulo(), c.getValor(), c.valorTotal(), c.getStatus(), c.getDataInicio(),
                clausulas, aditivos, c.getCriadoEm(),
                c.getTituloDocumento(), c.getVersaoModelos(), c.getCabecalho(), c.getAssinatura(), modelos.avisoLegal(),
                new HashMap<>(c.getDados()), camposDTO, modelos.pendentes(campos, ctx),
                linkAceite(c), c.getEnviadoEm(), c.getEnviadoPara(), c.getAprovadoEm(), null);
    }
}
