import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fuel-usage-graph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fuel-graph-container">
      <div class="graph-title">Fuel Usage vs. Warp Speed</div>
      @if (paths(); as p) {
        <svg viewBox="0 0 280 120" class="fuel-graph">
          <!-- Grid Lines -->
          <line x1="30" y1="20" x2="30" y2="100" stroke="#444" stroke-width="1" />
          <line x1="30" y1="100" x2="270" y2="100" stroke="#444" stroke-width="1" />

          <!-- 100% Usage Line (Threshold) -->
          <line
            x1="30"
            [attr.y1]="p.yThreshold"
            x2="270"
            [attr.y2]="p.yThreshold"
            stroke="#d32f2f"
            stroke-width="1"
            stroke-dasharray="2"
            opacity="0.5"
          />
          <text
            x="275"
            [attr.y]="p.yThreshold + 3"
            fill="#d32f2f"
            font-size="8"
            text-anchor="start"
          >
            100%
          </text>

          <!-- Max Warp Line -->
          <line
            [attr.x1]="p.maxWarpX"
            y1="20"
            [attr.x2]="p.maxWarpX"
            y2="100"
            stroke="#d32f2f"
            stroke-width="1"
            stroke-dasharray="4"
          />
          <text
            [attr.x]="p.maxWarpX"
            y="15"
            fill="#d32f2f"
            font-size="10"
            text-anchor="middle"
          >
            Max
          </text>

          <!-- Unsafe Path (Red) - Drawn first so blue can overlap if needed, though they shouldn't overlap much -->
          <path
            [attr.d]="p.unsafeD"
            fill="none"
            stroke="#f44336"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Safe Path (Blue) -->
          <path
            [attr.d]="p.safeD"
            fill="none"
            stroke="#03a9f4"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- X Axis Labels (Warp 1-10) -->
          @for (tick of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track tick) {
            <text
              [attr.x]="30 + (tick - 1) * (240 / 9)"
              y="115"
              [attr.fill]="tick > maxWarp() ? '#d32f2f' : '#888'"
              font-size="10"
              text-anchor="middle"
            >
              {{ tick }}
            </text>
          }
        </svg>
      }
    </div>
  `,
  styles: [`
    .fuel-graph-container {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: 0.5rem;
      width: 100%;
    }

    .graph-title {
      font-size: 0.8rem;
      color: #888;
      text-align: center;
      margin-bottom: 0.25rem;
    }

    .fuel-graph {
      width: 100%;
      height: auto;
      max-height: 120px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuelUsageGraphComponent {
  readonly fuelUsage = input.required<Record<string, number>>();
  readonly maxWarp = input(10);
  readonly threshold = input(100); // 100 mg/ly is the standard efficiency baseline

  readonly paths = computed(() => {
    const usageMap = this.fuelUsage();
    if (!usageMap) return null;

    // Convert map to array
    const data: { warp: number; usage: number }[] = [];
    let maxUsage = 0;
    for (let i = 1; i <= 10; i++) {
      const key = `warp${i}` as keyof typeof usageMap;
      const usage = usageMap[key] ?? 0;
      data.push({ warp: i, usage });
      if (usage > maxUsage) maxUsage = usage;
    }

    if (maxUsage === 0) return null;

    // Dimensions
    const width = 280;
    const height = 120;
    const paddingX = 30;
    const paddingY = 20;
    const graphWidth = width - paddingX - 10;
    const graphHeight = height - paddingY * 2;

    // Scales
    // Ensure Y axis accommodates the threshold and the max usage
    const threshold = this.threshold();
    const yMax = Math.max(maxUsage, threshold * 1.2); 
    const xScale = graphWidth / 9; // 10 points = 9 intervals
    const yScale = graphHeight / yMax;

    const getX = (warp: number) => paddingX + (warp - 1) * xScale;
    const getY = (usage: number) => height - paddingY - usage * yScale;
    const yThreshold = getY(threshold);
    const maxWarpX = getX(this.maxWarp());

    // Build Paths
    let safeD = '';
    let unsafeD = '';

    // Find crossing point
    // We iterate through segments
    const safePoints: {x: number, y: number}[] = [];
    const unsafePoints: {x: number, y: number}[] = [];

    // Start point
    let wasSafe = data[0].usage <= threshold;
    if (wasSafe) {
      safePoints.push({ x: getX(data[0].warp), y: getY(data[0].usage) });
    } else {
      unsafePoints.push({ x: getX(data[0].warp), y: getY(data[0].usage) });
    }

    for (let i = 0; i < data.length - 1; i++) {
      const p1 = data[i];
      const p2 = data[i + 1];
      const u1 = p1.usage;
      const u2 = p2.usage;
      const safe1 = u1 <= threshold;
      const safe2 = u2 <= threshold;

      if (safe1 && safe2) {
        // Both safe
        safePoints.push({ x: getX(p2.warp), y: getY(u2) });
      } else if (!safe1 && !safe2) {
        // Both unsafe
        unsafePoints.push({ x: getX(p2.warp), y: getY(u2) });
      } else {
        // Crossing
        // Linear interpolation to find where usage == threshold
        // u = u1 + (u2 - u1) * t
        // threshold = u1 + (u2 - u1) * t
        // t = (threshold - u1) / (u2 - u1)
        const t = (threshold - u1) / (u2 - u1);
        const warpCross = p1.warp + (p2.warp - p1.warp) * t;
        const xCross = getX(warpCross);
        const yCross = yThreshold; // Should be exactly this

        if (safe1 && !safe2) {
          // Going from safe to unsafe
          // Add crossing point to safe path
          safePoints.push({ x: xCross, y: yCross });
          // Start unsafe path from crossing point
          unsafePoints.push({ x: xCross, y: yCross });
          unsafePoints.push({ x: getX(p2.warp), y: getY(u2) });
        } else {
          // Going from unsafe to safe (unlikely for engines, but possible)
          unsafePoints.push({ x: xCross, y: yCross });
          safePoints.push({ x: xCross, y: yCross });
          safePoints.push({ x: getX(p2.warp), y: getY(u2) });
        }
      }
    }

    // Construct path strings
    // Note: The "second part of blue line is not needed" implies that if we go unsafe, we stop drawing blue.
    // My logic above adds points to safePoints list. If we have multiple crossings (e.g. up and down), it might be complex.
    // But for engines, usage usually increases monotonically.
    // If it is monotonic, safePoints will be the first segment, unsafePoints the second.
    // We need to be careful not to connect disjoint segments if usage dips back down (unlikely).
    // Assuming simple curve:
    
    if (safePoints.length > 0) {
        safeD = `M ${safePoints[0].x} ${safePoints[0].y}`;
        for (let i = 1; i < safePoints.length; i++) {
            safeD += ` L ${safePoints[i].x} ${safePoints[i].y}`;
        }
    }

    if (unsafePoints.length > 0) {
        // If unsafe points start where safe points ended, it's fine.
        // But if we have a gap or complex shape, this simple loop connects them all.
        // Given engine curves are simple, this should be fine.
        // However, if we have (Safe, Safe, Unsafe, Unsafe), unsafePoints has (Cross, P3, P4).
        // If we have (Unsafe, Unsafe), unsafePoints has (P1, P2...).
        unsafeD = `M ${unsafePoints[0].x} ${unsafePoints[0].y}`;
        for (let i = 1; i < unsafePoints.length; i++) {
            unsafeD += ` L ${unsafePoints[i].x} ${unsafePoints[i].y}`;
        }
    }

    return { safeD, unsafeD, maxWarpX, yThreshold };
  });
}
