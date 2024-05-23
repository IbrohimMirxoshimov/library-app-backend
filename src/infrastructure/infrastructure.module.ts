import { Global, Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";

@Global()
@Module({
    imports: [DbModule],
    controllers: [],
    providers: [],
})
export class InfrastructureModule {}