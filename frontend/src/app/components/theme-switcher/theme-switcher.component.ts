import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeType } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-switcher">
      <button 
        *ngFor="let option of themeOptions" 
        (click)="setTheme(option.value)"
        [class.active]="currentTheme() === option.value"
        [title]="option.label"
      >
        <i [class]="option.icon"></i>
      </button>
    </div>
  `,
  styles: [`
    .theme-switcher {
      display: flex;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 30px;
      padding: 4px;
      gap: 4px;
      box-shadow: var(--card-shadow);
    }
    button {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button:hover {
      background: var(--bg-primary);
      color: var(--accent-primary);
    }
    button.active {
      background: var(--accent-primary);
      color: white;
    }
    i {
      font-size: 1.1rem;
    }
  `]
})
export class ThemeSwitcherComponent {
  themeOptions: { value: ThemeType; label: string; icon: string }[] = [
    { value: 'light', label: 'Light Mode', icon: 'fas fa-sun' },
    { value: 'dark', label: 'Dark Mode', icon: 'fas fa-moon' }
  ];

  constructor(private themeService: ThemeService) { }

  currentTheme = this.themeService.theme;

  setTheme(theme: ThemeType) {
    this.themeService.setTheme(theme);
  }
}
