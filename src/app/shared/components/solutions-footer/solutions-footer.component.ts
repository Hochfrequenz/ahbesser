import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-solutions-footer',
  imports: [],
  templateUrl: './solutions-footer.component.html',
  styleUrl: './solutions-footer.component.scss',
})
export class SolutionsFooterComponent {
  public ahbTabellenUrl = environment.apiUrl;
  public fristenkalenderUrl = environment.fristenkalenderBaseUrl;
  public bedingungsbaumUrl = environment.bedingungsbaumBaseUrl;
  public ebdUrl = environment.ebdBaseUrl;
}
