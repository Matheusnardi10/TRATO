/* Pequenas funções de formatação — réplica das usadas em js/utils.js
   que os componentes migrados precisam (moeda, percentual, datas, nomes
   curtos de mês). */

export function formatBRL(valor: number | undefined | null): string {
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPercent(valor: number | undefined | null): string {
  return (Number(valor) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/* "2026-10-25T14:30:00" -> "25/10/2026 às 14:30" */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const [data, hora = ''] = iso.split('T');
  return `${formatDate(data)} às ${hora.slice(0, 5)}`;
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function mesCurto(indice: number): string {
  return MESES_CURTOS[indice] || '';
}

export function iniciais(nome: string | undefined | null): string {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

/* Réplica do ReportService.exportarCSV original — monta o CSV no próprio
   navegador (sem biblioteca externa) e dispara o download via Blob. */
export function exportarCSV(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]): void {
  const escapar = (valor: string | number) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\n');
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
