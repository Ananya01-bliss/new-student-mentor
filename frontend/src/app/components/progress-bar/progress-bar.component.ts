import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-progress-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent {
    @Input() progress: number = 0;
    @Input() height: string = '10px';
    @Input() showLabel: boolean = true;
    @Input() milestones: any[] = [];
    @Input() size: number = 150; // default size for circular

    getStrokeDashArray(percentage: number): string {
        const radius = (this.size / 2) - 10;
        const circumference = 2 * Math.PI * radius;
        return `${(percentage / 100) * circumference} ${circumference}`;
    }

    getSegments() {
        if (!this.milestones || this.milestones.length === 0) return [];
        const segmentCount = this.milestones.length;
        const segmentSize = 100 / segmentCount;

        return this.milestones.map((m, i) => ({
            status: m.status,
            start: i * segmentSize,
            size: segmentSize,
            color: this.getStatusColor(m.status)
        }));
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed': return '#00c853';
            case 'submitted': return '#f9cb28';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }
}
