import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [FooterComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.meta.addTags([
      {
        name: 'description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      { property: 'og:title', content: 'AHB Tabellen - Anwendungshandbücher für Menschen' },
      {
        property: 'og:description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
      { property: 'twitter:card', content: 'summary' },
      { property: 'twitter:title', content: 'AHB Tabellen - Anwendungshandbücher für Menschen' },
      {
        property: 'twitter:description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
    ]);
  }

  onOpenClick() {
    if (!environment.isProduction || window.location.hostname === 'localhost') {
      this.router.navigate(['/ahb']);
      return;
    }

    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/ahb']);
      } else {
        this.auth.loginWithRedirect({
          appState: { target: '/ahb' },
        });
      }
    });
  }
}
