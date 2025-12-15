import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <h2>Home</h2>
    <p>Welcome. This app uses Angular signals and zoneless change detection.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}

