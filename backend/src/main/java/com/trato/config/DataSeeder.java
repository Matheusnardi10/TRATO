package com.trato.config;

import com.trato.dto.ContratoDTO.AditivoDTO;
import com.trato.entity.*;
import com.trato.repository.*;
import com.trato.service.ContratoService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalTime;

/**
 * Popula o banco na primeira execução com dados equivalentes ao
 * Data.seed() do projeto original (mesmo usuário de demonstração,
 * clientes, orçamentos e serviços), para dar continuidade ao que já
 * existia em LocalStorage. Só roda se a tabela de usuários estiver vazia,
 * então é seguro reiniciar o backend várias vezes sem duplicar dados.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final ServicoRepository servicoRepository;
    private final DespesaRepository despesaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ContratoService contratoService;

    public DataSeeder(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                       OrcamentoRepository orcamentoRepository, ServicoRepository servicoRepository,
                       DespesaRepository despesaRepository, PagamentoRepository pagamentoRepository,
                       ContratoService contratoService) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.servicoRepository = servicoRepository;
        this.despesaRepository = despesaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.contratoService = contratoService;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) return; // já populado

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        Usuario demo = new Usuario();
        demo.setNome("Caique Ribeiro");
        demo.setNomeProfissional("Caique Ribeiro Fotografia");
        demo.setEmail("demo@trato.app");
        demo.setTelefone("(11) 98888-1234");
        demo.setSenhaHash(encoder.encode("123456"));
        demo.setNicho("fotografo");
        demo.getNegocio().setCidade("São Paulo, SP");
        demo.getNegocio().setTelefoneProfissional("(11) 98888-1234");
        demo.getNegocio().setEmailProfissional("contato@caiquefotografia.com.br");
        demo.getNegocio().setPix("demo@trato.app");
        demo.getNegocio().setFormaPagamentoPadrao("50% de entrada e 50% na entrega");
        demo.getNegocio().setPrazoPadrao("15 dias");
        demo.getNegocio().setDocumento("111.222.330-43");
        demo.getNegocio().setEndereco("Rua das Acácias, 120 – Pinheiros, São Paulo/SP, CEP 05422-000");
        usuarioRepository.save(demo);

        Cliente joao = cliente(demo.getId(), "João Silva", "(11) 99120-4477", "joao.silva@email.com", "123.456.780-62");
        Cliente mariana = cliente(demo.getId(), "Mariana Oliveira", "(11) 98431-2210", "mariana.oliveira@email.com", "987.654.320-29");
        Cliente carlos = cliente(demo.getId(), "Carlos Santos", "(11) 97755-8090", "carlos.santos@email.com", "456.123.780-17");
        Cliente fernanda = cliente(demo.getId(), "Fernanda Almeida", "(11) 96622-1188", "fernanda.almeida@email.com", "321.654.980-15");
        Cliente ricardo = cliente(demo.getId(), "Ricardo Lima", "(11) 95533-7744", "ricardo.lima@email.com", "741.852.960-02");

        Orcamento orc1 = orcamento(demo.getId(), "001", joao, "Ensaio de casamento", "fotografo",
                dia(-12), 1600 + 200, 40, 1800, "aprovado");
        Orcamento orc2 = orcamento(demo.getId(), "002", mariana, "Ensaio gestante", "fotografo",
                dia(4), 950, 45, 950, "aguardando");
        orcamentoRepository.save(orc1);
        orcamentoRepository.save(orc2);

        Servico s1 = servico(demo.getId(), "001", joao, "Ensaio de casamento", "fotografo", dia(-12), "16:00", 1800, 600, 16, "concluido");
        Servico s2 = servico(demo.getId(), "002", mariana, "Ensaio gestante", "fotografo", dia(-8), "08:00", 950, 320, 6, "concluido");
        Servico s3 = servico(demo.getId(), "003", ricardo, "Cobertura de evento corporativo", "fotografo", dia(-3), "19:00", 2400, 900, 12, "em_andamento");
        Servico s4 = servico(demo.getId(), "004", fernanda, "Aniversário infantil", "fotografo", dia(-1), "15:00", 1200, 420, 7, "em_andamento");
        Servico s5 = servico(demo.getId(), "005", carlos, "Ensaio corporativo — equipe", "fotografo", dia(0), "14:00", 1500, 500, 5, "em_andamento");
        Servico s6 = servico(demo.getId(), "006", joao, "Cobertura de formatura", "fotografo", dia(1), "19:30", 2200, 700, 0, "agendado");
        servicoRepository.save(s1); servicoRepository.save(s2); servicoRepository.save(s3);
        servicoRepository.save(s4); servicoRepository.save(s5); servicoRepository.save(s6);

        despesa(s1, "maoDeObra", "Segundo fotógrafo", 300, dia(-12));
        despesa(s1, "material", "Cartões de memória e baterias", 220, dia(-12));
        despesa(s2, "combustivel", "Deslocamento até o ensaio", 190, dia(-8));
        despesa(s2, "alimentacao", "Almoço durante o ensaio", 40, dia(-8));
        despesa(s3, "maoDeObra", "Assistente de estúdio", 250, dia(-3));
        despesa(s3, "combustivel", "Gasolina para deslocamento", 80, dia(-3));

        for (Servico s : new Servico[]{s1, s2, s3}) {
            double total = despesaRepository.findByServicoId(s.getId()).stream().mapToDouble(Despesa::getValor).sum();
            s.setCustoReal(total);
            servicoRepository.save(s);
        }

        pagamento(s1, joao, 1800, 1800, "pago", dia(-10));
        pagamento(s2, mariana, 950, 475, "parcial", dia(-2));
        pagamento(s3, ricardo, 2400, 1200, "parcial", dia(2));
        pagamento(s4, fernanda, 1200, 0, "atrasado", dia(-3));
        pagamento(s5, carlos, 1500, 0, "pendente", dia(3));
        pagamento(s6, joao, 2200, 0, "pendente", dia(5));

        // Contrato de exemplo, gerado a partir do orçamento já aprovado (orc1),
        // para a tela de Contratos não abrir vazia. As notificações (pagamento
        // atrasado, serviço amanhã, orçamento aguardando) são geradas sob
        // demanda pelo NotificacaoService.checarAutomaticas, não precisam
        // ser semeadas aqui.
        var contratoDTO = contratoService.gerarDoOrcamento(demo.getId(), orc1.getId());
        // Dados que o usuário preencheria na tela do contrato (sem eles o aceite é bloqueado).
        Map<String, String> dados = new HashMap<>();
        dados.put("contratante.cep", "01310-100");
        dados.put("contratante.logradouro", "Avenida Paulista");
        dados.put("contratante.numero", "1000");
        dados.put("contratante.bairro", "Bela Vista");
        dados.put("contratante.cidade", "São Paulo");
        dados.put("contratante.uf", "SP");
        dados.put("contrato.data_termino_prevista", dia(3).toString());
        dados.put("foto.tipo", "Evento");
        dados.put("foto.data_hora_sessao", dia(-12) + "T15:00");
        dados.put("foto.duracao_horas", "6");
        dados.put("foto.qtd_minima_fotos", "300");
        dados.put("foto.prazo_entrega_dias", "30");
        contratoService.atualizarDados(demo.getId(), contratoDTO.getId(), dados);
        contratoService.marcarAceito(demo.getId(), contratoDTO.getId());
        AditivoDTO aditivo = new AditivoDTO();
        aditivo.setTipo("prazo");
        aditivo.setDescricao("Cliente solicitou mais 2 dias para entrega do material editado.");
        aditivo.setValor(0);
        aditivo.setCondicoes("Nova data de entrega: " + dia(-5) + ".");
        contratoService.adicionarAditivo(demo.getId(), contratoDTO.getId(), aditivo);
    }

    private Cliente cliente(Long usuarioId, String nome, String telefone, String email, String doc) {
        Cliente c = new Cliente();
        c.setUsuarioId(usuarioId);
        c.setNome(nome);
        c.setTelefone(telefone);
        c.setEmail(email);
        c.setDocumento(doc);
        c.setStatus("ativo");
        return clienteRepository.save(c);
    }

    private Orcamento orcamento(Long usuarioId, String numero, Cliente cliente, String titulo, String nicho,
                                 LocalDate dataPrevista, double valor, double margem, double valorExibido, String status) {
        Orcamento o = new Orcamento();
        o.setUsuarioId(usuarioId);
        o.setNumero(numero);
        o.setCliente(cliente);
        o.setTitulo(titulo);
        o.setNicho(nicho);
        o.setDataPrevista(dataPrevista);
        o.setValidade(dataPrevista.plusDays(10));
        o.setPrazoEstimado("15 dias");
        o.setFormaPagamento("50% de entrada e 50% na entrega");
        o.setMargem(margem);
        o.setValor(valorExibido);
        o.setStatus(status);
        return o;
    }

    private Servico servico(Long usuarioId, String numero, Cliente cliente, String titulo, String nicho,
                             LocalDate data, String hora, double valor, double custoPrevisto, double horasTrabalhadas, String status) {
        Servico s = new Servico();
        s.setUsuarioId(usuarioId);
        s.setNumero(numero);
        s.setCliente(cliente);
        s.setTitulo(titulo);
        s.setNicho(nicho);
        s.setData(data);
        s.setHora(LocalTime.parse(hora));
        s.setDuracaoHoras(4);
        s.setValor(valor);
        s.setCustoPrevisto(custoPrevisto);
        s.setHorasTrabalhadas(horasTrabalhadas);
        s.setStatus(status);
        return s;
    }

    private void despesa(Servico servico, String categoria, String descricao, double valor, LocalDate data) {
        Despesa d = new Despesa();
        d.setServico(servico);
        d.setCategoria(categoria);
        d.setDescricao(descricao);
        d.setValor(valor);
        d.setData(data);
        despesaRepository.save(d);
    }

    private void pagamento(Servico servico, Cliente cliente, double total, double recebido, String status, LocalDate dataPrevista) {
        Pagamento p = new Pagamento();
        p.setServico(servico);
        p.setCliente(cliente);
        p.setValorTotal(total);
        p.setValorRecebido(recebido);
        p.setStatus(status);
        p.setDataPrevista(dataPrevista);
        if ("pago".equals(status)) p.setDataRecebida(dataPrevista);
        pagamentoRepository.save(p);
    }

    private LocalDate dia(int offsetDias) {
        return LocalDate.now().plusDays(offsetDias);
    }
}
