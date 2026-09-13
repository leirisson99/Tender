export class MonitoramentoDuplicadoError extends Error {
  constructor() {
    super("Monitoramento duplicado: já existe um Monitoramento para este segmento e região.");
    this.name = "MonitoramentoDuplicadoError";
  }
}
