import { Project } from '../project';

export class ProjectsTsvService {
  static asTsvString(projects: Project[], columns: object) {
    return this.projectsAsTsvArray(projects, columns).join('\r\n');
  }

  private static projectsAsTsvArray(projects: Project[], columns: object) {
    const tsvArray = projects.map((project: Project) =>
      this.projectAsTsvString(project, Object.keys(columns))
    );
    tsvArray.unshift(Object.values(columns).join('\t'));
    return tsvArray;
  }

  private static projectAsTsvString(project: Project, keys) {
    return keys
      .map((key) => ProjectsTsvService.flattenProjectField(key, project))
      .join('\t');
  }

  private static flattenProjectField(key: string, project: Project) {
    let keyParts = key.split('.');
    let projectChild = project;
    for (let key of keyParts) {
      projectChild = projectChild[key];
    }

    return projectChild;
  }
}
