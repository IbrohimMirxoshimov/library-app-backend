import { ValidationPipe, HttpStatus, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiModule } from "./application/api/api.module";

async function bootstrap() {
    const app = await NestFactory.create(ApiModule);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    );
    app.enableCors();
    app.enableVersioning({ type: VersioningType.URI });

    const config = new DocumentBuilder()
        .addBearerAuth()
        .addSecurityRequirements("bearer")
        .setTitle(`Library API`)
        .setDescription("Mehr kutubxonasidan kitob olish uchun applicationlar uchun API")
        .setVersion("2.0")
        .addTag(``)
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
    await app.init();

    await app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running port ${process.env.PORT}`);
    });
}
bootstrap();
