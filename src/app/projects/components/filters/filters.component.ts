import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  @Input()
  projectName: string[];

  @Input()
  country: string[];

  @Output()
  selectedProjectName = new EventEmitter<string>();

  @Output()
  selectedCountry = new EventEmitter<string>();

  countries = ['Ghana', 'Kenya', 'South Africa'];

  constructor() {}

  ngOnInit(): void {}

  onProjectNameChange($event) {
    this.selectedProjectName.emit($event.target.value);
  }

  onCountryChange($event) {
    this.selectedCountry.emit($event.target.value);
  }
}
