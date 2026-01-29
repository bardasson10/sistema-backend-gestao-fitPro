import { Router } from "express";
import { CreateUserController } from "./controllers/user/CreateUserController";
import { validateSchema } from "./middlewares/validateSchema";
import { authenticateUserSchema, createUserSchema } from "./schemas/userSchemas";
import { AuthenticateUserController } from "./controllers/user/AuthUserController";

const router = Router();

router.post("/users", validateSchema(createUserSchema), new CreateUserController ().handle);
router.post("/session", validateSchema(authenticateUserSchema), new AuthenticateUserController().handle);
export { router };