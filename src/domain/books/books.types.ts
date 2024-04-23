import { Id } from "../Id/id.types";

export type Book = {
    id: Id;
    name?: string;
    authorId: Id;
    rentDurationId: Id;
    pages: number;
    booksGroupId: number;
    publisherId: Id;
    collectionId: Id;
};
