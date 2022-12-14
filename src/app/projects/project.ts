export interface Link {
  name: string;
  href: string;
}

export interface Publication {
  doi: string;
  url: string;
  journalTitle: string;
  title: string;
  authors: string[];
}

export interface AvailableDataTypes {
  biospecimens: boolean;
  environmental_data: boolean;
  genomic_data: boolean;
  phenotypic_clinical_data: boolean;

  demographic: boolean;
  surveillance: boolean;
  clinical: boolean;
  environmental: boolean;
  climate_data: boolean;
  genomic_human: boolean;
  genomic_pathogen: boolean;
  image_data: boolean;
  other: string[];
}

export interface CohortAncestry {
  asian: string;
  black_african_american_or_african: string;
  european_or_white: string;
  hispanic_latino_or_spanish: string;
  middle_eastern_or_north_african: string;
  other: string;
}

export interface BasicCohortAttributes {
  population_data: string[];
}

export interface QuestionnaireSurveyData {
  diseases: string[];
  healthcare_information: string[];
  lifestyle_and_behaviours: string[];
  medication: string[];
  non_pharmacological_interventions: string[];
  other_questionnaire_survey_data: string[];
  perception_of_health_and_quality_of_life: string[];
  physical_environment: string[];
  physiological_measurements: string[];
  socio_demographic_and_economic_characteristics: string[];
  survey_administration: string[];
}

export interface PhysiologicalMeasurements {
  anthropometry: string[];
}

export interface Project {
  cohort_name: string;
  website: string;
  pi_lead: string;
  current_enrollment: number;
  target_enrollment: number;
  enrollment_period: string;
  irb_approved_data_sharing: boolean;
  available_data_types: AvailableDataTypes;
  basic_cohort_attributes: BasicCohortAttributes;
  countries: string[];
  questionnaire_survey_data: QuestionnaireSurveyData;
  survey_administration: string[];

  last_updated: string;
}

export interface Project1 {
  uuid: string;
  dcpUrl: string;
  addedToIndex: string;
  date: string;
  title: string;
  organs: string[];
  technologies: string[];
  cellCount: number;
  enaAccessions: Link[];
  arrayExpressAccessions: Link[];
  geoAccessions: Link[];
  egaAccessions: Link[];
  dbgapAccessions: Link[];
  cellXGeneLinks: Link[];
  sceaLinks: Link[];
  ucscLinks: Link[];
  publications: Publication[];
  authors: string[];
}

export interface PaginatedList<T> {
  items: T[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginatedProjects extends PaginatedList<Project> {
  availableProjects: string[];
  availableCountries: string[];
}
