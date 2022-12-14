import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AboutComponent } from './pages/about/about.component';
import { AddProjectComponent } from './pages/add-project/add-project.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { GlobalHeaderComponent } from './components/global-header/global-header.component';
import { HttpClientModule } from '@angular/common/http';
import { ProjectsModule } from './projects/projects.module';
import { ErrorsModule } from './errors/errors.module';
import { NavComponent } from './components/nav/nav.component';
import { VisualFrameworkModule } from './visual-framework/visual-framework.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';
import { SummaryModule } from './summary/summary.module';
import { ElwaziHeaderComponent } from './elwazi-header/elwazi-header.component';
import { ElwaziFooterComponent } from './elwazi-footer/elwazi-footer.component';

@NgModule({
  declarations: [
    AboutComponent,
    AddProjectComponent,
    AppComponent,
    FeedbackComponent,
    GlobalHeaderComponent,
    NavComponent,
    ElwaziHeaderComponent,
    ElwaziFooterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserModule,
    ErrorsModule,
    HttpClientModule,
    ProjectsModule,
    VisualFrameworkModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SummaryModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
