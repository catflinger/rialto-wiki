import { Injectable } from "@angular/core";
import wtf from "wtf_wikipedia";
import { MakerService } from "../data/maker.service";
import { MakerInfo } from "../interfaces";
import { isSameAs, mightBeSameAs } from "../ui/maker/maker-extensions";
import { AsCastListLayout, CastListLayout, CommaCastListLayout, HyphenCastListLayout } from "./cast-list-layouts";

export interface CastMember extends WikiCastMember {
    makerId: number,
}

export interface WikiHelp {
    lookup: string,
    cast: CastMember[],
    image: string | null,
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
export class WikiFilmHelperService {

    private makers: readonly MakerInfo[] = [];

    private cache: WikiHelp | null = null;

    constructor(makerService: MakerService) { 
        makerService.observe().subscribe(makers => this.makers = makers );
    }

    public getCastHelp(lookup: string): Promise<WikiHelp> {
        if (this.cache && this.cache.lookup === lookup) {
            return Promise.resolve(this.cache);

        } else {
            this.cache = null;

            return wtf.fetch(lookup)
            .then(reponse => {
                let wikiCast: WikiCastMember[] = [];
                let image: string | null = null;

                if (reponse && !Array.isArray(reponse)) {
                    image = this.getImage(reponse);

                    let doc = reponse.json();

                    // console.log(JSON.stringify(doc, null, 2));

                    wikiCast = wikiCast.concat(this.getDirectors(doc));
                    wikiCast = wikiCast.concat(this.getCastMembers(doc));
                }

                this.cache = {
                    lookup,
                    cast: wikiCast.map(member => this.toCastResult(member)),
                    image
                };

                return this.cache;
            });
        }
    }

    private getImage(data: any): string | null {
        let result: string | null = null;

        if (data) {
            const firstImage = data.images()[0].json();

            // console.log(`${JSON.stringify(firstImage, null, 2)}`);

            if (firstImage && typeof firstImage.thumb === "string") {
                result = firstImage.thumb;
            }
        }
        return result;
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

                    //console.log(`INFOBOXES ${JSON.stringify(infoBoxes, null, 2)}`);

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

            /*
            TO DO: refactor all of this into modular logical units
              at the moment we just have one long procedural splurge

              Also: look to see if we can use wtf better, not calling json so soon,
              wtf("xxx").sections().json() seems to give more information than wtf("xxx").json().sections
            */

            // console.log(JSON.stringify(data.sections, null, 2));

            const castSections =
            data.sections
            .filter((s: any) => {
                return /^(cast$|cast\s?list|cast\s?listing)/i.test(s.title);
            });

            // console.log(`Cast Sections ${JSON.stringify(castSections, null, 2)}`);
            
            let wikiCastList: WikiCastListItem[] = [];

            if (castSections.length) {
                const lists = castSections[0].lists;

                // console.log(`Lists ${JSON.stringify(lists, null, 2)}`);
                
                if (lists && Array.isArray(lists) && lists.length > 0) {

                    // NOTE: merging the lists using lists.flat(1) rather than taking the first using lists[0] is
                    // an experimental feature. See if this works better or causes more trouble than it is worth

                    //const list = lists.[0];
                    const list = lists.flat(1);

                    // console.log("Matching on List");

                    if (Array.isArray(list) && list.length > 0) {
                        wikiCastList = list;
                        
                        // console.log(`FIRST LIST ${JSON.stringify(wikiCastList, null, 2)}`);
            }
                } else {
                    const templates = castSections[0].templates;

                    //console.log(`TEMPLATES ${JSON.stringify(templates, null, 2)}`);

                    if (templates && Array.isArray(templates) && templates.length > 0) {
                        const castTemplate = templates.find(item =>  /cast\s?list/i.test(item.template));

                        // console.log("Matching on Template");

                        if (castTemplate) {
                            const list = castTemplate.list;

                            /* TO DO: 
                                There is more data visible in the wikipedia page than is shown in this text.
                                Find out where the templates are and how to get extra data such as links 

                                Look at wft documentation for how to handle templates
                            */

                            if (list && Array.isArray(list) && list.length > 0) {
                                const castData = list[0];
                                if (typeof castData === "string") {
                                    wikiCastList = castData.split("\n").map(item => ({ text: item.replace(/\*+/g, "").trim()}));
                                }
                            }
                        }
                    }
                }

                if (wikiCastList.length) {
                    const layout = this.findBestLayout(wikiCastList);

                    if (layout) {
                        const cast = wikiCastList
                        .map(item => this.parseCastEntry(item, layout))
                        .filter((x): x is WikiCastMember => !!x);

                        if (cast) {
                            result = cast;
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

        //console.log(JSON.stringify(parts, null, 2))

        if (parts.length >= 2) {
            const notes = parts.slice(1).join(layout.separator);
            const nameParts = parts[0].trim().split(" ").filter(x => !!x.trim());

            /* 
            TO DO: get more detailed here with some domain knowledge:
            1) Names with XX XX De YYYY then De YYYY is the surname
            2) Names with initials such as Walter K. Dick then the K. is in the forename
            */

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
            } else if(nameParts.length > 2 && nameParts.length < 6) {
                // more than two words word, assume single word forname, all that follows is the surname
                result = {
                    forename: nameParts[0],
                    surname: nameParts.slice(1).filter(s => s).join(" "),
                    role: "actor",
                    link: this.parseLink(item.links),
                    notes
                }
            } else {
                // if there are more then 5 words to the name then this entry is probably not a cast entry at all
                // sometimes notes are added below the name and this gets mistaken as a separate list item by wtf_wikipedia
                result = undefined;
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

        // TO DO: follow with mightBeSameAs() if isSameAs() doesn't get a match
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