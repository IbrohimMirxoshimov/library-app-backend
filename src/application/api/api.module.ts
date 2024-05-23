import { Module } from "@nestjs/common";
import { UserController } from "./controllers/user/user.controller";
import { UserModule } from "app/di/modules";
import { UsecasesProvider } from "app/di/modules/usecases/usecases";
import { ContainerApi } from "app/di/container/container";

@Module({
    imports: [ContainerApi, UserModule],
    controllers: [UserController],
    providers: [...UsecasesProvider],
    exports: [],
})
export class ApiModule {}
