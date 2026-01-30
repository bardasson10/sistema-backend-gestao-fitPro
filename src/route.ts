import { Router } from "express";
import { CreateUserController } from "./controllers/user/CreateUserController";
import { validateSchema } from "./middlewares/validateSchema";
import { authenticateUserSchema, createUserSchema } from "./schemas/userSchemas";
import { AuthenticateUserController } from "./controllers/user/AuthUserController";
import { ListAllUserController } from "./controllers/user/ListAllUserController";
import { ListByIdUserController } from "./controllers/user/ListByIdUserController";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { isAdmin } from "./middlewares/IsAdmin";


const router = Router();

router.post("/users", validateSchema(createUserSchema), new CreateUserController ().handle);
router.post("/session", validateSchema(authenticateUserSchema), new AuthenticateUserController().handle);

router.get("/users/all", isAuthenticated, new ListAllUserController().handle);
router.get("/user/me", isAuthenticated, new ListByIdUserController().handle);
router.get("/user/:id", isAuthenticated, isAdmin, new ListByIdUserController().handle);
export { router };