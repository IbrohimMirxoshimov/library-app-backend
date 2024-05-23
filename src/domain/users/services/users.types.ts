import { Id } from "app/domain/common/id.types";

export type UserModel = {
    id: Id;
    firstname: string;
    lastname: string;
    locationId: string;
    createdAt: string;
    updatedAt: string;
};

export type UserCreate = Omit<UserModel, "id" | "createdAt" | "updatedAt">;
