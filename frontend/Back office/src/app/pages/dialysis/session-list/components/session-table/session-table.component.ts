import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent} from "../../../../../shared/components/ui/button/button.component";
import { BadgeComponent} from "../../../../../shared/components/ui/badge/badge.component";
import { DialysisSession} from "../../../../../shared/models/dialysis.model";

@Component({
    selector: 'app-session-table',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent],
    templateUrl: './session-table.component.html',
})
export class SessionTableComponent {
    @Input() loading = true;
    @Input() sessions: DialysisSession[] = [];

    @Input() statusFilter: 'ALL' | 'IN_PROGRESS' | 'COMPLETED' = 'ALL';
    @Input() dateFilter: 'ALL' | 'TODAY' = 'ALL';
    @Input() searchText = '';

    @Input() canSeeActionsColumn = false;
    @Input() isNurse = false;
    @Input() isAdmin = false;
    @Input() viewMode: 'TREATMENT' | 'PATIENT_HISTORY' = 'TREATMENT';

    @Input() sessionStatusLabelFn!: (s: DialysisSession) => string;
    @Input() sessionStatusColorFn!: (s: DialysisSession) => any;
    @Input() canEditSessionFn!: (s: DialysisSession) => boolean;
    @Input() isInadequateFn!: (s: DialysisSession) => boolean;
    @Input() canViewReport = false;

    @Output() viewReport = new EventEmitter<DialysisSession>();
    @Output() filtersChange = new EventEmitter<{ statusFilter: any; dateFilter: any; searchText: string }>();
    @Output() edit = new EventEmitter<DialysisSession>();
    @Output() end = new EventEmitter<DialysisSession>();
    @Output() delete = new EventEmitter<DialysisSession>();

    onFiltersChanged(): void {
        this.filtersChange.emit({ statusFilter: this.statusFilter, dateFilter: this.dateFilter, searchText: this.searchText });
    }
}