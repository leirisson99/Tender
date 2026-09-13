import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { construirApp } from "./interfaces/http/app.js";
import { EmpresaRepositorioPrisma } from "./infrastructure/repositorios/EmpresaRepositorioPrisma.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const empresaRepositorio = new EmpresaRepositorioPrisma(prisma);

export const app = construirApp(empresaRepositorio);
