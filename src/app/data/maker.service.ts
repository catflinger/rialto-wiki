import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { MakerInfo } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class MakerService {

    constructor() {}

    public observe(): Observable<readonly MakerInfo[]> {
        return from([]);
    }

    public refresh(): Promise<void> {
        return Promise.resolve();
    }

    public findMaker(id: number): MakerInfo | undefined {
        return undefined;
    }

    public editMaker(makerId: number, forename: string, surname: string, url: string): Promise<void> {
        return Promise.resolve();
    }

    public addMaker(forename: string, surname: string, url: string): Promise<MakerInfo> {
        return Promise.resolve({
            id: 0,
            forename: "",
            surname: "",
            notes: "",
            url: "",
            creditIds: []
        });
    }

    public deleteMaker(id: number): Promise<void> {
        return Promise.resolve();
    }

    public mergeMakers(originalId: number, duplicateId: number): Promise<void> {
        return Promise.resolve();
    }
}
