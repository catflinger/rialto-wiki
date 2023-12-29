import { JsonPipe, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import wtf from "wtf_wikipedia";

@Component({
  selector: 'app-wtf',
  standalone: true,
  imports: [ JsonPipe, NgFor ],
  templateUrl: './wtf.component.html',
  styleUrl: './wtf.component.css'
})
export class WtfComponent implements OnInit {

    public filmography: any;
    public data: any = undefined;

    public ngOnInit(): void {
        wtf.fetch("Dirk Bogarde").then(doc => {
            if (doc && !Array.isArray(doc)) {
                let a:any = doc.json();

                if (a) {

                    const filmographySection =
                    a.sections
                    .filter((s: any) => {
                        let title: string = typeof s.title === "string" ? s.title : "";
                        return /filmography/i.test(title);
                    });

                    if (filmographySection.length) {
                        const tables = filmographySection[0].tables;
                        
                        if (tables && Array.isArray(tables) && tables.length > 0) {
                            const firstTable = tables[0];

                            if (Array.isArray(firstTable) && firstTable.length > 0) {
                                const sample = firstTable[0];

                                if (sample.Year && sample.Title) {
                                    this.filmography = firstTable;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}
