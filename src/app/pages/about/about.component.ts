import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HeadingService } from '../../services/heading.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  constructor(private headingService: HeadingService) {
    this.headingService.setTitle(
      'About the Catalogue',
      'eLwazi, DS-I Africa and project catalogue'
    );
    this.headingService.setBreadcrumbs('About');
  }

  feedbackEmail: string = environment.feedbackEmail;
}
