import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailableDataTypes,
  Link,
  PaginatedProjects,
  Project,
} from '../project';
import { LastUpdated } from '../lastUpdated';

interface Filters {
  projectName: string;
  country: string;
  dataType: string;
}

@Injectable()
export class ProjectsService implements OnDestroy {
  static allowedLocations = {
    HCA: 'HCA Data Portal',
    GEO: 'GEO',
    ARRAY_EXPRESS: 'ArrayExpress',
    ENA: 'ENA',
    EGA: 'EGA',
    DBGAP: 'dbGaP',
    cellxgene: 'cellxgene',
    SCEA: 'Single Cell Expression Atlas',
    UCSC: 'UCSC Cell Browser',
  } as const;

  static allowedDataTypes = {
    Demographic: 'demographic',
    Surveillance: 'surveillance',
    'Clinical/ Phenotype': 'phenotypic_clinical_data',
    'Environmental/ Exposure': 'environmental',
    'Climate Data': 'climate_data',
    'Genomic (Human)': 'genomic_human',
    'Genomic (Pathogen/ Infectious)': 'genomic_pathogen',
    'Image Data': 'image_data',

    biospecimens: 'biospecimens',
    environmental_data: 'environmental_data',
    genomic_data: 'genomic_data',
    clinical: 'clinical',
  } as const;

  private URL = `${environment.ingestApiUrl}${environment.catalogueEndpoint}`;

  private projectsPerPage = 20;
  private currentPage: BehaviorSubject<number>;

  private availableProjects: string[];
  private availableCountries: string[];
  private availableDataTypes: string[];

  private filters: BehaviorSubject<Filters>;
  currentFilters: Filters;

  private pagedProjects = new Subject<PaginatedProjects>();
  pagedProjects$ = this.pagedProjects.asObservable();

  private filteredProjects = new Subject<Project[]>();
  filteredProjects$ = this.filteredProjects.asObservable();

  constructor(private http: HttpClient) {
    this.filters = new BehaviorSubject<Filters>({
      projectName: '',
      country: '',
      dataType: '',
    });
    this.filters.subscribe((filters) => {
      this.currentFilters = filters;
    });

    this.currentPage = new BehaviorSubject(1);

    this.changePage(1);
    this.setFilters({
      projectName: '',
      country: '',
      dataType: '',
    });

    this.retrieveProjects();
  }

  ngOnDestroy(): void {
    this.pagedProjects.complete();
    this.filteredProjects.complete();
    this.currentPage.complete();
    this.filters.complete();
  }

  private retrieveProjects(): void {
    this.getAllProjects()
      .pipe(
        tap((projects) => {
          this.availableProjects = [
            ...new Set(projects.map((project) => project.cohort_name).flat()),
          ].sort() as string[];

          this.availableCountries = [
            ...new Set(projects.map((project) => project.countries).flat()),
          ].sort() as string[];

          this.availableDataTypes = [
            'biospecimens',
            'environmental_data',
            'genomic_data',
            'phenotypic_clinical_data',
            'demographic',
            'surveillance',
            'clinical',
            'environmental',
            'climate_data',
            'genomic_human',
            'genomic_pathogen',
            'image_data',
          ].sort() as string[];
        }),
        switchMap((projects: Project[]) =>
          this.filters.pipe(
            map((filters: Filters) =>
              projects.filter((project: Project) =>
                this.filterProject(project, filters)
              )
            )
          )
        ),
        tap((projects: Project[]) => this.filteredProjects.next(projects)),
        switchMap((projects: Project[]) =>
          this.currentPage.pipe(
            map((currentPage) => {
              const paginatedProjects = projects.slice(
                (currentPage - 1) * this.projectsPerPage,
                currentPage * this.projectsPerPage
              );

              return {
                items: paginatedProjects,
                currentPage,
                itemsPerPage: this.projectsPerPage,
                totalItems: projects.length,
                availableProjects: this.availableProjects,
                availableCountries: this.availableCountries,
              };
            })
          )
        )
      )
      .subscribe({
        next: (projects) => this.pagedProjects.next(projects),
        error: (error) => this.pagedProjects.error(error),
      });
  }

  changePage(page: number) {
    this.currentPage.next(page);
  }

  setFilters(filters: Filters) {
    this.filters.next(filters);
    this.changePage(1);
  }

  public getAllProjects(): Observable<Project[]> {
    const cohortDataUrl = './assets/cohort_data.json';
    // return this.http.get<any>(this.URL).pipe(
    return this.http.get<any>(cohortDataUrl).pipe(
      map((response) => {
        if (response) {
          return response
            .map(this.formatProject)
            .filter((project) => !!project);
        }
      })
    );
  }

  public getProjectsUpdateHistory(): Observable<LastUpdated[]> {
    const updateHistoryUrl = './assets/update_history.json';
    // return this.http.get<any>(this.URL).pipe(
    return this.http.get<LastUpdated[]>(updateHistoryUrl).pipe(
      map((response) => {
        if (response) {
          return response
            .map(this.formatUpdateHistory)
            .filter((lastUpdated) => !!lastUpdated)
            .sort((a, b) => <any>b.date - <any>a.date);
        }
      })
    );
  }

  private filterProject(project, filters: Filters): boolean {
    if (
      filters.projectName &&
      !project.cohort_name.includes(filters.projectName)
    ) {
      return false;
    }

    if (filters.country && !project.countries.includes(filters.country)) {
      return false;
    }

    const dataTypeFilter = ProjectsService.allowedDataTypes[filters.dataType];
    if (filters.dataType && !project.available_data_types[dataTypeFilter]) {
      console.log(dataTypeFilter);
      return false;
    }

    return true;
  }

  formatProject = (obj: any): Project => {
    try {
      let project: Project = {
        cohort_name: obj.cohort_name,
        website: obj.website,
        license: obj.license,
        pi_lead: obj.pi_lead,
        current_enrollment: obj.current_enrollment,
        target_enrollment: obj.target_enrollment,
        enrollment_period: obj.enrollment_period,
        irb_approved_data_sharing: obj.irb_approved_data_sharing,
        available_data_types: obj.available_data_types,
        basic_cohort_attributes: obj.basic_cohort_attributes,
        countries: obj.countries,
        questionnaire_survey_data: obj.questionnaire_survey_data,
        survey_administration: obj.survey_administration,

        last_updated: '01/01/2022',
      };
      return project;
    } catch (e) {
      console.error(`Error in project ${obj.uuid.uuid}: ${e.message}`);
      return null;
    }
  };

  formatUpdateHistory = (obj: any): LastUpdated => {
    try {
      let lastUpdated: LastUpdated = {
        date: new Date(obj.date),
        description: obj.description,
      };
      return lastUpdated;
    } catch (e) {
      console.error(`Error in project ${obj.uuid.uuid}: ${e.message}`);
      return null;
    }
  };

  // formatProject = (obj: any): Project => {
  //   try {
  //     let project: Project = {
  //       uuid: obj.uuid.uuid,
  //       dcpUrl:
  //         obj.wranglingState === 'Published in DCP' &&
  //         `https://data.humancellatlas.org/explore/projects/${obj.uuid.uuid}`,
  //       addedToIndex: obj.cataloguedDate,
  //       date: obj.cataloguedDate
  //         ? ProjectsService.formatDate(obj.cataloguedDate)
  //         : '-',
  //       title:
  //         obj.content.project_core.project_title ||
  //         (() => {
  //           throw new Error('No title');
  //         })(),
  //       organs:
  //         obj.organ?.ontologies?.map((organ) => organ.ontology_label) ?? [],
  //       technologies:
  //         obj.technology?.ontologies?.map((tech) => tech.ontology_label) ?? [],
  //       // TODO: Remove usage of cellCount once the cellCount has been copied to content.estimated_cell_count
  //       // GH issue : https://github.com/ebi-ait/dcp-ingest-central/issues/445
  //       cellCount: obj.content.estimated_cell_count || obj.cellCount,
  //       enaAccessions: ProjectsService.enaAccessionLinks(
  //         obj.content?.insdc_project_accessions
  //       ),
  //       arrayExpressAccessions: ProjectsService.accessionLinks(
  //         obj.content.array_express_accessions ?? [],
  //         'https://identifiers.org/arrayexpress:'
  //       ),
  //       geoAccessions: ProjectsService.accessionLinks(
  //         obj.content.geo_series_accessions ?? [],
  //         'https://identifiers.org/geo:'
  //       ),
  //       egaAccessions: ProjectsService.egaAccessionLinks(
  //         obj.content.ega_accessions || []
  //       ),
  //       dbgapAccessions: ProjectsService.accessionLinks(
  //         obj.content.dbgap_accessions ?? [],
  //         'https://identifiers.org/dbgap:'
  //       ),
  //       cellXGeneLinks: [],
  //       sceaLinks: [],
  //       ucscLinks: [],
  //       publications: obj.publicationsInfo ?? [],
  //       authors: obj.publicationsInfo?.[0]?.authors || [],
  //     };
  //     ProjectsService.addSupplementaryLinks(
  //       project,
  //       obj.content.supplementary_links ?? []
  //     );
  //     return project;
  //   } catch (e) {
  //     console.error(`Error in project ${obj.uuid.uuid}: ${e.message}`);
  //     return null;
  //   }
  // };

  private static formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-gb', {
      timeZone: 'utc',
    });

  private static accessionLinks(
    accessions: any[],
    link_prefix: string
  ): Link[] {
    return accessions.map((accession) => ({
      name: accession,
      href: link_prefix.concat(accession),
    }));
  }

  private static enaAccessionLinks(ena_accessions: any): Link[] {
    if (typeof ena_accessions === 'string') {
      // Temp fix until ena accessions fixed in core
      ena_accessions = [ena_accessions];
    }
    return ProjectsService.accessionLinks(
      ena_accessions ?? [],
      'https://identifiers.org/ena.embl:'
    );
  }

  private static egaAccessionLinks(ega_accessions: any[]): Link[] {
    return ProjectsService.accessionLinks(
      this.captureRegexGroups(/(EGAS\d*)/i, ega_accessions),
      'https://ega-archive.org/studies/'
    ).concat(
      ProjectsService.accessionLinks(
        this.captureRegexGroups(/(EGAD\d*)/i, ega_accessions),
        'https://ega-archive.org/datasets/'
      )
    );
  }

  private static captureRegexGroups = (regex: RegExp, strings: string[]) =>
    strings
      .map((str) => regex.exec(str))
      .filter((match) => match && match.length)
      .map((match) => match[1]);

  // private static addSupplementaryLinks(project: Project, links: string[]) {
  //   const cellxRegex =
  //     /^https?:\/\/cellxgene\.cziscience\.com\/collections\/(?<accession>[^;/?:@=&\s]+)(?:\/.*)*$/i;
  //   const sceaRegex =
  //     /^https?:\/\/www\.ebi\.ac\.uk\/gxa\/sc\/experiments\/(?<accession>[^;/?:@=&\s]+)\/results(?:\/tsne)?$/i;
  //   const ucscPostRegex =
  //     /^https?:\/\/(?:.*\.)?cells\.ucsc\.edu\/?\?(?:.*&)*ds=(?<accession>[^;\/?:@=&\s]+)(?:&.*)*$/i;
  //   const ucscPreRegex =
  //     /^https?:\/\/(?<accession>[^;\/?:@=&\s]+)\.cells\.ucsc\.edu\/?(?:\?.*)?$/i;
  //
  //   links.forEach((link) => {
  //     let match = cellxRegex.exec(link);
  //     if (match) {
  //       project.cellXGeneLinks.push({
  //         name: match.groups.accession,
  //         href: link,
  //       });
  //     }
  //     match = sceaRegex.exec(link);
  //     if (match) {
  //       project.sceaLinks.push({
  //         name: match.groups.accession,
  //         href: link,
  //       });
  //     }
  //     match = ucscPostRegex.exec(link);
  //     if (!match) {
  //       match = ucscPreRegex.exec(link);
  //     }
  //     if (match) {
  //       project.ucscLinks.push({
  //         name: match.groups.accession,
  //         href: link,
  //       });
  //     }
  //   });
  // }
}
