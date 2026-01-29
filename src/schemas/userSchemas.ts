import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z.email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    }),
});