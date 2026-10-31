package com.trato.service;

import com.trato.dto.RelatorioDtos.*;
import com.trato.entity.Cliente;
import com.trato.entity.Orcamento;
import com.trato.entity.Servico;
import com.trato.repository.ClienteRepository;
import com.trato.repository.OrcamentoRepository;
import com.trato.repository.ServicoRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Réplica do ReportService original — mesmos 5 relatórios (os outros 2 do
 *  original, faturamento e receitas/despesas, já são cobertos pelo
 *  Dashboard e pelo Financeiro). */
@Service
public class RelatorioService {

    private final ServicoRepository servicoRepository;
    private final ClienteRepository clienteRepository;
    private final OrcamentoRepository orcamentoRepository;

    public RelatorioService(ServicoRepository servicoRepository, ClienteRepository clienteRepository,
                             OrcamentoRepository orcamentoRepository) {
        this.servicoRepository = servicoRepository;
        this.clienteRepository = clienteRepository;
        this.orcamentoRepository = orcamentoRepository;
    }

    public List<ServicoRentavelDTO> servicosMaisRentaveis(Long usuarioId, int quantidade) {
        return servicoRepository.findByUsuarioId(usuarioId).stream()
                .map(s -> {
                    double lucro = s.getValor() - s.getCustoReal();
                    double margem = s.getValor() > 0 ? (lucro / s.getValor()) * 100 : 0;
                    return new ServicoRentavelDTO(s.getNumero(), s.getTitulo(), s.getValor(), s.getCustoReal(), lucro, margem);
                })
                .sorted(Comparator.comparingDouble(ServicoRentavelDTO::getLucroAtual).reversed())
                .limit(quantidade)
                .toList();
    }

    public List<ClienteMovimentacaoDTO> clientesPorMovimentacao(Long usuarioId, int quantidade) {
        Map<Long, List<Servico>> porCliente = new LinkedHashMap<>();
        for (Servico s : servicoRepository.findByUsuarioId(usuarioId)) {
            porCliente.computeIfAbsent(s.getCliente().getId(), k -> new java.util.ArrayList<>()).add(s);
        }
        return clienteRepository.findByUsuarioId(usuarioId).stream()
                .map(c -> {
                    List<Servico> lista = porCliente.getOrDefault(c.getId(), List.of());
                    double total = lista.stream().mapToDouble(Servico::getValor).sum();
                    return new ClienteMovimentacaoDTO(c.getNome(), lista.size(), total);
                })
                .filter(r -> r.getQuantidade() > 0)
                .sorted(Comparator.comparingDouble(ClienteMovimentacaoDTO::getTotal).reversed())
                .limit(quantidade)
                .toList();
    }

    public List<StatusOrcamentoDTO> orcamentosPorStatus(Long usuarioId) {
        Map<String, double[]> mapa = new LinkedHashMap<>();
        for (String s : List.of("rascunho", "enviado", "aguardando", "aprovado", "recusado", "expirado")) {
            mapa.put(s, new double[]{0, 0});
        }
        for (Orcamento o : orcamentoRepository.findByUsuarioId(usuarioId)) {
            double[] par = mapa.computeIfAbsent(o.getStatus(), k -> new double[]{0, 0});
            par[0]++;
            par[1] += o.getValor();
        }
        return mapa.entrySet().stream()
                .map(e -> new StatusOrcamentoDTO(e.getKey(), (long) e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    public List<PrevistoRealizadoDTO> previstoXRealizado(Long usuarioId) {
        return servicoRepository.findByUsuarioId(usuarioId).stream()
                .map(s -> new PrevistoRealizadoDTO(s.getNumero(), s.getTitulo(), s.getCustoPrevisto(), s.getCustoReal(), s.getCustoReal() - s.getCustoPrevisto()))
                .toList();
    }

    public List<LucroPorHoraDTO> lucroPorHora(Long usuarioId) {
        return servicoRepository.findByUsuarioId(usuarioId).stream()
                .filter(s -> s.getHorasTrabalhadas() > 0)
                .map(s -> new LucroPorHoraDTO(s.getNumero(), s.getTitulo(), s.getHorasTrabalhadas(), (s.getValor() - s.getCustoReal()) / s.getHorasTrabalhadas()))
                .sorted(Comparator.comparingDouble(LucroPorHoraDTO::getLucroPorHora).reversed())
                .toList();
    }
}
