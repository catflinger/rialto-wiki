export type LoaderEventLevel = 'info' | 'warning' | 'error';
export type FilmSortOrder = "title" | "id" | "entry-year" | "prod-year";
export const filmSortOrders = ["title", "id", "enty-year", "prod-year"];

export enum UserRole {
    public = 0,
    guest = 1,
    contributor = 2,
    admin = 3,
    super = 4,
}

export interface LoaderEvent {
    readonly level: LoaderEventLevel;
    readonly message: string;
}

export interface Country {
    readonly id: number;
    readonly caption: string;
}

export interface Lang {
    readonly id: number;
    readonly caption: string;
}

export interface Maker {
    readonly id: number;
    readonly forename: string;
    readonly surname: string;
    readonly notes: string;
    readonly url: string;
}

export interface Tag {
    readonly id: number;
    readonly caption: string;
    readonly description: string;
}

export interface Watcher {
    readonly id: number;
    readonly caption: string;
}

export interface Collection {
    readonly id: number;
    readonly caption: string;
    readonly category: string;
    readonly notes: string;
}

export interface Medium {
    readonly id: number;
    readonly caption: string;
}

export interface FilmList {
    readonly id: number;
    readonly caption: string;
    readonly notes: string;
    readonly owner: number;
}

export interface FilmLink {
    id: number,
    filmId: number,
    itemId: number,
}

export interface Credit {
    readonly id: number;

    readonly filmId: number;
    readonly makerId: number;
    readonly role: string;
    readonly notes: string;
}

export interface FilmListItem {
    readonly id: number;
    readonly listId: number;
    readonly filmId: number;
    readonly notes: string;
}

// the film record

export interface Film {
    readonly id: number;
    readonly countryId: number;
    readonly entryYear: number;
    readonly img: string;
    readonly langId: number;
    readonly notes: string;
    readonly stars: number;
    readonly title: string;
    readonly url: string;
    readonly year: number;
    readonly revision: Date;

    readonly memberships: FilmLink[];
    readonly credits: Credit[];
    readonly purchases: FilmLink[];
    readonly labels: FilmLink[];
    readonly watches: FilmLink[];
}

// additional utility views

export interface MakerInfo {
    readonly id: number;
    readonly forename: string;
    readonly surname: string;
    readonly notes: string;
    readonly url: string;
    readonly creditIds: ReadonlyArray<number>;
}


export interface CreditInfo {

    readonly creditId: number;
    readonly role: string;
    readonly notes: string;

    readonly makerId: number;
    readonly name: string;

    readonly filmId: number;
    readonly title: string;
    readonly year: number;
}

export interface FilmInfo {
    // the credit record
    readonly id: number;
    readonly countryId: number;
    readonly entryYear: number;
    readonly img: string;
    readonly langId: number;
    readonly notes: string;
    readonly stars: number;
    readonly title: string;
    readonly url: string;
    readonly year: number;

    // some selected data from related entities
    readonly collectionIds: ReadonlyArray<number>;
    readonly makerIds: ReadonlyArray<number>;
    readonly mediumIds: ReadonlyArray<number>;
    readonly tagIds: ReadonlyArray<number>;
    readonly watcherIds: ReadonlyArray<number>;
}

export interface FilmListItemInfo {
    readonly id: number;
    readonly listId: number;
    readonly caption: string;
    readonly filmId: number;
    readonly title: string;
    readonly notes: string;
}

export type CreditAction = "add" | "update" | "delete" | "none";

export interface CreditUpdate {
    readonly id: number,
    readonly filmId: number,
    readonly makerId: number,
    readonly role: string,
    readonly action: CreditAction,
}

export interface User {
    readonly id: number,
    readonly username: string,
    readonly desktopSettings: string,
    readonly mobileSettings: string,
}

export interface Library {
    id: number,
    caption: string,
}

export interface LibraryUser {
    readonly id: number,
    readonly userId: number,
    readonly libraryId: number,
    readonly role: number,
}

export interface UserCredential {
    user: User,
    lib: LibraryUser
}

export interface LibraryUserInfo {
    libraryId: number,
    caption: string,
    role: UserRole
}

export interface Note {
    readonly id: number;
    readonly title: string;
    readonly content: string;
}

