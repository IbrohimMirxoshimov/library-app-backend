import { Module } from "@nestjs/common";
import { InfrastructureModule } from "app/infrastructure/infrastructure.module";

@Module({
    imports: [InfrastructureModule],
    controllers: [],
    providers: [],
    exports: [],
})
export class ApiModule {}
