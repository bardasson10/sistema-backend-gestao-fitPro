import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const conectionString = `${process.env.DATABASE_URL!}`;
const adapter = new PrismaPg({
    connectionString: conectionString,
});

const prismaClient = new PrismaClient({adapter});

export default prismaClient;