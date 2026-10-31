/* Fórmulas de negócio — réplica exata do objeto `Calc` de js/services.js.
   Mantido no frontend apenas para feedback instantâneo (em tempo real,
   enquanto o usuário digita). O backend RECALCULA os mesmos valores antes
   de salvar (ver OrcamentoService.java), então o número gravado nunca
   confia cegamente no que o navegador mandou. */
import { CustosOrcamento } from '../models/models';

export const Calc = {
  custoTotal(custos: CustosOrcamento | undefined | null): number {
    if (!custos) return 0;
    return Object.values(custos).reduce((soma: number, v) => soma + (Number(v) || 0), 0);
  },
  valorComMargem(custo: number, margemPercent: number): number {
    let m = Number(margemPercent) || 0;
    if (m >= 100) m = 99;
    return custo / (1 - m / 100);
  },
  lucro(valor: number, custo: number): number {
    return (Number(valor) || 0) - (Number(custo) || 0);
  },
  margem(valor: number, custo: number): number {
    const v = Number(valor) || 0;
    if (v === 0) return 0;
    return (Calc.lucro(v, custo) / v) * 100;
  },
  lucroPorHora(lucro: number, horas: number): number {
    const h = Number(horas) || 0;
    if (h === 0) return 0;
    return lucro / h;
  },
  diferenca(real: number, previsto: number): number {
    return (Number(real) || 0) - (Number(previsto) || 0);
  }
};
