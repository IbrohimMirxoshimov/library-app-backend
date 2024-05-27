import { Module } from "@nestjs/common";
import { UserController } from "./controllers/user/user.controller";
import { UserModule } from "app/di/modules";
import { UsecasesProvider } from "app/di/modules/usecases/usecases";
import { ContainerApi } from "app/di/container/container";
import { RegionsModule } from "app/di/modules/domain/regions";
import { LocationsModule } from "app/di/modules/domain/locations";

@Module({
    imports: [
        ContainerApi, 
        UserModule,
        RegionsModule,
        LocationsModule,
    ],
    controllers: [UserController],
    providers: [...UsecasesProvider],
    exports: [],
})
export class ApiModule {}
