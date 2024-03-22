import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { FilmInfo, Film, CreditInfo, Credit } from "../interfaces";

export type LinkName = "label" | "purchase" | "watch" | "membership";

export interface FilmUpdate {
    title?: string;
    countryId?: number;
    langId?: number;
    stars?: number;
    url?: string;
    img?: string;
    notes?: string;
    year?: number;
    entryYear?: number;
}

@Injectable({
    providedIn: 'root'
})
export class FilmService {
    private bsFilms: BehaviorSubject<FilmInfo[]>;

    constructor(
    ) {
        this.bsFilms = new BehaviorSubject<FilmInfo[]>([]);
    }

    public observe(): Observable<FilmInfo[]> {
        return this.bsFilms.asObservable();
    }

    public getFilmIndex(): ReadonlyArray<FilmInfo> {
        return this.bsFilms.value;
    }
    
    public getFilmInfo(id: number): FilmInfo | undefined {
        return this.bsFilms.value.find(f => f.id === id);
    }
    
    public refresh(): Promise<void> {
        return Promise.resolve();
    }

    public getFilm(filmId: number): Promise<Film> {
        return Promise.reject();
    }

    public addCredit(filmId: number, makerId: number, role: string): Promise<void> {
        return Promise.reject();
    }

    public deleteCredit(id: number): Promise<void> {
        return Promise.reject();
    }

    public getCreditInfo(): Promise<CreditInfo[]> {
        return Promise.reject();
    }

    public deleteFilm(id: number): Promise<void> {
        return Promise.reject();
    }

    public mergeFilms(originalId: number, duplicateId: number): Promise<void> {
        return Promise.reject();
    }

    public addFilm(data: FilmUpdate): Promise<number> {
        return Promise.reject();
    }

    public updateFilm(filmId: number, data: FilmUpdate): Promise<any> {
        return Promise.reject();
    }

    public updateLink(filmId: number, resource: LinkName, ids: number[]): Promise<void> {
        return Promise.reject();
    }

}
