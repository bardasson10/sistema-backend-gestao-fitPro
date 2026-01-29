class CreateUserService {
    async execute() {
    console.log("User created successfully");
    
        return { message: "User created successfully" };
    }
}

export { CreateUserService };