import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-research-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:var(--space-lg);max-width:1400px;margin:0 auto">
      <h1 style="margin-bottom:var(--space-lg)">Research</h1>

      <div class="coming-soon-banner">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11a3 3 0 100-6 3 3 0 000 6z"/>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <h2>Research System</h2>
        <p class="text-muted">The research system is currently under development.</p>
      </div>

      <div class="placeholder-sections">
        <div class="placeholder-card">
          <h3>Research Queue</h3>
          <p class="text-muted">View and manage your current research projects</p>
          <div class="placeholder-content">
            <div class="placeholder-item">
              <div class="placeholder-bar" style="width: 80%"></div>
              <span class="text-xs text-muted">Example Research 1 - 5 turns remaining</span>
            </div>
            <div class="placeholder-item">
              <div class="placeholder-bar" style="width: 30%"></div>
              <span class="text-xs text-muted">Example Research 2 - 12 turns remaining</span>
            </div>
          </div>
        </div>

        <div class="placeholder-card">
          <h3>Technology Tree</h3>
          <p class="text-muted">Explore available technologies and unlock new capabilities</p>
          <div class="tech-tree-placeholder">
            <div class="tech-node unlocked">
              <span>Basic Tech</span>
            </div>
            <div class="tech-connector"></div>
            <div class="tech-node available">
              <span>Advanced Tech</span>
            </div>
            <div class="tech-connector locked"></div>
            <div class="tech-node locked">
              <span>Future Tech</span>
            </div>
          </div>
        </div>

        <div class="placeholder-card">
          <h3>Resource Allocation</h3>
          <p class="text-muted">Allocate production from planets to research</p>
          <div class="allocation-placeholder">
            <div class="allocation-row">
              <span class="text-small">Total Resources Allocated:</span>
              <span class="font-medium" style="color:var(--color-primary)">0 R/turn</span>
            </div>
            <div class="allocation-row">
              <span class="text-small">Contributing Planets:</span>
              <span class="font-medium">0</span>
            </div>
            <div class="allocation-row">
              <span class="text-small">Research Progress:</span>
              <span class="font-medium">0%</span>
            </div>
          </div>
        </div>

        <div class="placeholder-card">
          <h3>Available Research</h3>
          <p class="text-muted">Technologies available to research next</p>
          <div class="available-tech-placeholder">
            <div class="tech-item">
              <span class="tech-name">Improved Mining</span>
              <span class="tech-cost">Cost: 500 R</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">Advanced Propulsion</span>
              <span class="tech-cost">Cost: 800 R</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">Weapon Systems</span>
              <span class="tech-cost">Cost: 1000 R</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .coming-soon-banner {
      background: var(--color-bg-secondary);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      text-align: center;
      margin-bottom: var(--space-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
    }

    .coming-soon-banner svg {
      color: var(--color-warning);
    }

    .coming-soon-banner h2 {
      margin: 0;
      color: var(--color-warning);
    }

    .placeholder-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-lg);
    }

    .placeholder-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      opacity: 0.6;
    }

    .placeholder-card h3 {
      margin: 0 0 var(--space-sm) 0;
      font-size: var(--font-size-lg);
    }

    .placeholder-content {
      margin-top: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .placeholder-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .placeholder-bar {
      height: 24px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
      position: relative;
      overflow: hidden;
    }

    .placeholder-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 60%;
      background: var(--color-primary);
      opacity: 0.3;
    }

    .tech-tree-placeholder {
      margin-top: var(--space-md);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      overflow-x: auto;
      padding: var(--space-md);
    }

    .tech-node {
      padding: var(--space-md);
      border-radius: var(--radius-sm);
      min-width: 100px;
      text-align: center;
      font-size: var(--font-size-sm);
      white-space: nowrap;
    }

    .tech-node.unlocked {
      background: var(--color-success);
      color: white;
    }

    .tech-node.available {
      background: var(--color-primary);
      color: white;
    }

    .tech-node.locked {
      background: var(--color-bg-tertiary);
      color: var(--color-text-muted);
    }

    .tech-connector {
      width: 30px;
      height: 2px;
      background: var(--color-primary);
    }

    .tech-connector.locked {
      background: var(--color-border);
    }

    .allocation-placeholder {
      margin-top: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .allocation-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-sm);
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }

    .available-tech-placeholder {
      margin-top: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .tech-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md);
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }

    .tech-name {
      font-weight: 600;
    }

    .tech-cost {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
  `]
})
export class ResearchOverviewComponent {}
