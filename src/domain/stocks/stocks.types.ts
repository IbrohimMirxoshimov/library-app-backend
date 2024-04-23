import { Id } from "../Id/id.types";

export type Stock = {
    id: Id;
    busy: boolean;
    bookId: Id;
    stockId: Id;
    locationId: Id;
    created_at: Date;
};
