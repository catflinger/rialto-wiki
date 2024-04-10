import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WikiFilmHelperService } from '../wiki/wiki-film-helper.service';
import { WikiMakerHelperService } from '../wiki/maker-helper.service';

@Component({
  selector: 'app-wtf',
  standalone: true,
  imports: [ JsonPipe, CommonModule, ReactiveFormsModule ],
  templateUrl: './wtf.component.html',
  styleUrl: './wtf.component.css'
})
export class WtfComponent implements OnInit {

    public help: any = null;
    public errorMsg: string = "";
    public form: FormGroup;

    constructor(
        fb: FormBuilder,
        private helper: WikiFilmHelperService,
        private makerHelper:WikiMakerHelperService,
    ) {
        this.form = fb.group({
            // title: "Mission: Impossible II"
            // title: "Pulp Fiction",
            title: "The Paradine Case",
            //title: "The_Fallen_Idol_(film)",
            maker: "https://en.wikipedia.org/wiki/Joan_Bennett"
        });
    }

    public ngOnInit(): void {
    }

    public onClick() {
        this.errorMsg = "";

        this.helper.getCastHelp(this.form.value.title)
        //this.makerHelper.getMakerHelp(this.form.value.maker)
        .then(help => this.help = help)
        //.catch(error => this.errorMsg = error);
    }


}


