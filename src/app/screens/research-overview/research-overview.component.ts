import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { TECH_FIELDS, TECH_FIELD_LIST, TechField, TechLevel } from '../../data/tech-tree.data';
import { TECH_ATLAS, HullTemplate, ComponentStats, TechRequirement } from '../../data/tech-atlas.data';

@Component({
  standalone: true,
  selector: 'app-research-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="research-container">
      <h1>Research & Technology</h1>

      <!-- Current Research -->
      <div class="current-research">
        <div class="research-header">
          <div class="research-title">
            <span class="research-icon">{{ getFieldIcon(selectedField()) }}</span>
            <div>
              <h2>{{ getFieldInfo(selectedField()).name }}</h2>
              <p class="research-subtitle">{{ getFieldInfo(selectedField()).description }}</p>
            </div>
          </div>
          <div class="research-level">
            <div class="level-badge">{{ getCurrentLevel(selectedField()) }}</div>
            <div class="level-label">Level</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercent(selectedField())"></div>
          </div>
          <div class="progress-stats">
            <span
              >{{ getResearchProgress(selectedField()) }} /
              {{ getNextLevelCost(selectedField()) }} RP</span
            >
            <span>{{ totalLabs() }} Labs | {{ researchPerTurn() }} RP/turn</span>
          </div>
        </div>

        <!-- Next Unlocks -->
        @if (getNextUnlocks(selectedField()).length > 0) {
          <div class="next-unlocks">
            <div class="unlocks-header">
              <strong>Next at Level {{ getCurrentLevel(selectedField()) + 1 }}:</strong>
            </div>
            <div class="unlock-items">
              @for (unlock of getNextUnlocks(selectedField()); track unlock) {
                <button class="unlock-chip" (click)="showUnlockDetails(unlock)">
                  <span class="tech-icon-small" [ngClass]="getUnlockIcon(unlock)"></span>
                  {{ unlock }}
                  @for (dep of getExternalDependenciesWithStatus(unlock, selectedField()); track dep.label) {
                    <span class="dep-badge" [class]="'dep-badge-' + dep.status">{{ dep.label }}</span>
                  }
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="next-unlocks">
            <div class="unlock-max">🏆 Maximum level reached</div>
          </div>
        }

        <!-- View Full Branch Button -->
        <div style="margin-top: var(--space-md)">
          <button class="btn-tech-tree" (click)="showTechTree = true">
            📊 View Full {{ getFieldInfo(selectedField()).name }} Tech Tree
          </button>
        </div>
      </div>

      <!-- Field Selection -->
      <div class="field-selection">
        <div class="selection-header">
          <h3>Select Research Field</h3>
        </div>
        <div class="field-grid">
          @for (fieldId of techFieldList; track fieldId) {
            <button
              class="field-button"
              [class.active]="selectedField() === fieldId"
              (click)="selectField(fieldId)"
            >
              <div class="field-icon-large">{{ getFieldIcon(fieldId) }}</div>
              <div class="field-name">{{ getFieldInfo(fieldId).name }}</div>
              <div class="field-level-small">Lv {{ getCurrentLevel(fieldId) }}</div>
            </button>
          }
        </div>
      </div>

      <!-- Tech Tree Popup -->
      @if (showTechTree) {
        <div class="modal-overlay" (click)="showTechTree = false">
          <div class="modal-content tech-tree-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2>
                  {{ getFieldIcon(selectedField()) }}
                  {{ getFieldInfo(selectedField()).name }} Technology Tree
                </h2>
                <p class="tech-subtitle">{{ getFieldInfo(selectedField()).description }}</p>
              </div>
              <button class="modal-close" (click)="showTechTree = false">✕</button>
            </div>
            <div class="modal-body">
              @for (level of getVisibleLevels(selectedField()); track level.level) {
                <div
                  class="tech-level-item"
                  [class.current-level]="level.level === getCurrentLevel(selectedField())"
                  [class.completed]="level.level < getCurrentLevel(selectedField())"
                >
                  <div class="level-indicator">
                    <div class="level-number">{{ level.level }}</div>
                    @if (level.level < getCurrentLevel(selectedField())) {
                      <div class="level-status completed">✓</div>
                    } @else if (level.level === getCurrentLevel(selectedField())) {
                      <div class="level-status current">▶</div>
                    } @else {
                      <div class="level-status locked">🔒</div>
                    }
                  </div>
                  <div class="level-content">
                    <div class="level-header">
                      <strong>Level {{ level.level }}</strong>
                      <span class="level-cost">{{ level.cost }} RP</span>
                    </div>
                    @if (level.unlocks.length > 0) {
                      <div class="level-unlocks">
                        @for (unlock of level.unlocks; track unlock) {
                          <button class="unlock-chip" (click)="showUnlockDetails(unlock)">
                            <span class="tech-icon-small" [ngClass]="getUnlockIcon(unlock)"></span>
                            {{ unlock }}
                            @for (
                              dep of getExternalDependenciesWithStatus(unlock, selectedField());
                              track dep.label
                            ) {
                              <span class="dep-badge" [class]="'dep-badge-' + dep.status">{{ dep.label }}</span>
                            }
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Unlock Details Popup -->
      @if (selectedUnlock()) {
        <div class="modal-overlay" (click)="selectedUnlock.set(null)">
          <div class="modal-content modal-small" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-group">
                <div class="tech-icon large" [ngClass]="getUnlockIcon(selectedUnlock()!)"></div>
                <h3>{{ selectedUnlock() }}</h3>
              </div>
              <button class="modal-close" (click)="selectedUnlock.set(null)">✕</button>
            </div>
            <div class="modal-body">
              @if (getTechDetails(selectedUnlock()!); as details) {
                <div class="tech-details-grid">
                  <div class="description-row">
                    <p>{{ details.description }}</p>
                  </div>

                  <div class="detail-row">
                    <span class="label">Role/Type:</span>
                    <span class="value">{{ getTechType(details) }}</span>
                  </div>

                  <div class="detail-row">
                    <span class="label">Cost:</span>
                    <span class="value">{{ getTechCost(details) }}</span>
                  </div>

                  @if (getTechMass(details); as mass) {
                    <div class="detail-row">
                      <span class="label">Mass:</span>
                      <span class="value">{{ mass }} kT</span>
                    </div>
                  }

                  <div class="detail-section">
                    <h4>Stats</h4>
                    @for (stat of getTechStats(details); track stat.key) {
                      <div class="detail-row">
                        <span class="label">{{ stat.key }}:</span>
                        <span class="value">{{ stat.value }}</span>
                      </div>
                    }
                  </div>

                  <div class="detail-section">
                    <h4>Requirements</h4>
                    @for (req of getTechRequirements(details); track req.field) {
                      <div class="detail-row">
                        <span class="label">{{ req.field }}:</span>
                        <span class="value">Level {{ req.level }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <p>{{ getUnlockDescription(selectedUnlock()!) }}</p>
              }
            </div>
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      /* Small tech icons wrapper - contains scaled 64px sprite */
      .tech-icon-small {
        width: 32px;
        height: 32px;
        display: inline-block;
        overflow: hidden;
        vertical-align: middle;
        margin-right: 4px;
        position: relative;
      }

      /* The actual icon, scaled down from 64px to 32px */
      .tech-icon-small::before {
        content: '';
        display: block;
        width: 64px;
        height: 64px;
        background-image: url('/assets/imagemaps/tech-atlas.png');
        background-repeat: no-repeat;
        image-rendering: pixelated;
        transform: scale(0.5);
        transform-origin: 0 0;
        position: absolute;
        top: 0;
        left: 0;
      }

      /* Apply background positions to the pseudo-element */
      .tech-icon-small.eng-settler::before { background-position: 0px 0px; }
      .tech-icon-small.eng-mizer::before { background-position: 0px -64px; }
      .tech-icon-small.eng-trans::before { background-position: 0px -128px; }
      .tech-icon-small.eng-ram::before { background-position: 0px -192px; }
      .tech-icon-small.mech-fuel-tank::before { background-position: 0px -256px; }
      .tech-icon-small.mech-super-tank::before { background-position: 0px -320px; }
      .tech-icon-small.mech-maneuver-jet::before { background-position: 0px -384px; }
      .tech-icon-small.mech-overthruster::before { background-position: 0px -448px; }
      .tech-icon-small.mech-colony-mod::before { background-position: 0px -512px; }
      .tech-icon-small.mech-robo-miner::before { background-position: 0px -576px; }
      .tech-icon-small.elec-comp-bat::before { background-position: 0px -640px; }
      .tech-icon-small.elec-comp-nexus::before { background-position: 0px -704px; }
      .tech-icon-small.elec-jammer-10::before { background-position: 0px -768px; }
      .tech-icon-small.elec-jammer-20::before { background-position: 0px -832px; }
      .tech-icon-small.elec-cloak-stealth::before { background-position: 0px -896px; }
      .tech-icon-small.elec-capacitor::before { background-position: 0px -960px; }
      .tech-icon-small.scan-viewer::before { background-position: 0px -1024px; }
      .tech-icon-small.scan-rhino::before { background-position: 0px -1088px; }
      .tech-icon-small.scan-mole::before { background-position: 0px -1152px; }
      .tech-icon-small.scan-snooper::before { background-position: 0px -1216px; }
      .tech-icon-small.scan-eagle::before { background-position: 0px -1280px; }
      .tech-icon-small.def-shield-mole::before { background-position: 0px -1344px; }
      .tech-icon-small.def-shield-cow::before { background-position: 0px -1408px; }
      .tech-icon-small.def-shield-wolf::before { background-position: 0px -1472px; }
      .tech-icon-small.def-shield-phase::before { background-position: 0px -1536px; }
      .tech-icon-small.def-armor-tri::before { background-position: 0px -1600px; }
      .tech-icon-small.def-armor-crob::before { background-position: 0px -1664px; }
      .tech-icon-small.def-armor-neu::before { background-position: 0px -1728px; }
      .tech-icon-small.def-armor-val::before { background-position: 0px -1792px; }
      .tech-icon-small.weap-laser::before { background-position: 0px -1856px; }
      .tech-icon-small.weap-xray::before { background-position: 0px -1920px; }
      .tech-icon-small.weap-gatling::before { background-position: 0px -1984px; }
      .tech-icon-small.weap-phasor::before { background-position: 0px -2048px; }
      .tech-icon-small.weap-disrupt::before { background-position: 0px -2112px; }
      .tech-icon-small.weap-torp-alpha::before { background-position: 0px -2176px; }
      .tech-icon-small.weap-torp-rho::before { background-position: 0px -2240px; }
      .tech-icon-small.weap-torp-anti::before { background-position: 0px -2304px; }
      .tech-icon-small.weap-bomb-lady::before { background-position: 0px -2368px; }
      .tech-icon-small.weap-bomb-lbu::before { background-position: 0px -2432px; }
      .tech-icon-small.weap-bomb-smart::before { background-position: 0px -2496px; }
      .tech-icon-small.weap-bomb-cherry::before { background-position: 0px -2560px; }
      .tech-icon-small.hull-freight-s::before { background-position: 0px -2624px; }
      .tech-icon-small.hull-freight-m::before { background-position: 0px -2688px; }
      .tech-icon-small.hull-freight-l::before { background-position: 0px -2752px; }
      .tech-icon-small.hull-freight-super::before { background-position: 0px -2816px; }
      .tech-icon-small.hull-scout::before { background-position: 0px -2880px; }
      .tech-icon-small.hull-frigate::before { background-position: 0px -2944px; }
      .tech-icon-small.hull-destroyer::before { background-position: 0px -3008px; }
      .tech-icon-small.hull-cruiser::before { background-position: 0px -3072px; }
      .tech-icon-small.hull-battle-cruiser::before { background-position: 0px -3136px; }
      .tech-icon-small.hull-battleship::before { background-position: 0px -3200px; }
      .tech-icon-small.hull-dreadnought::before { background-position: 0px -3264px; }
      .tech-icon-small.hull-privateer::before { background-position: 0px -3328px; }
      .tech-icon-small.hull-rogue::before { background-position: 0px -3392px; }
      .tech-icon-small.hull-galleon::before { background-position: 0px -3456px; }
      .tech-icon-small.hull-colony::before { background-position: 0px -3520px; }
      .tech-icon-small.hull-mini-bomber::before { background-position: 0px -3584px; }
      .tech-icon-small.hull-b17::before { background-position: 0px -3648px; }
      .tech-icon-small.hull-stealth-bomber::before { background-position: 0px -3712px; }
      .tech-icon-small.hull-b52::before { background-position: 0px -3776px; }
      .tech-icon-small.hull-midget-miner::before { background-position: 0px -3840px; }
      .tech-icon-small.hull-mini-miner::before { background-position: 0px -3904px; }
      .tech-icon-small.hull-ultra-miner::before { background-position: 0px -3968px; }
      .tech-icon-small.hull-fuel-transport::before { background-position: 0px -4032px; }

      .dep-badge {
        display: inline-block;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 2px 4px;
        font-size: 10px;
        color: var(--color-text-muted);
        margin-left: 6px;
        vertical-align: middle;
      }

      /* Color coding for tech dependencies */
      .dep-badge-met {
        background: #2d5016;
        border-color: #4a7c2c;
        color: #a8e063;
      }

      .dep-badge-close {
        background: #5a4a1a;
        border-color: #8a7a2a;
        color: #ffeb3b;
      }

      .dep-badge-far {
        background: #5a1a1a;
        border-color: #8a2a2a;
        color: #ff6b6b;
      }

      .modal-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .tech-icon.large {
        width: 64px;
        height: 64px;
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        background-color: #000;
      }

      .tech-details-grid {
        display: grid;
        gap: var(--space-sm);
      }

      .description-row {
        padding: 4px 0;
        margin-bottom: var(--space-sm);
        font-style: italic;
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
      }

      .description-row {
        padding: 4px 0;
        margin-bottom: var(--space-sm);
        font-style: italic;
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-border);
        padding: 4px 0;
      }

      .detail-section {
        margin-top: var(--space-md);
      }

      .detail-section h4 {
        margin: 0 0 var(--space-sm) 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .research-container {
        padding: var(--space-lg);
        max-width: 1000px;
        margin: 0 auto;
        min-height: calc(100vh - 80px);
        display: flex;
        flex-direction: column;
      }

      h1 {
        margin: 0 0 var(--space-md) 0;
        font-size: var(--font-size-2xl);
      }

      .current-research {
        background: var(--color-bg-secondary);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        margin-bottom: var(--space-lg);
      }

      .research-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-md);
      }

      .research-title {
        display: flex;
        gap: var(--space-md);
        align-items: center;
        flex: 1;
      }

      .research-icon {
        font-size: 48px;
      }

      .research-title h2 {
        margin: 0;
        font-size: var(--font-size-xl);
      }

      .research-subtitle {
        margin: 4px 0 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .research-level {
        text-align: center;
      }

      .level-badge {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .level-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .progress-section {
        margin-bottom: var(--space-md);
      }

      .progress-bar {
        height: 16px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-sm);
        overflow: hidden;
        margin-bottom: var(--space-xs);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
        transition: width 0.3s ease;
      }

      .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .next-unlocks {
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
      }

      .unlocks-header {
        margin-bottom: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .unlock-items {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
      }

      .unlock-chip {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 6px 12px;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
      }

      .unlock-chip:hover {
        background: var(--color-primary);
        color: white;
        transform: translateY(-1px);
      }

      .unlock-max {
        text-align: center;
        font-size: var(--font-size-sm);
        color: var(--color-warning);
      }

      .field-selection {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);
      }

      .selection-header h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      .btn-tech-tree {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 8px 16px;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
      }

      .btn-tech-tree:hover {
        background: var(--color-primary);
        color: white;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-md);
      }

      .field-button {
        background: var(--color-bg-secondary);
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
      }

      .field-button:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }

      .field-button.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }

      .field-icon-large {
        font-size: 36px;
      }

      .field-name {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .field-level-small {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .field-button.active .field-level-small {
        color: rgba(255, 255, 255, 0.8);
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--space-lg);
      }

      .modal-content {
        background: var(--color-bg-primary);
        border-radius: var(--radius-lg);
        max-width: 800px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .modal-small {
        max-width: 500px;
      }

      .modal-header {
        padding: var(--space-lg);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2,
      .modal-header h3 {
        margin: 0;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--color-text-muted);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
      }

      .modal-close:hover {
        background: var(--color-bg-secondary);
      }

      .modal-body {
        padding: var(--space-lg);
        overflow-y: auto;
      }

      .tech-subtitle {
        margin: 4px 0 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .tech-tree-modal {
        max-width: 900px;
      }

      .tech-level-item {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-md);
        margin-bottom: var(--space-sm);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        transition: all 0.2s;
      }

      .tech-level-item.completed {
        opacity: 0.7;
      }

      .tech-level-item.current-level {
        border-color: var(--color-primary);
        background: linear-gradient(
          to right,
          var(--color-bg-secondary),
          rgba(var(--color-primary-rgb), 0.1)
        );
      }

      .level-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
        min-width: 60px;
      }

      .level-number {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: var(--font-size-lg);
      }

      .tech-level-item.completed .level-number {
        background: var(--color-success);
        color: white;
      }

      .tech-level-item.current-level .level-number {
        background: var(--color-primary);
        color: white;
      }

      .level-status {
        font-size: var(--font-size-sm);
      }

      .level-status.completed {
        color: var(--color-success);
      }

      .level-status.current {
        color: var(--color-primary);
      }

      .level-status.locked {
        color: var(--color-text-muted);
      }

      .level-content {
        flex: 1;
      }

      .level-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-sm);
      }

      .level-cost {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .level-unlocks {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
      }

      .no-unlocks {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        font-style: italic;
      }
    `,
  ],
})
export class ResearchOverviewComponent {
  private gameState = inject(GameStateService);

  readonly player = this.gameState.player;
  readonly playerEconomy = this.gameState.playerEconomy;
  readonly techFieldList = TECH_FIELD_LIST;

  showTechTree = false;
  selectedUnlock = signal<string | null>(null);

  readonly selectedField = computed(() => this.player()?.selectedResearchField ?? 'Propulsion');

  readonly totalLabs = computed(() => {
    const game = this.gameState.game();
    if (!game) return 0;
    return game.stars
      .flatMap((s) => s.planets)
      .filter((p) => p.ownerId === game.humanPlayer.id)
      .reduce((sum, p) => sum + (p.research || 0), 0);
  });

  readonly researchPerTurn = computed(() => {
    const game = this.gameState.game();
    if (!game) return 0;
    const researchTrait =
      game.humanPlayer.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
    return Math.floor(this.totalLabs() * (1 + researchTrait));
  });

  getFieldInfo(field: TechField) {
    return TECH_FIELDS[field];
  }

  getFieldIcon(field: TechField): string {
    const icons: Record<TechField, string> = {
      Energy: '⚡',
      Kinetics: '🚀',
      Propulsion: '✈️',
      Construction: '🏗️',
    };
    return icons[field];
  }

  getCurrentLevel(field: TechField): number {
    const player = this.player();
    return player?.techLevels[field] ?? 0;
  }

  getResearchProgress(field: TechField): number {
    const player = this.player();
    return Math.floor(player?.researchProgress[field] ?? 0);
  }

  getNextLevelCost(field: TechField): number {
    const currentLevel = this.getCurrentLevel(field);
    if (currentLevel >= 26) return 0;
    const fieldInfo = TECH_FIELDS[field];
    return fieldInfo.levels[currentLevel + 1]?.cost ?? 0;
  }

  getProgressPercent(field: TechField): number {
    const progress = this.getResearchProgress(field);
    const cost = this.getNextLevelCost(field);
    if (cost === 0) return 100;
    return Math.min(100, (progress / cost) * 100);
  }

  getNextUnlocks(field: TechField): string[] {
    const currentLevel = this.getCurrentLevel(field);
    if (currentLevel >= 26) return [];
    const fieldInfo = TECH_FIELDS[field];
    return fieldInfo.levels[currentLevel + 1]?.unlocks ?? [];
  }

  getAllLevels(field: TechField) {
    const fieldInfo = TECH_FIELDS[field];
    return fieldInfo.levels;
  }

  selectField(field: TechField) {
    this.gameState.setResearchField(field);
  }

  showUnlockDetails(unlock: string) {
    this.selectedUnlock.set(unlock);
  }

  getUnlockDescription(unlock: string): string {
    // Placeholder descriptions - these should match the original game
    const descriptions: Record<string, string> = {
      'Quick Jumper 5':
        'Basic warp engine with Warp 5 capability. Mass: 25kT, Fuel efficiency: 100%',
      'Scout Hull': 'Small, fast reconnaissance vessel. 2 general slots, low armor.',
      'Bat Scanner': 'Basic scanner with 50 ly range. Can detect normal-cloaked ships.',
      'Basic Shields': 'Provides 25 DP of shield protection. Absorbs beam weapon damage.',
      'Alpha Torpedo': 'Basic torpedo launcher. Range: 4, Damage: 5, Accuracy: 75%',
      'Total Terraform ±3': 'Allows terraforming of all environmental factors by ±3%',
    };
    return (
      descriptions[unlock] ??
      `${unlock} - Technology from the Stars! universe. This component will be available once this tech level is reached.`
    );
  }

  getVisibleLevels(field: TechField): TechLevel[] {
    const allLevels = this.getAllLevels(field);
    return allLevels.filter((level) => level.unlocks.length > 0);
  }

  getTechDetails(name: string): HullTemplate | ComponentStats | null {
    // Search in hulls
    const hull = TECH_ATLAS.hulls.find((h) => h.Name === name);
    if (hull) return hull;

    // Search in components
    for (const category of TECH_ATLAS.components) {
      const component = category.items.find((c) => c.name === name);
      if (component) return component;
    }

    return null;
  }

  getUnlockIcon(name: string): string {
    const details = this.getTechDetails(name);
    return details?.img ?? '';
  }

  getTechType(details: HullTemplate | ComponentStats): string {
    if ('role' in details) {
      return `Hull - ${details.role}`;
    }
    const comp = details as ComponentStats;
    // Find category
    const category = TECH_ATLAS.components.find((cat) => cat.items.includes(comp));
    return category ? `${category.category} Component` : 'Component';
  }

  getTechCost(details: HullTemplate | ComponentStats): string {
    const parts: string[] = [];

    if ('Cost' in details) {
      // Hull uses PascalCase
      const c = details.Cost;
      if (c.Resources) parts.push(`${c.Resources} Res`);
      if (c.Ironium) parts.push(`${c.Ironium} Fe`);
      if (c.Boranium) parts.push(`${c.Boranium} Bo`);
      if (c.Germanium) parts.push(`${c.Germanium} Ge`);
    } else {
      // Component uses lowercase
      const comp = details as ComponentStats;
      const c = comp.cost;
      if (c.res) parts.push(`${c.res} Res`);
      if (c.iron) parts.push(`${c.iron} Fe`);
      if (c.bor) parts.push(`${c.bor} Bo`);
      if (c.germ) parts.push(`${c.germ} Ge`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Free';
  }

  getTechMass(details: HullTemplate | ComponentStats): number | null {
    if ('Stats' in details) {
      // Hull has mass in Stats
      return details.Stats.Mass;
    }
    // Component has mass directly
    const comp = details as ComponentStats;
    return comp.mass ?? null;
  }

  getTechStats(details: HullTemplate | ComponentStats): { key: string; value: string }[] {
    const stats: { key: string; value: string }[] = [];

    if ('Slots' in details) {
      // Hull
      const hull = details as HullTemplate;
      // Count total slots
      stats.push({
        key: 'Slots',
        value: `${hull.Slots.length} total`,
      });

      if (hull.note) {
        stats.push({ key: 'Note', value: hull.note });
      }
    } else {
      // Component
      const comp = details as ComponentStats;
      Object.entries(comp.stats).forEach(([key, value]) => {
        if (value === undefined) return;
        // Format key
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        stats.push({ key: formattedKey, value: value.toString() });
      });
    }

    return stats;
  }

  getTechRequirements(details: HullTemplate | ComponentStats): { field: string; level: number }[] {
    const reqs: { field: string; level: number }[] = [];

    // techReq for hull, tech for component.
    // Wait, let's check the interfaces.
    // HullStats: techReq: TechRequirement
    // ComponentStats: tech: TechRequirement

    let techReq: TechRequirement | undefined;
    if ('techReq' in details) {
      techReq = details.techReq;
    } else if ('tech' in details) {
      techReq = (details as ComponentStats).tech;
    }

    if (techReq) {
      Object.entries(techReq).forEach(([field, level]) => {
        reqs.push({ field, level: Number(level) });
      });
    }

    return reqs;
  }

  getExternalDependencies(name: string, currentField: TechField): string[] {
    const details = this.getTechDetails(name);
    if (!details) return [];
    const reqs = this.getTechRequirements(details);
    // Filter out requirements that match the current field
    return reqs
      .filter((r) => r.field !== currentField)
      .map((r) => `${r.field.substring(0, 4)} ${r.level}`);
  }

  getExternalDependenciesWithStatus(
    name: string,
    currentField: TechField
  ): { label: string; status: 'met' | 'close' | 'far' }[] {
    const details = this.getTechDetails(name);
    if (!details) return [];
    const reqs = this.getTechRequirements(details);
    const player = this.player();
    if (!player) return [];

    // Filter out requirements that match the current field
    return reqs
      .filter((r) => r.field !== currentField)
      .map((r) => {
        const currentLevel = player.techLevels[r.field as TechField] ?? 0;
        const requiredLevel = r.level;
        const diff = requiredLevel - currentLevel;

        let status: 'met' | 'close' | 'far';
        if (diff <= 0) {
          status = 'met'; // Green: already met or exceeded
        } else if (diff <= 2) {
          status = 'close'; // Yellow: 1-2 levels away
        } else {
          status = 'far'; // Red: more than 2 levels away
        }

        return {
          label: `${r.field.substring(0, 4)} ${r.level}`,
          status,
        };
      });
  }
}
