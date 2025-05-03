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
    const baseUrl = environment.baseUrl;

    this.meta.addTags([
      {
        name: 'description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      {
        name: 'keywords',
        content: 'AHB, Anwendungshandbuch, Energie, Hochfrequenz, Tabellen, Prüfidentifikator',
      },
      { property: 'og:title', content: 'AHB Tabellen - Anwendungshandbücher für Menschen' },
      {
        property: 'og:description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: baseUrl },
      { property: 'og:image', content: `${baseUrl}/assets/logo.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: 'AHB Tabellen' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: 'AHB Tabellen - Anwendungshandbücher für Menschen' },
      {
        property: 'twitter:description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      { property: 'twitter:image', content: `${baseUrl}/assets/logo.png` },
      { property: 'linkedin:title', content: 'AHB Tabellen - Anwendungshandbücher für Menschen' },
      {
        property: 'linkedin:description',
        content:
          'AHB-Tabellen ist ein intuitives Tool, das die Navigation in Anwendungshandbüchern vereinfacht, indem es die Daten pro Prüfidentifikator klar darstellt.',
      },
      { property: 'linkedin:image', content: `${baseUrl}/assets/logo.png` },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Hochfrequenz' },
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
