package com.trato.service;

import com.trato.dto.NotificacaoDTO;
import com.trato.entity.*;
import com.trato.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Réplica do NotificationService original: `criarSeNaoExiste` evita
 * duplicar a mesma notificação automática a cada chamada (usa `chave`),
 * e `checarAutomaticas` roda as mesmas regras (pagamento atrasado,
 * conflito de agenda, serviço amanhã, orçamento/contrato aguardando).
 */
@Service
@Transactional
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ServicoRepository servicoRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final ContratoRepository contratoRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository, PagamentoRepository pagamentoRepository,
                               ServicoRepository servicoRepository, OrcamentoRepository orcamentoRepository,
                               ContratoRepository contratoRepository) {
        this.notificacaoRepository = notificacaoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.servicoRepository = servicoRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.contratoRepository = contratoRepository;
    }

    public List<NotificacaoDTO> listar(Long usuarioId) {
        checarAutomaticas(usuarioId);
        return notificacaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId).stream().map(this::paraDTO).toList();
    }

    public long contarNaoLidas(Long usuarioId) {
        return notificacaoRepository.findByUsuarioIdAndLidaFalse(usuarioId).size();
    }

    public Notificacao criar(Long usuarioId, String tipo, String titulo, String texto, String chave) {
        if (chave != null && notificacaoRepository.existsByChave(chave)) return null;
        Notificacao n = new Notificacao();
        n.setUsuarioId(usuarioId);
        n.setTipo(tipo);
        n.setTitulo(titulo);
        n.setTexto(texto);
        n.setChave(chave);
        return notificacaoRepository.save(n);
    }

    public void marcarComoLida(Long usuarioId, Long id) {
        notificacaoRepository.findById(id).filter(n -> n.getUsuarioId().equals(usuarioId)).ifPresent(n -> {
            n.setLida(true);
            notificacaoRepository.save(n);
        });
    }

    public void marcarTodasComoLidas(Long usuarioId) {
        List<Notificacao> naoLidas = notificacaoRepository.findByUsuarioIdAndLidaFalse(usuarioId);
        naoLidas.forEach(n -> n.setLida(true));
        notificacaoRepository.saveAll(naoLidas);
    }

    public void checarAutomaticas(Long usuarioId) {
        for (Pagamento p : pagamentoRepository.findByUsuarioId(usuarioId)) {
            boolean atrasado = !"pago".equals(p.getStatus()) && p.getDataPrevista() != null && p.getDataPrevista().isBefore(LocalDate.now());
            if (atrasado) {
                criar(usuarioId, "danger", "Pagamento atrasado",
                        String.format("R$ %.2f de %s venceu em %s.", p.getValorTotal() - p.getValorRecebido(), p.getCliente().getNome(), p.getDataPrevista()),
                        "pagamento-atrasado-" + p.getId());
            }
        }

        List<Servico> servicos = servicoRepository.findByUsuarioId(usuarioId);
        List<Servico> ativos = new ArrayList<>();
        for (Servico s : servicos) {
            if (!"cancelado".equals(s.getStatus()) && s.getData() != null && !s.getData().isBefore(LocalDate.now())) ativos.add(s);
        }
        for (int i = 0; i < ativos.size(); i++) {
            for (int j = i + 1; j < ativos.size(); j++) {
                Servico a = ativos.get(i), b = ativos.get(j);
                if (a.getData().equals(b.getData()) && a.getHora() != null && a.getHora().equals(b.getHora())) {
                    List<Long> par = List.of(a.getId(), b.getId()).stream().sorted().toList();
                    criar(usuarioId, "danger", "Conflito de agenda em " + a.getData(),
                            "Às " + a.getHora() + ": \"" + a.getTitulo() + "\" e \"" + b.getTitulo() + "\" ocupam o mesmo horário.",
                            "conflito-" + par.get(0) + "-" + par.get(1));
                }
            }
            Servico s = ativos.get(i);
            if (s.getData().equals(LocalDate.now().plusDays(1))) {
                criar(usuarioId, "info", "Serviço amanhã às " + s.getHora(),
                        s.getTitulo() + " — " + s.getCliente().getNome() + ".",
                        "servico-amanha-" + s.getId());
            }
        }

        for (Orcamento o : orcamentoRepository.findByUsuarioIdAndStatus(usuarioId, "aguardando")) {
            criar(usuarioId, "info", "Orçamento #" + o.getNumero() + " aguardando aprovação",
                    o.getCliente().getNome() + " ainda não respondeu.",
                    "orcamento-aguardando-" + o.getId());
        }

        for (Contrato c : contratoRepository.findByUsuarioIdAndStatus(usuarioId, "aguardando")) {
            criar(usuarioId, "warning", "Contrato #" + c.getNumero() + " aguardando aceite",
                    "Enviado para " + c.getCliente().getNome() + ".",
                    "contrato-aguardando-" + c.getId());
        }
    }

    public NotificacaoDTO paraDTO(Notificacao n) {
        return new NotificacaoDTO(n.getId(), n.getTipo(), n.getTitulo(), n.getTexto(), n.getData(), n.isLida());
    }
}
