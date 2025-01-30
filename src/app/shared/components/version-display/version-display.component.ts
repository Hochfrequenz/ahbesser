import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

interface VersionInfo {
  version: string;
  commitId: string;
  buildDate: string;
}

@Component({
  selector: 'app-version-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './version-display.component.html',
  styleUrls: ['./version-display.component.css'],
})
export class VersionDisplayComponent {
  version: string | null = null;
  commitId: string | null = null;
  buildDate: string | null = null;
  private http = inject(HttpClient);

  constructor() {
    this.http
      .get('/version', { responseType: 'text' }) // we don't know the build date at compile time
      .pipe(
        map((response: string) => {
          try {
            const parsedData: VersionInfo = JSON.parse(response);
            if (parsedData.version && parsedData.commitId && parsedData.buildDate) {
              return parsedData;
            }
            throw new Error('Invalid JSON structure');
          } catch (error) {
            console.warn(
              'Response to /version endpoint is not valid JSON. This happens on localhost',
              error
            );
            return { version: 'v0.0.0', commitId: '0000000', buildDate: 'Unknown' };
          }
        }),
        catchError(error => {
          console.error('Failed to load version info:', error);
          return of({ version: 'Error', commitId: 'Unknown', buildDate: 'Unknown' });
        })
      )
      .subscribe(data => {
        this.version = data.version;
        this.commitId = data.commitId;
        this.buildDate = data.buildDate;
      });
  }
}
