import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, ThemeSwitcherComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  // Component cleaned up: Anti-gravity effect and canvas logic removed.
}
