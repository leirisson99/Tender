import type { Edital } from "../entidades/Edital.js";
import type { Monitoramento } from "../entidades/Empresa.js";

function regiaoCompativel(edital: Edital, monitoramento: Monitoramento): boolean {
  if (edital.regiao.uf !== monitoramento.regiao.uf) {
    return false;
  }

  if (monitoramento.regiao.municipio === null) {
    return true;
  }

  return monitoramento.regiao.municipio === edital.regiao.municipio;
}

function segmentoCompativel(edital: Edital, monitoramento: Monitoramento): boolean {
  return (
    edital.classificacaoDoItem !== null &&
    edital.classificacaoDoItem.codigo === monitoramento.segmento.codigo
  );
}

export function encontrarMonitoramentoCompativel(
  edital: Edital,
  monitoramentosAtivos: readonly Monitoramento[],
): Monitoramento | null {
  for (const monitoramento of monitoramentosAtivos) {
    if (regiaoCompativel(edital, monitoramento) && segmentoCompativel(edital, monitoramento)) {
      return monitoramento;
    }
  }

  return null;
}
