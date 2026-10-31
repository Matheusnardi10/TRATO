package com.trato.service;

import com.trato.dto.DashboardDtos.AlertaDTO;
import com.trato.dto.DashboardDtos.HistoricoMesDTO;
import com.trato.dto.DashboardDtos.ResumoMesDTO;
import com.trato.entity.Orcamento;
import com.trato.entity.Pagamento;
import com.trato.entity.Servico;
import com.trato.repository.OrcamentoRepository;
import com.trato.repository.PagamentoRepository;
import com.trato.repository.ServicoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/** Todos os números aqui são calculados a partir dos dados reais gravados
 *  no banco (serviços, orçamentos, pagamentos) — nada é mock/hardcoded,
 *  ao contrário do js/data.js original que tinha um histórico fixo. */
@Service
public class DashboardService {

    private final ServicoRepository servicoRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final PagamentoRepository pagamentoRepository;

    public DashboardService(ServicoRepository servicoRepository, OrcamentoRepository orcamentoRepository,
                             PagamentoRepository pagamentoRepository) {
        this.servicoRepository = servicoRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    public ResumoMesDTO resumoMes(Long usuarioId) {
        YearMonth mesAtual = YearMonth.now();
        List<Servico> servicosDoMes = servicoRepository.findByUsuarioId(usuarioId).stream()
                .filter(s -> s.getData() != null && YearMonth.from(s.getData()).equals(mesAtual))
                .filter(s -> !"cancelado".equals(s.getStatus()))
                .toList();

        double faturamento = servicosDoMes.stream().mapToDouble(Servico::getValor).sum();
        double custos = servicosDoMes.stream().mapToDouble(Servico::getCustoReal).sum();
        long emAndamento = servicosDoMes.stream()
                .filter(s -> "agendado".equals(s.getStatus()) || "em_andamento".equals(s.getStatus()))
                .count();

        double aReceber = pagamentoRepository.findByUsuarioId(usuarioId).stream()
                .mapToDouble(p -> Math.max(0, p.getValorTotal() - p.getValorRecebido()))
                .sum();

        double margem = faturamento > 0 ? ((faturamento - custos) / faturamento) * 100 : 0;

        return new ResumoMesDTO(faturamento, custos, faturamento - custos, margem, emAndamento, aReceber);
    }

    public List<HistoricoMesDTO> historico(Long usuarioId) {
        List<Servico> todos = servicoRepository.findByUsuarioId(usuarioId);
        List<HistoricoMesDTO> historico = new ArrayList<>();
        YearMonth atual = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth mes = atual.minusMonths(i);
            double faturamento = 0, custos = 0;
            for (Servico s : todos) {
                if (s.getData() == null || !YearMonth.from(s.getData()).equals(mes)) continue;
                if ("cancelado".equals(s.getStatus())) continue;
                faturamento += s.getValor();
                custos += s.getCustoReal();
            }
            historico.add(new HistoricoMesDTO(mes.getMonthValue() - 1, mes.getYear(), faturamento, custos, faturamento - custos));
        }
        return historico;
    }

    public List<AlertaDTO> alertas(Long usuarioId) {
        List<AlertaDTO> alertas = new ArrayList<>();

        for (Orcamento o : orcamentoRepository.findByUsuarioIdAndStatus(usuarioId, "aguardando")) {
            alertas.add(new AlertaDTO("info", "📑",
                    "Orçamento #" + o.getNumero() + " aguardando aprovação",
                    o.getCliente().getNome() + " ainda não respondeu — R$ " + String.format("%.2f", o.getValor())));
        }

        for (Servico s : servicoRepository.findByUsuarioId(usuarioId)) {
            if (s.getCustoReal() > s.getCustoPrevisto() && !"cancelado".equals(s.getStatus()) && s.getCustoPrevisto() > 0) {
                alertas.add(new AlertaDTO("warning", "⚠️",
                        "Serviço #" + s.getNumero() + " acima do custo previsto",
                        s.getTitulo() + " está R$ " + String.format("%.2f", s.getCustoReal() - s.getCustoPrevisto()) + " acima do previsto."));
            }
        }

        for (Pagamento p : pagamentoRepository.findByUsuarioId(usuarioId)) {
            boolean atrasado = !"pago".equals(p.getStatus()) && p.getDataPrevista() != null && p.getDataPrevista().isBefore(LocalDate.now());
            if (atrasado) {
                alertas.add(new AlertaDTO("danger", "💰", "Pagamento atrasado",
                        "R$ " + String.format("%.2f", p.getValorTotal() - p.getValorRecebido()) + " de " +
                                p.getCliente().getNome() + " venceu em " + p.getDataPrevista() + "."));
            }
        }

        return alertas;
    }
}
