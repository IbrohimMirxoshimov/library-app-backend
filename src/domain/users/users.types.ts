import { Id } from "../Id/id.types";

export type User = {
    id: Id;
    firstname: string;
    lastname: string;
    locationId: string;
    createdAt: string;
    updatedAt: string;
};

export type UserCreate = Omit<User, "id" | "createdAt" | "updatedAt">;
