import { Injectable } from "@angular/core";
import wtf from "wtf_wikipedia";
import { MakerService } from "../data/maker.service";
import { MakerInfo } from "../interfaces";
import { isSameAs, mightBeSameAs } from "../ui/maker/maker-extensions";
import { AsCastListLayout, CastListLayout, CommaCastListLayout, HyphenCastListLayout } from "./cast-list-layouts";

export interface CastMember extends WikiCastMember {
    makerId: number,
}

interface WikiCastMember {
    forename: string;
    surname: string;
    role: string;
    link: string,
    notes: string;
}

interface WikiCastMemberLink {
    type: string, 
    page: string
}

interface WikiCastListItem {
    text: string,
    links?: WikiCastMemberLink[]
}

@Injectable({
    providedIn: 'root'
})
export class WikiCastHelperService {

    private makers: readonly MakerInfo[] = [];

    constructor(makerService: MakerService) { 
        makerService.observe().subscribe(makers => this.makers = makers );
    }

    public getCastHelp(filmUrl: string): Promise<CastMember[]> {
        return wtf.fetch(filmUrl)
        .then(reponse => {
            let wikiCast: WikiCastMember[] = [];

            if (reponse && !Array.isArray(reponse)) {
                let doc = reponse.json();

                //console.log(JSON.stringify(doc, null, 2));

                wikiCast = wikiCast.concat(this.getDirectors(doc));
                wikiCast = wikiCast.concat(this.getCastMembers(doc));
            }
            return wikiCast.map(member => this.toCastResult(member));
        })

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

        const parts: string[] = item.text.split(new RegExp(layout.expression));

        if (parts.length >= 2) {
            const notes = parts.slice(1).join(layout.separator);
            const nameParts = parts[0].trim().split(" ").filter(x => !!x.trim());

            if (nameParts.length === 1) {
                // only one word, assume just a surname
                result = {
                    forename: nameParts[0],
                    surname: "",
                    role: "actor",
                    link: this.parseLink(item.links),
                    notes,
                }
            } else if(nameParts.length === 2) {
                // exactly two words word, assume forname followed by surname
                result = {
                    forename: nameParts[0],
                    surname: nameParts[1],
                    role: "actor",
                    link: this.parseLink(item.links),
                    notes
                }
            } else if(nameParts.length > 2) {
                // more than two words word, assume single word forname, all that follows is the surname
                result = {
                    forename: nameParts[0],
                    surname: nameParts.slice(1).filter(s => s).join(" "),
                    role: "actor",
                    link: this.parseLink(item.links),
                    notes
                }
            }
        }

        return result;
    }

    private parseLink(links: WikiCastMemberLink[] | undefined): string {
        let url: string = "";

        if (links && links.length && links[0].type === "internal") {
            
            // TO DO: check that we are using en.wikipedia and not some other site/language

            // TO DO: check that the link is for the actor, not a character

            url = `https://en.wikipedia.org/wiki/${links[0].page.replace(" ", "_")}`;
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

    private toCastResult = (item: WikiCastMember): CastMember => {
        const maker = this.makers.find(maker => isSameAs(maker, item));

        return {
            forename: item.forename,
            surname: item.surname,
            link: item.link,
            role: item.role,
            notes: item.notes,
            makerId: maker ? maker.id : 0,
        }
    }

}