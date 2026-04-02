import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { KnowledgeBaseService } from '../../services/knowledge-base/knowledge-base';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule, CardModule],
  templateUrl: './knowledge-base.html',
  styleUrl: './knowledge-base.css',
  providers: [MessageService]
})
export class KnowledgeBase implements OnInit {
  results: any[] = [];
  loading = false;
  stats: any = {};
  statsArray: any[] = [];

  query = '';
  issueType = '';

  issueTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Hardware', value: 'HARDWARE' },
    { label: 'Software', value: 'SOFTWARE' },
    { label: 'Network', value: 'NETWORK' },
    { label: 'Electrical', value: 'ELECTRICAL' },
    { label: 'Other', value: 'OTHER' }
  ];

  selectedArticle: any = null;

  constructor(
    private kbService: KnowledgeBaseService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
    this.search();
  }

loadStats() {
  this.kbService.getStats().subscribe({
    next: (res: any) => {
      this.statsArray = [
        { type: 'Total Articles', count: res.totalArticles || 0 },
        ...(res.byIssueType || []).map((item: any) => ({
          type: item.issueType,
          count: item.count
        }))
      ];
    },
    error: (err) => {
      console.error('Stats error:', err);
      this.statsArray = [];
    }
  });
}

  search() {
    this.loading = true;
    this.selectedArticle = null;
    this.kbService.search(this.query, this.issueType || undefined).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.results = res.data || [];
          this.loading = false;
          console.log('Search results:', this.results);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  viewArticle(article: any) {
    this.selectedArticle = this.selectedArticle?.id === article.id ? null : article;
    this.cdr.detectChanges();
  }

  getPrioritySeverity(priority: string): "success" | "danger" | "warn" | "info" {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warn';
      case 'MEDIUM': return 'info';
      default: return 'success';
    }
  }
}
