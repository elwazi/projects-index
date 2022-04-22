import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Link, PaginatedProjects, Project } from '../project';

interface Filters {
  organ: string;
  technology: string;
  location: string;
  searchVal: string;
  recentFirst: boolean;
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

  private URL = `${environment.ingestApiUrl}${environment.catalogueEndpoint}`;

  private projectsPerPage = 20;
  private currentPage: BehaviorSubject<number>;

  private availableTechnologies: string[];
  private availableOrgans: string[];

  private filters: BehaviorSubject<Filters>;
  currentFilters: Filters;

  private pagedProjects = new Subject<PaginatedProjects>();
  pagedProjects$ = this.pagedProjects.asObservable();

  private filteredProjects = new Subject<Project[]>();
  filteredProjects$ = this.filteredProjects.asObservable();

  constructor(private http: HttpClient) {
    this.filters = new BehaviorSubject<Filters>({
      organ: '',
      technology: '',
      location: '',
      searchVal: '',
      recentFirst: true,
    });
    this.filters.subscribe((filters) => {
      this.currentFilters = filters;
    });

    this.currentPage = new BehaviorSubject(1);

    this.changePage(1);
    this.setFilters({
      organ: '',
      technology: '',
      location: '',
      searchVal: '',
      recentFirst: true,
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
          this.availableOrgans = [
            ...new Set(projects.map((project) => project.organs).flat()),
          ].sort() as string[];

          this.availableTechnologies = [
            ...new Set(projects.map((project) => project.technologies).flat()),
          ].sort() as string[];
        }),
        switchMap((projects: Project[]) =>
          this.filters.pipe(
            map((filters: Filters) =>
              projects
                .filter((project: Project) =>
                  this.filterProject(project, filters)
                )
                .sort((a, b) => {
                  if (filters.recentFirst) {
                    return a.addedToIndex <= b.addedToIndex ? 1 : -1;
                  }
                  return a.addedToIndex <= b.addedToIndex ? -1 : 1;
                })
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
                availableOrgans: this.availableOrgans,
                availableTechnologies: this.availableTechnologies,
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
    return this.http.get<any>(this.URL).pipe(
      map((response) => {
        if (response) {
          return response._embedded.projects
            .map(this.formatProject)
            .filter((project) => !!project);
        }
      })
    );
  }

  private filterProject(project, filters: Filters): boolean {
    if (filters.organ && !project.organs.includes(filters.organ)) {
      return false;
    }
    if (
      filters.technology &&
      !project.technologies.includes(filters.technology)
    ) {
      return false;
    }
    switch (filters.location) {
      case ProjectsService.allowedLocations.HCA:
        if (!project.dcpUrl) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.GEO:
        if (!project.geoAccessions.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.ARRAY_EXPRESS:
        if (!project.arrayExpressAccessions.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.ENA:
        if (!project.enaAccessions.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.EGA:
        if (
          !(
            !!project.egaStudiesAccessions.length ||
            !!project.egaDatasetsAccessions.length
          )
        ) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.DBGAP:
        if (!project.dbgapAccessions.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.cellxgene:
        if (!project.cellXGeneLinks.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.SCEA:
        if (!project.sceaLinks.length) {
          return false;
        }
        break;
      case ProjectsService.allowedLocations.UCSC:
        if (!project.ucscLinks.length) {
          return false;
        }
        break;
      default:
        break;
    }

    const toSearch = [
      project.authors.map((author) => author.fullName).join(', '),
      project.uuid,
      project.title,
      project.arrayExpressAccessions.join(' '),
      project.geoAccessions.join(' '),
      project.egaDatasetsAccessions.join(' '),
      project.egaStudiesAccessions.join(' '),
      project.enaAccessions.map((acc) => acc.name).join(' '),
      project.organs.join(' '),
      project.technologies.join(' '),
    ]
      .map((x) => x.toLowerCase())
      .join(' ');

    const searchKeywords = filters.searchVal.toLowerCase().split(' ');
    return searchKeywords.every((keyword) => toSearch.includes(keyword));
  }

  private formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-gb', {
      timeZone: 'utc',
    });

  private captureRegexGroups = (regex: RegExp, strings: string[]) =>
    strings
      .map((str) => regex.exec(str))
      .filter((match) => match && match.length)
      .map((match) => match[1]);

  formatProject = (obj: any): Project => {
    try {
      let project: Project = {
        uuid: obj.uuid.uuid,
        dcpUrl:
          obj.wranglingState === 'Published in DCP' &&
          `https://data.humancellatlas.org/explore/projects/${obj.uuid.uuid}`,
        addedToIndex: obj.cataloguedDate,
        date: obj.cataloguedDate ? this.formatDate(obj.cataloguedDate) : '-',
        title:
          obj.content.project_core.project_title ||
          (() => {
            throw new Error('No title');
          })(),
        organs:
          obj.organ?.ontologies?.map((organ) => organ.ontology_label) ?? [],
        technologies:
          obj.technology?.ontologies?.map((tech) => tech.ontology_label) ?? [],
        // TODO: Remove usage of cellCount once the cellCount has been copied to content.estimated_cell_count
        // GH issue : https://github.com/ebi-ait/dcp-ingest-central/issues/445
        cellCount: obj.content.estimated_cell_count || obj.cellCount,
        // Temp fix until ena accessions fixed in core
        enaAccessions: ProjectsService.enaAccessionLinks(
          obj.content?.insdc_project_accessions
        ),
        geoAccessions: obj.content.geo_series_accessions ?? [],
        arrayExpressAccessions: obj.content.array_express_accessions ?? [],
        egaStudiesAccessions: this.captureRegexGroups(
          /(EGAS\d*)/i,
          obj.content.ega_accessions || []
        ),
        egaDatasetsAccessions: this.captureRegexGroups(
          /(EGAD\d*)/i,
          obj.content.ega_accessions || []
        ),
        dbgapAccessions: obj.content.dbgap_accessions ?? [],
        cellXGeneLinks: [],
        sceaLinks: [],
        ucscLinks: [],
        publications: obj.publicationsInfo ?? [],
        authors: obj.publicationsInfo?.[0]?.authors || [],
      };
      ProjectsService.addSupplementaryLinks(
        project,
        obj.content.supplementary_links ?? []
      );
      return project;
    } catch (e) {
      console.error(`Error in project ${obj.uuid.uuid}: ${e.message}`);
      return null;
    }
  };

  private static enaAccessionLinks(ena_accessions: any): Link[] {
    if (typeof ena_accessions === 'string') {
      ena_accessions = [ena_accessions];
    }
    return (ena_accessions ?? []).map((accession) => ({
      name: accession,
      href: `https://identifiers.org/ena.embl:${accession}`,
    }));
  }

  private static addSupplementaryLinks(project: Project, links: string[]) {
    const cellxRegex =
      /^https?:\/\/cellxgene\.cziscience\.com\/collections\/(?<accession>[^;/?:@=&\s]+)(?:\/.*)*$/i;
    const sceaRegex =
      /^https?:\/\/www\.ebi\.ac\.uk\/gxa\/sc\/experiments\/(?<accession>[^;/?:@=&\s]+)\/results(?:\/tsne)?$/i;
    const ucscRegex =
      /^https?:\/\/cells\.ucsc\.edu\/\?(.*&)*(ds=(?<accession>[^;/?:@=&\s]+))(?:&.*)*$/i;

    links.forEach((link) => {
      let match = cellxRegex.exec(link);
      if (match) {
        project.cellXGeneLinks.push({
          name: match.groups.accession,
          href: link,
        });
      }
      match = sceaRegex.exec(link);
      if (match) {
        project.sceaLinks.push({
          name: match.groups.accession,
          href: link,
        });
      }
      match = ucscRegex.exec(link);
      if (match) {
        project.ucscLinks.push({
          name: match.groups.accession,
          href: link,
        });
      }
    });
  }
}
