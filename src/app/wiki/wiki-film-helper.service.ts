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

interface WikiLink {
    text: string;
    url: string;
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
            .then(doc => {
                let wikiCast: WikiCastMember[] = [];
                let image: string | null = null;

                if (doc && !Array.isArray(doc)) {
                    image = this.getImage(doc);

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

    private getImage(data: wtf.Document): string | null {
        let result: string | null = null;

        if (data) {
            const firstImage: any = data.images()[0].json();

            // console.log(`${JSON.stringify(firstImage, null, 2)}`);

            if (firstImage && typeof firstImage.thumb === "string") {
                result = firstImage.thumb;
            }
        }
        return result;
    }

    private getDirectors(data: wtf.Document): WikiCastMember[] {
        let result = [];

        if (data) {
            const _sections = data.sections();
            if (_sections && Array.isArray(_sections) && _sections.length > 0) {
                const _firstSection = _sections[0];

                if (_firstSection) {
                    const _infoBoxes = _firstSection.infoboxes();

                    if (_infoBoxes && Array.isArray(_infoBoxes) && _infoBoxes.length > 0) {

                        const directorInfo = _infoBoxes[0].json()["director"];

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

    private getCastMembers(data: wtf.Document): WikiCastMember[] {
        let result: WikiCastMember[] = [];

        if (data) {
            console.log(`STARTING`);

            data.sections().forEach((_section, index) =>  console.log(`SECTION ${index} title - [${_section.title()}]`));

            const _castSections =
            data.sections()
            .filter((_s: any) => {
                return /^(cast|cast\s?list|cast\s?listing)/i.test(_s.title());
            });

            let wikiCastList: WikiCastListItem[] = [];
            let links: WikiLink[] = [];

            console.log(`FOUND ${_castSections.length} setions`)

            if (_castSections.length) {

                console.log(`FRIST SECTION ${JSON.stringify(_castSections[0].json({}), null, 2)}`)

                const _lists = _castSections[0].lists();

                if (_lists && 
                    Array.isArray(_lists) && 
                    _lists.length > 0 &&
                    !/notes/i.test(_lists[0].text())) {
                        
                    console.log(`using cast list`);

                    _lists.forEach((_section, index) =>  console.log(`LIST ${index} text - ${_section.text({})}`));

                    const _firstList = _lists[0].json();

                    //console.log(`CAST LSIT ${JSON.stringify(_firstList, null, 2)}`);

                    if (Array.isArray(_firstList) && _firstList.length > 0) {
                        wikiCastList = _firstList;
                    }
                } else {
                    console.log(`using templates`);

                    const _templates = _castSections[0].templates();

                    if (_templates && Array.isArray(_templates) && _templates.length > 0) {
                        const _castTemplate = _templates.find(_item =>  /cast\s?list/i.test(_item.json().template));

                        //console.log(`CAST TEMPLATE ${JSON.stringify(_castTemplate.json(), null, 2)}`);

                        if (_castTemplate) {
                            const list = _castTemplate.json().list;

                            if (list && Array.isArray(list) && list.length > 0) {
                                const castData = list[0];
                                links = this.getLinksFromTemplate(_castTemplate.wikitext());

                                if (typeof castData === "string") {
                                    wikiCastList = castData.split("\n").map(item => ({
                                         text: item.replace(/\*+/g, "").trim(),
                                    }));

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
                            result = this.addMissingLinks(cast, links);
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
                
                // TO DO: if the second word is an initial then add this to teh forname instead
                const surnameOffset = nameParts[1].replace(".", "").length === 1 ? 2 : 1;

                result = {
                    forename: nameParts.slice(0, surnameOffset).join(" "),
                    surname: nameParts.slice(surnameOffset).filter(s => s).join(" "),
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
        // think of a way to convey the confidence of the match in the UI
        const maker = this.makers.find(maker => mightBeSameAs(maker, item));

        return {
            forename: item.forename,
            surname: item.surname,
            link: item.link,
            role: item.role,
            notes: item.notes,
            makerId: maker ? maker.id : 0,
        }
    }

    private getLinksFromTemplate(wikitext: string): WikiLink[] {
        let links: string[] = [];
        const matches = /\{\{[^|]+\|(.+)\}\}/s.exec(wikitext);

        if (matches && matches.length > 1) {
            const reg = /\[\[([^\]]+)\]\]/g;
            const s = matches[1];

            let linkMatch = reg.exec(s);

            while (linkMatch) {
                links.push(linkMatch[1]);
                linkMatch = reg.exec(s);
            } ;
        }

        return links.map(link => {
            const parts = link.split("|");
            
            const first = parts[0].trim();
            const second = parts.length > 1 ? parts[1].trim() : "";

            return {
                text: !!second ? second : first,
                url: `https://en.wikipedia.org/wiki/${first.replace(/\s+/g, "_")}`
            };
        })
    }

    private addMissingLinks(cast: WikiCastMember[], links: WikiLink[]) {

        cast.forEach(member => {
            if (!member.link) {
                let link = links.find(link => link.text === member.forename + " " + member.surname);

                if (link) {
                    member.link = link.url;
                }
            }
        })
        return cast;
    }

}