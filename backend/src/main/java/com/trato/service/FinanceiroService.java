package com.trato.service;

import com.trato.dto.FinanceiroDtos.CategoriaDespesaDTO;
import com.trato.dto.FinanceiroDtos.PontoFluxoCaixaDTO;
import com.trato.dto.FinanceiroDtos.ResumoFinanceiroDTO;
import com.trato.dto.PagamentoDTO;
import com.trato.entity.Despesa;
import com.trato.entity.Pagamento;
import com.trato.entity.Servico;
import com.trato.repository.DespesaRepository;
import com.trato.repository.PagamentoRepository;
import com.trato.repository.ServicoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Réplica do FinanceiroService original — receitas/despesas/saldo por
 *  período, despesas por categoria e fluxo de caixa dos últimos dias. */
@Service
public class FinanceiroService {

    private static final List<String[]> CATEGORIAS = List.of(
        new String[]{"material", "Material", "📦"},
        new String[]{"combustivel", "Combustível", "⛽"},
        new String[]{"alimentacao", "Alimentação", "🍽️"},
        new String[]{"maoDeObra", "Mão de obra", "👷"},
        new String[]{"pedagio", "Pedágio", "🛣️"},
        new String[]{"estacionamento", "Estacionamento", "🅿️"},
        new String[]{"ferramentas", "Ferramentas", "🧰"},
        new String[]{"outros", "Outros", "•"}
    );

    private final ServicoRepository servicoRepository;
    private final DespesaRepository despesaRepository;
    private final PagamentoRepository pagamentoRepository;

    public FinanceiroService(ServicoRepository servicoRepository, DespesaRepository despesaRepository,
                              PagamentoRepository pagamentoRepository) {
        this.servicoRepository = servicoRepository;
        this.despesaRepository = despesaRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    private LocalDate[] intervalo(String periodo) {
        LocalDate hoje = LocalDate.now();
        if ("dia".equals(periodo)) return new LocalDate[]{hoje, hoje};
        if ("semana".equals(periodo)) return new LocalDate[]{hoje.minusDays(7), hoje};
        if ("ano".equals(periodo)) return new LocalDate[]{hoje.minusDays(365), hoje.plusDays(365)};
        if ("mes".equals(periodo) || periodo == null) {
            LocalDate inicioMes = hoje.withDayOfMonth(1);
            return new LocalDate[]{inicioMes, hoje.plusDays(60)};
        }
        return new LocalDate[]{LocalDate.of(2000, 1, 1), LocalDate.of(2100, 1, 1)};
    }

    public ResumoFinanceiroDTO resumo(Long usuarioId, String periodo) {
        LocalDate[] faixa = intervalo(periodo);

        double receitas = servicoRepository.findByUsuarioId(usuarioId).stream()
                .filter(s -> !"cancelado".equals(s.getStatus()) && s.getData() != null
                        && !s.getData().isBefore(faixa[0]) && !s.getData().isAfter(faixa[1]))
                .mapToDouble(Servico::getValor).sum();

        double despesas = despesaRepository.findByUsuarioId(usuarioId).stream()
                .filter(d -> d.getData() != null && !d.getData().isBefore(faixa[0]) && !d.getData().isAfter(faixa[1]))
                .mapToDouble(Despesa::getValor).sum();

        List<Pagamento> pagamentos = pagamentoRepository.findByUsuarioId(usuarioId);
        double aReceber = pagamentos.stream().mapToDouble(p -> Math.max(0, p.getValorTotal() - p.getValorRecebido())).sum();
        double recebidoNoPeriodo = pagamentos.stream()
                .filter(p -> p.getDataRecebida() != null && !p.getDataRecebida().isBefore(faixa[0]) && !p.getDataRecebida().isAfter(faixa[1]))
                .mapToDouble(Pagamento::getValorRecebido).sum();

        return new ResumoFinanceiroDTO(receitas, despesas, receitas - despesas, aReceber, recebidoNoPeriodo, recebidoNoPeriodo - despesas);
    }

    public List<CategoriaDespesaDTO> despesasPorCategoria(Long usuarioId, String periodo) {
        LocalDate[] faixa = intervalo(periodo == null ? "todos" : periodo);
        Map<String, Double> totais = new LinkedHashMap<>();
        for (String[] c : CATEGORIAS) totais.put(c[0], 0.0);

        for (Despesa d : despesaRepository.findByUsuarioId(usuarioId)) {
            if (d.getData() == null || d.getData().isBefore(faixa[0]) || d.getData().isAfter(faixa[1])) continue;
            totais.merge(d.getCategoria(), d.getValor(), Double::sum);
        }

        List<CategoriaDespesaDTO> resultado = new ArrayList<>();
        for (String[] c : CATEGORIAS) resultado.add(new CategoriaDespesaDTO(c[0], c[1], c[2], totais.getOrDefault(c[0], 0.0)));
        resultado.sort((a, b) -> Double.compare(b.getValor(), a.getValor()));
        return resultado;
    }

    /** Contas a receber/pagar — a lista de pagamentos vinculados aos serviços
     *  do usuário (não existe "conta a pagar" separada; despesas já cobrem
     *  esse lado, ver despesasPorCategoria). */
    public List<PagamentoDTO> listarPagamentos(Long usuarioId) {
        return pagamentoRepository.findByUsuarioId(usuarioId).stream()
                .map(p -> new PagamentoDTO(p.getId(), p.getServico().getId(), p.getCliente().getId(), p.getValorTotal(),
                        p.getValorRecebido(), p.getForma(), p.getDataPrevista(), p.getDataRecebida(), statusAtual(p)))
                .toList();
    }

    /** pendente | parcial | pago | atrasado — mesma regra do ServicoService,
     *  recalculada aqui também para a listagem não mostrar status velho. */
    private String statusAtual(Pagamento p) {
        if ("pago".equals(p.getStatus())) return "pago";
        if (p.getDataPrevista() != null && p.getDataPrevista().isBefore(LocalDate.now())) return "atrasado";
        return p.getValorRecebido() > 0 ? "parcial" : "pendente";
    }

    public List<PontoFluxoCaixaDTO> fluxoCaixa(Long usuarioId, int dias) {
        List<Pagamento> pagamentos = pagamentoRepository.findByUsuarioId(usuarioId);
        List<Despesa> despesas = despesaRepository.findByUsuarioId(usuarioId);
        List<PontoFluxoCaixaDTO> pontos = new ArrayList<>();

        for (int i = dias - 1; i >= 0; i--) {
            LocalDate data = LocalDate.now().minusDays(i);
            double entradas = pagamentos.stream().filter(p -> data.equals(p.getDataRecebida())).mapToDouble(Pagamento::getValorRecebido).sum();
            double saidas = despesas.stream().filter(d -> data.equals(d.getData())).mapToDouble(Despesa::getValor).sum();
            pontos.add(new PontoFluxoCaixaDTO(data, entradas, saidas, entradas - saidas));
        }
        return pontos;
    }
}
