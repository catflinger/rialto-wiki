import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CastMember, WikiFilmHelperService, WikiHelp } from '../wiki/wiki-film-helper.service';

@Component({
  selector: 'app-wtf',
  standalone: true,
  imports: [ JsonPipe, CommonModule, ReactiveFormsModule ],
  templateUrl: './wtf.component.html',
  styleUrl: './wtf.component.css'
})
export class WtfComponent implements OnInit {

    public help: WikiHelp = { lookup: "", cast: [], image: null };
    public errorMsg: string = "";
    public form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private helper: WikiFilmHelperService
    ) {
        this.form = fb.group({
            title: "Pulp Fiction"
            // title: "Paranoiac (film)"
        });
    }

    public ngOnInit(): void {
    }

    public onClick() {
        this.errorMsg = "";
        this.help = { lookup: "", cast: [], image: null };

        this.helper.getCastHelp(this.form.value.title)
        .then(help => this.help = help)
        .catch(error => this.errorMsg = error);

    }
}


