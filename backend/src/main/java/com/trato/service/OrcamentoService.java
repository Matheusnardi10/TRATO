package com.trato.service;

import com.trato.dto.OrcamentoDTO;
import com.trato.dto.OrcamentoDTO.ItemDTO;
import com.trato.entity.Cliente;
import com.trato.entity.ItemOrcamento;
import com.trato.entity.Orcamento;
import com.trato.repository.ClienteRepository;
import com.trato.repository.OrcamentoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Regra pedida: "o backend deve calcular/validar os valores financeiros, não
 * confiar no que o frontend manda". Por isso, ao salvar um orçamento:
 *  - o custo total é SEMPRE recalculado aqui a partir das categorias de
 *    custo gravadas (nunca aceito pronto do cliente);
 *  - a margem (%) é SEMPRE recalculada a partir do valor final e do custo
 *    total, para os dois números nunca ficarem inconsistentes entre si.
 * O "valor" final continua sendo uma decisão do profissional (ele pode
 * digitar o preço que quiser), então esse não é recalculado — só validado
 * (não pode ser negativo).
 */
@Service
@Transactional
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final ClienteRepository clienteRepository;

    public OrcamentoService(OrcamentoRepository orcamentoRepository, ClienteRepository clienteRepository) {
        this.orcamentoRepository = orcamentoRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<OrcamentoDTO> listar(Long usuarioId, String status) {
        List<Orcamento> lista = (status == null || status.isBlank() || status.equals("todos"))
                ? orcamentoRepository.findByUsuarioId(usuarioId)
                : orcamentoRepository.findByUsuarioIdAndStatus(usuarioId, status);
        return lista.stream().map(this::paraDTO).toList();
    }

    public OrcamentoDTO buscar(Long usuarioId, Long id) {
        return paraDTO(buscarEntidade(usuarioId, id));
    }

    public Orcamento buscarEntidade(Long usuarioId, Long id) {
        Orcamento o = orcamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Orçamento não encontrado."));
        if (!o.getUsuarioId().equals(usuarioId)) throw new EntityNotFoundException("Orçamento não encontrado.");
        return o;
    }

    public OrcamentoDTO criar(Long usuarioId, OrcamentoDTO dados) {
        Orcamento o = new Orcamento();
        o.setUsuarioId(usuarioId);
        o.setNumero(String.format("%03d", orcamentoRepository.countByUsuarioId(usuarioId) + 1));
        o.setStatus(dados.getStatus() == null || dados.getStatus().isBlank() ? "rascunho" : dados.getStatus());
        aplicar(o, dados);
        return paraDTO(orcamentoRepository.save(o));
    }

    public OrcamentoDTO atualizar(Long usuarioId, Long id, OrcamentoDTO dados) {
        Orcamento o = buscarEntidade(usuarioId, id);
        aplicar(o, dados);
        return paraDTO(orcamentoRepository.save(o));
    }

    public void excluir(Long usuarioId, Long id) {
        orcamentoRepository.delete(buscarEntidade(usuarioId, id));
    }

    public OrcamentoDTO enviar(Long usuarioId, Long id) {
        Orcamento o = buscarEntidade(usuarioId, id);
        o.setStatus("aguardando");
        return paraDTO(orcamentoRepository.save(o));
    }

    public OrcamentoDTO aprovar(Long usuarioId, Long id) {
        Orcamento o = buscarEntidade(usuarioId, id);
        o.setStatus("aprovado");
        return paraDTO(orcamentoRepository.save(o));
    }

    public OrcamentoDTO recusar(Long usuarioId, Long id) {
        Orcamento o = buscarEntidade(usuarioId, id);
        o.setStatus("recusado");
        return paraDTO(orcamentoRepository.save(o));
    }

    private void aplicar(Orcamento o, OrcamentoDTO dados) {
        Cliente cliente = clienteRepository.findById(dados.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado."));
        o.setCliente(cliente);
        o.setTitulo(dados.getTitulo());
        o.setDescricao(dados.getDescricao());
        o.setNicho(dados.getNicho());
        o.setDataPrevista(dados.getDataPrevista());
        o.setPrazoEstimado(dados.getPrazoEstimado());
        o.setFormaPagamento(dados.getFormaPagamento());
        o.setValidade(dados.getValidade());
        if (dados.getStatus() != null && !dados.getStatus().isBlank()) o.setStatus(dados.getStatus());

        Map<String, Double> custos = dados.getCustos() == null ? Map.of() : dados.getCustos();
        o.getCustos().setMaterial(custos.getOrDefault("material", 0.0));
        o.getCustos().setCombustivel(custos.getOrDefault("combustivel", 0.0));
        o.getCustos().setAlimentacao(custos.getOrDefault("alimentacao", 0.0));
        o.getCustos().setMaoDeObra(custos.getOrDefault("maoDeObra", 0.0));
        o.getCustos().setPedagio(custos.getOrDefault("pedagio", 0.0));
        o.getCustos().setEstacionamento(custos.getOrDefault("estacionamento", 0.0));
        o.getCustos().setFerramentas(custos.getOrDefault("ferramentas", 0.0));
        o.getCustos().setOutros(custos.getOrDefault("outros", 0.0));

        double custoTotal = o.getCustos().total();
        double valor = Math.max(0, dados.getValor());
        o.setValor(valor);
        o.setMargem(custoTotal > 0 && valor > 0 ? Math.round(((valor - custoTotal) / valor) * 1000.0) / 10.0 : dados.getMargem());

        o.getItens().clear();
        if (dados.getItens() != null) {
            dados.getItens().forEach(item -> {
                ItemOrcamento entidade = new ItemOrcamento();
                entidade.setOrcamento(o);
                entidade.setDescricao(item.getDescricao());
                entidade.setQuantidade(item.getQuantidade());
                entidade.setValorUnitario(item.getValorUnitario());
                o.getItens().add(entidade);
            });
        }

        o.getCamposNicho().clear();
        if (dados.getCamposNicho() != null) o.getCamposNicho().putAll(dados.getCamposNicho());
    }

    public OrcamentoDTO paraDTO(Orcamento o) {
        Map<String, Double> custos = new LinkedHashMap<>();
        custos.put("material", o.getCustos().getMaterial());
        custos.put("combustivel", o.getCustos().getCombustivel());
        custos.put("alimentacao", o.getCustos().getAlimentacao());
        custos.put("maoDeObra", o.getCustos().getMaoDeObra());
        custos.put("pedagio", o.getCustos().getPedagio());
        custos.put("estacionamento", o.getCustos().getEstacionamento());
        custos.put("ferramentas", o.getCustos().getFerramentas());
        custos.put("outros", o.getCustos().getOutros());

        List<ItemDTO> itens = o.getItens().stream()
                .map(i -> new ItemDTO(i.getId(), i.getDescricao(), i.getQuantidade(), i.getValorUnitario()))
                .toList();

        return new OrcamentoDTO(
                o.getId(), o.getNumero(), o.getCliente().getId(), o.getCliente().getNome(),
                o.getTitulo(), o.getDescricao(), o.getNicho(), o.getDataPrevista(), o.getPrazoEstimado(),
                o.getFormaPagamento(), o.getValidade(), itens, custos, o.getMargem(), o.getValor(),
                o.getStatus(), new LinkedHashMap<>(o.getCamposNicho()), o.getCriadoEm()
        );
    }
}
