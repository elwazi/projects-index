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

  @Input()
  dataType: string[];

  @Output()
  selectedProjectName = new EventEmitter<string>();

  @Output()
  selectedCountry = new EventEmitter<string>();

  @Output()
  selectedDataType = new EventEmitter<string>();

  countries = [
    'Cameroon',
    'Ghana',
    'Kenya',
    'South Africa',
    'sub-Saharan Africa',
  ];
  dataTypes = [
    'Demographic',
    'Surveillance',
    'Clinical/ Phenotype',
    'Environmental/ Exposure',
    'Climate Data',
    'Genomic (Human)',
    'Genomic (Pathogen/ Infectious)',
    'Image Data',
  ];

  constructor() {}

  ngOnInit(): void {}

  onProjectNameChange($event) {
    this.selectedProjectName.emit($event.target.value);
  }

  onCountryChange($event) {
    this.selectedCountry.emit($event.target.value);
  }

  onDataTypeChange($event) {
    this.selectedDataType.emit($event.target.value);
  }
}
