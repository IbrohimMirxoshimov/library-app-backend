import { Global, Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";

@Global()
@Module({
    imports: [
        DbModule
    ],
    providers: [],
})
export class InfrastructureModule {}
