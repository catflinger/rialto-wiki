import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CastMember, WikiFilmHelperService, WikiHelp } from '../wiki/wiki-film-helper.service';
import wtf from "wtf_wikipedia";

interface WikiLink {
    text: string;
    url: string;
}

@Component({
  selector: 'app-wtf',
  standalone: true,
  imports: [ JsonPipe, CommonModule, ReactiveFormsModule ],
  templateUrl: './wtf.component.html',
  styleUrl: './wtf.component.css'
})
export class WtfComponent implements OnInit {

    //public help: WikiHelp = { lookup: "", cast: [], image: null };
    public help: any = null;
    public errorMsg: string = "";
    public form: FormGroup;

    constructor(
        fb: FormBuilder,
        private helper: WikiFilmHelperService
    ) {
        this.form = fb.group({
            // title: "Mission: Impossible II"
            title: "Pulp Fiction"
            // title: "Paranoiac (film)",
            //title: "The_Fallen_Idol_(film)"
        });
    }

    public ngOnInit(): void {
    }

    public onClick() {
        this.errorMsg = "";
        //this.help = { lookup: "", cast: [], image: null };

        this.helper.getCastHelp(this.form.value.title)
        //this.getLinks(this.form.value.title)
        .then(help => this.help = help)
        //.catch(error => this.errorMsg = error);
    }

    /* 
        VARIABLE NAMING: variables with wft types are prefixed with an unserscore to distinguish them from the POCOs they wrap
        let _title: wft.text = _section.title()
        let title: string = _title.json()

        confusingly the json() method of a wtf type returns a POCO, not a json representation of the POCO as the name would suggest
    */
    public getLinks(lookup: string): Promise<WikiLink[]> {

        return wtf.fetch(lookup)
        .then(_response => {
            let result: WikiLink[] = [];

            if (_response && !Array.isArray(_response)) {

                let _sections = _response.sections();

                const _castSections =
                _sections.filter((_s: any) => {
                    return /^(cast$|cast\s?list|cast\s?listing)/i.test(_s.title());
                });

                const _templates = _castSections[0].templates();

                if (_templates && Array.isArray(_templates) && _templates.length > 0) {
                    const _castTemplates = _templates.filter(_item =>  /cast/i.test(_item.json().template));

                    const _castTemplate = _castTemplates[0];

                    result = this.getLinksFromTemplate(_castTemplate.wikitext());
                }
            }
            return result;
        });
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
}


