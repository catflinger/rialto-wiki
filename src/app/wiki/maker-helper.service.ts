import { Injectable } from "@angular/core";
import wtf from "wtf_wikipedia";
import { FilmInfo } from "../interfaces";
import { FilmService } from "../data/film.service";

interface WikiMakerHelp {
    lookup: string,
    credits: Credit[],
}

interface Credit {
    title: string;
    year: number;
    role: string;
    notes: string;
    filmId: number;
}

@Injectable({
    providedIn: 'root'
})
export class WikiMakerHelperService {

    private films: readonly FilmInfo[] = [];
    private cache: WikiMakerHelp | null = null;

    constructor(filmService: FilmService) { 
        filmService.observe().subscribe(films => this.films = films );
    }

    public getMakerHelp(lookup: string): Promise<WikiMakerHelp> {
        if (this.cache && this.cache.lookup === lookup) {
            return Promise.resolve(this.cache);

        } else {
            this.cache = null;

            return wtf.fetch(lookup)
            .then(doc => {
                let credits: Credit[] = [];

                console.log(`STARTING`)

                if (doc && !Array.isArray(doc)) {

                    // console.log(`${JSON.stringify(doc.json())}  `)

                    credits = this.getCredits(doc);
                }

                this.cache = {
                    lookup,
                    credits,
                };

                return this.cache;
            });
        }
    }

    private getCredits(doc: wtf.Document): Credit[] {
        let credits: Credit[]= [];

        const _filmographySections =
        doc.sections()
        .filter((_s: any) => {
            return /^film$/i.test(_s.title());
        });

        if (_filmographySections.length) {

            console.log(`Found film section`)

            const _tables = _filmographySections.flat()[0].tables();

            if (_tables && Array.isArray(_tables) && _tables.length > 0) {
                console.log(`found ${_tables.length} tables`);

                const firstTable = _tables[0].json();

                console.log(`TABLES ${JSON.stringify(firstTable, null, 2)}`);

                credits = firstTable.map((item: any) => ({
                    title: item.Title.text,
                    year: item.Year.number,
                    role: "actor",
                    notes: item.Role.text + (item.Notes.text ? ` - ${item.Notes.text}` : ""),
                    filmId: 0,
                }));
            }
        }
        return credits;
    }

}