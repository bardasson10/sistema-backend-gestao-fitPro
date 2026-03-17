import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const baseUrl = process.env.DATABASE_URL!;
const conectionString = /sslmode=/.test(baseUrl)
    ? baseUrl.replace(/sslmode=(prefer|require|verify-ca)/, 'sslmode=verify-full')
    : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sslmode=verify-full`;
const adapter = new PrismaPg({
    connectionString: conectionString,
});

const prismaClient = new PrismaClient({adapter});

export default prismaClient;