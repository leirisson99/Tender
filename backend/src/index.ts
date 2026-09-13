import "dotenv/config";
import { app } from "./server.js";

const porta = Number(process.env.PORT ?? 3000);

app.listen({ port: porta, host: "0.0.0.0" }).catch((erro: unknown) => {
  app.log.error(erro);
  process.exit(1);
});
