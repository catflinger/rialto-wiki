import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import wtf from "wtf_wikipedia";
import { AsCastListLayout, CastListLayout, CommaCastListLayout, HyphenCastListLayout } from '../wiki/cast-list-layouts';

export interface WikiFilm {
    year: number;
    title: string;
}

export interface WikiCastMember {
    forename: string;
    surname: string;
    role: string;
    notes?: string;
    link?: string; // TO DO: consider renamimg this as url, to distinguish from a wiki link?
}

interface WikiCastMemberLink {
    type: string, 
    page: string
}

interface WikiCastListItem {
    text: string,
    links?: WikiCastMemberLink[]
}

// expect the entry to be of form "name - role"
// "Sean Connery - James Bond" or maybe "Katie Fisher-Price - the model"
const withAsExp = new RegExp("\\s+as\\s+");
const withCommaExp = new RegExp(",\\s+");

@Component({
  selector: 'app-wtf',
  standalone: true,
  imports: [ JsonPipe, CommonModule, ReactiveFormsModule ],
  templateUrl: './wtf.component.html',
  styleUrl: './wtf.component.css'
})
export class WtfComponent implements OnInit {

    public cast: WikiCastMember[] = [];
    public errorMsg: string = "";
    public form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = fb.group({
            // title: "High Life (2018 film)"
            title: "Hell Is a City"
        });
    }

    public ngOnInit(): void {
    }

    public onClick() {
        this.errorMsg = "";
        this.cast = [];

        wtf.fetch(this.form.value.title)
        .then(result => {
            if (result && !Array.isArray(result)) {
                let doc = result.json();
                let cast: WikiCastMember[] = [];

                //console.log(JSON.stringify(doc, null, 2));

                cast = cast.concat(this.getDirectors(doc));
                cast = cast.concat(this.getCastMembers(doc));
                this.cast = cast;
            }
        })
        .catch(error => this.errorMsg = error);
    }

    private getDirectors(data: any): WikiCastMember[] {
        let result = [];

        // console.log(`getDirectors data = ${JSON.stringify(data, null, 2)}`);

        if (data) {
            const sections = data.sections;
            if (sections && Array.isArray(sections) && sections.length > 0) {
                const firstSection = sections[0];

                if (firstSection) {
                    const infoBoxes = firstSection.infoboxes;

                    //console.log(`INFOBOXES length = ${infoBoxes.length}`);

                    if (infoBoxes && Array.isArray(infoBoxes) && infoBoxes.length > 0) {
                        const directorInfo = infoBoxes[0]["director"];

                        // console.log(`INFOBOXES ${JSON.stringify(infoBoxes, null, 2)}`);

                        if (directorInfo) {
                            let director = this.parseDirectorInfo(directorInfo);
                            if (director) {
                                result.push(director);
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    private getCastMembers(data: any): WikiCastMember[] {
        let result: WikiCastMember[] = [];

        if (data) {

            // console.log(JSON.stringify(data, null, 2));

            const castSection =
            data.sections
            .filter((s: any) => {
                //let title: string = typeof s.title === "string" ? s.title : "";
                return /cast/i.test(s.title);
            });

            // console.log(`Cast Section ${JSON.stringify(castSection, null, 2)}`);

            if (castSection.length) {
                const lists = castSection[0].lists;

                // console.log(`Lists ${JSON.stringify(lists, null, 2)}`);
                
                if (lists && Array.isArray(lists) && lists.length > 0) {
                    const firstList = lists[0];

                    if (Array.isArray(firstList) && firstList.length > 0) {

                        const layout = this.findBestLayout(firstList);

                        if (layout) {
                            const cast = firstList
                            .map(item => this.parseCastEntry(item, layout))
                            .filter((x): x is WikiCastMember => x != null);

                            if (cast) {
                                result = cast;
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    private findBestLayout(entries: {text: string}[]): CastListLayout | undefined {
        const candidates: CastListLayout[] = [
            new AsCastListLayout(),
            new HyphenCastListLayout(),
            new CommaCastListLayout(),
        ];

        candidates.forEach(candidate => candidate.scoreCastEntry(entries));

        const highestScorer = candidates.reduce(
            (result: CastListLayout | undefined, current: CastListLayout): CastListLayout | undefined => {
                if (!result || result.score < current.score) {
                    return current;
                } else {
                    return result;
                };
            },
            undefined
        );

        return highestScorer;
    }

    private parseCastEntry(item: WikiCastListItem, layout: CastListLayout): WikiCastMember | undefined {
        let result: WikiCastMember | undefined = undefined;

        // console.log("Matching on " + layout.separator);

        const parts: string[] = item.text.split(new RegExp(layout.expression));

        if (parts.length >= 2) {
            const notes = parts.slice(1).join(layout.separator);
            const nameParts = parts[0].trim().split(" ").filter(x => !!x.trim());

            // console.log(`nameParts length is ${nameParts.length}`);

            if (nameParts.length === 1) {
                // only one word, assume just a surname
                result = {
                    forename: nameParts[0],
                    surname: "",
                    role: "actor",
                    notes,
                    link: this.parseLink(item.links)
                }
            } else if(nameParts.length === 2) {
                // exactly two words word, assume forname followed by surname
                result = {
                    forename: nameParts[0],
                    surname: nameParts[1],
                    role: "actor",
                    notes,
                    link: this.parseLink(item.links)
                }
            } else if(nameParts.length > 2) {
                // more than two words word, assume single word forname, all that follows is the surname
                result = {
                    forename: nameParts[0],
                    surname: nameParts.slice(1).filter(s => s).join(" "),
                    role: "actor",
                    notes,
                    link: this.parseLink(item.links)
                }
            }
        }

        // console.log("Returning " + JSON.stringify(result))

        return result;
    }

    private parseLink(links: WikiCastMemberLink[] | undefined): string {
        let url: string = "";

        if (links && links.length && links[0].type === "internal") {
            
            // TO DO: check that we are using en.wikipedia and not some other site/language

            // TO DO: check that the link is for the actor, not a character

            url = `https://en.wikipedia.org/wiki/${links[0].page.replaceAll(" ", "_")}`;
        }

        return url;
    }

    private parseDirectorInfo(info: any): WikiCastMember | undefined {
        let nameParts = info.text.split(" ");

        return {
            forename: nameParts[0],
            surname: nameParts.length > 1 ? nameParts.slice(1).join(" ") : ";",
            role: "director",
            notes: "",
            link: this.parseLink(info.links),
        };
    }
}


    // private findBestLayout(entries: string[]): ListLayout {
    //     let text = entries[0];
        
    //     // TO DO: need to improve this.  A good start, but we need to lok at all entries somehow
    //     // how are the list items separated????

    //     let exp: RegExp = withHyphenExp;
    //     let separator: string = "-";
    //     let position = this.findFirstPositionOf(text, exp);

    //     let challenger: RegExp = withAsExp;
    //     if (this.findFirstPositionOf(text, challenger) < position) {
    //         exp = challenger;
    //         separator = "as";
    //     }

    //     challenger = withCommaExp;
    //     if (this.findFirstPositionOf(text, challenger) < position) {
    //         exp = challenger;
    //         separator = ",";
    //     }
    //     return { exp, separator };
    // }



    // private findFirstPositionOf(text: string, expression: RegExp): number {
    //     let position = 9999;
    //     let match = expression.exec(text);

    //     if (match) {
    //         position = match.index;
    //     }

    //     return position;
    // }

        // wtf.fetch("Dirk Bogarde").then(doc => {
        //     if (doc && !Array.isArray(doc)) {
        //         let a:any = doc.json();

        //         if (a) {

        //             const filmographySection =
        //             a.sections
        //             .filter((s: any) => {
        //                 let title: string = typeof s.title === "string" ? s.title : "";
        //                 return /filmography/i.test(title);
        //             });

        //             if (filmographySection.length) {
        //                 const tables = filmographySection[0].tables;
                        
        //                 if (tables && Array.isArray(tables) && tables.length > 0) {
        //                     const firstTable = tables[0];

        //                     if (Array.isArray(firstTable) && firstTable.length > 0) {
        //                         const sample = firstTable[0];

        //                         if (sample.Year && sample.Title) {
        //                             this.filmography = firstTable.map(item => ({
        //                                 year: item.Year.number,
        //                                 title: item.Title.text
        //                             }));
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // });

