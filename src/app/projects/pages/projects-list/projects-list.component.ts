import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { Link, PaginatedProjects, Project, Publication } from '../../project';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { HeadingService } from '../../../services/heading.service';
import { PaginationEvent } from '../../components/pagination/pagination.component';
import { ProjectsTsvService } from '../../services/projects-tsv.service';
import { saveAs } from 'file-saver';
import { LastUpdated } from '../../lastUpdated';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.css'],
  // Don't want projects service to be a singleton since we shouldn't keep project data when not looking at ProjectsList
  // Hence, it is provided here and not in the module
  providers: [ProjectsService],
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  projects: PaginatedProjects;
  filteredProjects: Project[];
  organs: string[];
  technologies: string[];
  feedbackEmail: string = environment.feedbackEmail;

  lastUpdated: LastUpdated;

  constructor(
    private projectService: ProjectsService,
    private analyticsService: AnalyticsService,
    private headingService: HeadingService
  ) {
    this.headingService.setTitle(
      'eLwazi DS-I Africa Project Catalogue',
      'eLwazi Open Data Science Platform: Enabling data science applications for health in Africa',
      false
    );
    this.headingService.hideBreadcrumbs();
    // this.lastUpdated = {'date': '10/03/2023', 'description': 'Add suggestions from the community'};
    projectService
      .getProjectsUpdateHistory()
      .subscribe(
        (updateHistory: LastUpdated[]) => (this.lastUpdated = updateHistory[0])
      );
  }

  ngOnInit(): void {
    this.projectService.pagedProjects$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((paginatedProjects) => {
        this.projects = paginatedProjects;
      });
    this.projectService.filteredProjects$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((filteredProjects: Project[]) => {
        this.filteredProjects = filteredProjects;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // toggleDateSort(): void {
  //   const currentValues = this.projectService.currentFilters;
  //   this.projectService.setFilters({
  //     ...currentValues,
  //     recentFirst: !currentValues.recentFirst,
  //   });
  // }

  filterByProjectName($selectedProjectName: string = ''): void {
    this.projectService.setFilters({
      ...this.projectService.currentFilters,
      projectName: $selectedProjectName,
    });
  }

  filterByCountry($selectedCountry: string = ''): void {
    this.projectService.setFilters({
      ...this.projectService.currentFilters,
      country: $selectedCountry,
    });
  }

  filterByDataType($selectedDataType: string = ''): void {
    this.projectService.setFilters({
      ...this.projectService.currentFilters,
      dataType: $selectedDataType,
    });
  }

  // search($search: string = ''): void {
  //   this.projectService.setFilters({
  //     ...this.projectService.currentFilters,
  //     searchVal: $search,
  //   });
  //
  //   this.analyticsService.pushSearchTerms($search, this.projects.items);
  // }

  changePage(page: PaginationEvent) {
    this.projectService.changePage(page.currentPage);
  }

  saveSearchResultsAsTsv() {
    const columns = {
      cohort_name: 'Project',
      countries: 'Countries',
      'available_data_types.demographic': 'Demographic',
      'available_data_types.surveillance': 'Surveillance',
      'available_data_types.clinical': 'Clinical/ Phenotype',
      'available_data_types.environmental': 'Environmental/ Exposure',
      'available_data_types.climate_data': 'Climate Data',
      'available_data_types.genomic_human': 'Genomic (Human)',
      'available_data_types.genomic_pathogen': 'Genomic (Pathogen/ Infectious)',
      'available_data_types.image_data': 'Image Data',
      'available_data_types.other': 'Other Data Types',
      license: 'License',
    };
    const tsvString = ProjectsTsvService.asTsvString(
      this.filteredProjects,
      columns
    );
    const blob = new Blob([tsvString], { type: 'text/tab-separated-values' });
    saveAs(blob, 'eLwazi_catalogue_export.tsv');
  }

  mapPublicationLinks = (publications: Publication[]): Link[] => {
    return publications.map((publication) => ({
      name:
        publication.journalTitle === 'bioRxiv'
          ? 'bioRxiv (pre-publication)'
          : publication.journalTitle,
      href: publication.url,
    }));
  };
}
