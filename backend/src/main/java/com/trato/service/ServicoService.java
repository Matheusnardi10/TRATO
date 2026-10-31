package com.trato.service;

import com.trato.dto.DespesaDTO;
import com.trato.dto.PagamentoDTO;
import com.trato.dto.ServicoDTO;
import com.trato.entity.Cliente;
import com.trato.entity.Despesa;
import com.trato.entity.Pagamento;
import com.trato.entity.Servico;
import com.trato.repository.ClienteRepository;
import com.trato.repository.DespesaRepository;
import com.trato.repository.PagamentoRepository;
import com.trato.repository.ServicoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * "custoReal" de um serviço NUNCA é aceito pronto do frontend: é sempre a
 * soma das despesas lançadas (ver recalcularCustoReal) — exatamente a regra
 * pedida de o backend calcular os valores financeiros. O status do
 * pagamento (pago/parcial/pendente/atrasado) também é sempre recalculado
 * aqui, nunca recebido pronto.
 */
@Service
@Transactional
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final ClienteRepository clienteRepository;
    private final DespesaRepository despesaRepository;
    private final PagamentoRepository pagamentoRepository;

    public ServicoService(ServicoRepository servicoRepository, ClienteRepository clienteRepository,
                           DespesaRepository despesaRepository, PagamentoRepository pagamentoRepository) {
        this.servicoRepository = servicoRepository;
        this.clienteRepository = clienteRepository;
        this.despesaRepository = despesaRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    public List<ServicoDTO> listar(Long usuarioId, String status) {
        List<Servico> lista = (status == null || status.isBlank() || status.equals("todos"))
                ? servicoRepository.findByUsuarioId(usuarioId)
                : servicoRepository.findByUsuarioIdAndStatus(usuarioId, status);
        return lista.stream().map(this::paraDTO).toList();
    }

    public ServicoDTO buscar(Long usuarioId, Long id) {
        return paraDTO(buscarEntidade(usuarioId, id));
    }

    public Servico buscarEntidade(Long usuarioId, Long id) {
        Servico s = servicoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado."));
        if (!s.getUsuarioId().equals(usuarioId)) throw new EntityNotFoundException("Serviço não encontrado.");
        return s;
    }

    public ServicoDTO criar(Long usuarioId, ServicoDTO dados) {
        Cliente cliente = clienteRepository.findById(dados.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado."));
        Servico s = new Servico();
        s.setUsuarioId(usuarioId);
        s.setNumero(String.format("%03d", servicoRepository.countByUsuarioId(usuarioId) + 1));
        s.setCliente(cliente);
        aplicar(s, dados);
        s.setCustoReal(0);
        Servico salvo = servicoRepository.save(s);

        // Todo serviço novo já nasce com um pagamento pendente vinculado
        // (mesma regra do ServiceService.criar original).
        Pagamento pagamento = new Pagamento();
        pagamento.setServico(salvo);
        pagamento.setCliente(cliente);
        pagamento.setValorTotal(salvo.getValor());
        pagamento.setValorRecebido(0);
        pagamento.setDataPrevista(salvo.getData());
        pagamento.setStatus("pendente");
        pagamentoRepository.save(pagamento);

        return paraDTO(salvo);
    }

    public ServicoDTO atualizar(Long usuarioId, Long id, ServicoDTO dados) {
        Servico s = buscarEntidade(usuarioId, id);
        if (dados.getClienteId() != null) {
            s.setCliente(clienteRepository.findById(dados.getClienteId())
                    .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado.")));
        }
        aplicar(s, dados);
        Servico salvo = servicoRepository.save(s);

        pagamentoRepository.findByServicoId(salvo.getId()).ifPresent(p -> {
            p.setValorTotal(salvo.getValor());
            p.setStatus(statusAtual(p));
            pagamentoRepository.save(p);
        });

        return paraDTO(salvo);
    }

    public ServicoDTO alterarStatus(Long usuarioId, Long id, String status) {
        Servico s = buscarEntidade(usuarioId, id);
        s.setStatus(status);
        return paraDTO(servicoRepository.save(s));
    }

    public void excluir(Long usuarioId, Long id) {
        Servico s = buscarEntidade(usuarioId, id);
        despesaRepository.findByServicoId(id).forEach(despesaRepository::delete);
        pagamentoRepository.findByServicoId(id).ifPresent(pagamentoRepository::delete);
        servicoRepository.delete(s);
    }

    private void aplicar(Servico s, ServicoDTO dados) {
        if (dados.getTitulo() != null) s.setTitulo(dados.getTitulo());
        if (dados.getNicho() != null) s.setNicho(dados.getNicho());
        if (dados.getData() != null) s.setData(dados.getData());
        if (dados.getHora() != null) s.setHora(dados.getHora());
        if (dados.getDuracaoHoras() > 0) s.setDuracaoHoras(dados.getDuracaoHoras());
        if (dados.getValor() > 0) s.setValor(dados.getValor());
        s.setCustoPrevisto(dados.getCustoPrevisto());
        s.setHorasTrabalhadas(dados.getHorasTrabalhadas());
        if (dados.getStatus() != null && !dados.getStatus().isBlank()) s.setStatus(dados.getStatus());
        s.setContratoId(dados.getContratoId());
        s.setOrcamentoId(dados.getOrcamentoId());
    }

    /** Agenda: lista os serviços com data (são os "agendamentos" do Trato —
     *  não existe entidade separada, ver README) dentro do intervalo informado. */
    public List<ServicoDTO> listarPorPeriodo(Long usuarioId, LocalDate inicio, LocalDate fim) {
        return servicoRepository.findByUsuarioId(usuarioId).stream()
                .filter(s -> s.getData() != null
                        && (inicio == null || !s.getData().isBefore(inicio))
                        && (fim == null || !s.getData().isAfter(fim)))
                .map(this::paraDTO)
                .toList();
    }

    /** Agenda: mesma regra de conflito usada pelas notificações automáticas —
     *  dois serviços não cancelados no mesmo dia e horário. */
    public List<ServicoDTO> verificarConflito(Long usuarioId, LocalDate data, java.time.LocalTime hora, Long excluirId) {
        if (data == null || hora == null) return List.of();
        return servicoRepository.findByUsuarioId(usuarioId).stream()
                .filter(s -> !"cancelado".equals(s.getStatus()))
                .filter(s -> excluirId == null || !s.getId().equals(excluirId))
                .filter(s -> data.equals(s.getData()) && hora.equals(s.getHora()))
                .map(this::paraDTO)
                .toList();
    }

    /* ---------- Despesas (recalcula sempre o custo real do serviço) ---------- */

    public List<DespesaDTO> listarDespesas(Long usuarioId, Long servicoId) {
        buscarEntidade(usuarioId, servicoId);
        return despesaRepository.findByServicoId(servicoId).stream().map(this::paraDTO).toList();
    }

    public DespesaDTO adicionarDespesa(Long usuarioId, Long servicoId, DespesaDTO dados) {
        Servico s = buscarEntidade(usuarioId, servicoId);
        Despesa d = new Despesa();
        d.setServico(s);
        d.setCategoria(dados.getCategoria());
        d.setDescricao(dados.getDescricao());
        d.setValor(Math.max(0, dados.getValor()));
        d.setData(dados.getData() == null ? LocalDate.now() : dados.getData());
        Despesa salva = despesaRepository.save(d);
        recalcularCustoReal(s);
        return paraDTO(salva);
    }

    private void recalcularCustoReal(Servico s) {
        double total = despesaRepository.findByServicoId(s.getId()).stream().mapToDouble(Despesa::getValor).sum();
        s.setCustoReal(total);
        servicoRepository.save(s);
    }

    /* ---------- Pagamento do serviço ---------- */

    public PagamentoDTO buscarPagamento(Long usuarioId, Long servicoId) {
        buscarEntidade(usuarioId, servicoId);
        Pagamento p = pagamentoRepository.findByServicoId(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Este serviço não possui pagamento vinculado."));
        p.setStatus(statusAtual(p));
        return paraDTO(pagamentoRepository.save(p));
    }

    public PagamentoDTO registrarRecebimento(Long usuarioId, Long servicoId, double valor, String forma) {
        buscarEntidade(usuarioId, servicoId);
        Pagamento p = pagamentoRepository.findByServicoId(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Este serviço não possui pagamento vinculado."));
        double recebido = Math.min(p.getValorTotal(), p.getValorRecebido() + Math.max(0, valor));
        p.setValorRecebido(recebido);
        if (forma != null && !forma.isBlank()) p.setForma(forma);
        if (recebido >= p.getValorTotal()) {
            p.setStatus("pago");
            p.setDataRecebida(LocalDate.now());
        } else {
            p.setStatus(statusAtual(p));
        }
        return paraDTO(pagamentoRepository.save(p));
    }

    /** pendente | parcial | pago | atrasado — recalculado, nunca confiado do cliente. */
    private String statusAtual(Pagamento p) {
        if ("pago".equals(p.getStatus())) return "pago";
        if (p.getDataPrevista() != null && p.getDataPrevista().isBefore(LocalDate.now())) return "atrasado";
        return p.getValorRecebido() > 0 ? "parcial" : "pendente";
    }

    public ServicoDTO paraDTO(Servico s) {
        return new ServicoDTO(s.getId(), s.getNumero(), s.getContratoId(), s.getOrcamentoId(),
                s.getCliente().getId(), s.getCliente().getNome(), s.getTitulo(), s.getNicho(),
                s.getData(), s.getHora(), s.getDuracaoHoras(), s.getValor(), s.getCustoPrevisto(),
                s.getCustoReal(), s.getHorasTrabalhadas(), s.getStatus());
    }

    public DespesaDTO paraDTO(Despesa d) {
        return new DespesaDTO(d.getId(), d.getServico().getId(), d.getCategoria(), d.getDescricao(), d.getValor(), d.getData());
    }

    public PagamentoDTO paraDTO(Pagamento p) {
        return new PagamentoDTO(p.getId(), p.getServico().getId(), p.getCliente().getId(), p.getValorTotal(),
                p.getValorRecebido(), p.getForma(), p.getDataPrevista(), p.getDataRecebida(), p.getStatus());
    }
}
