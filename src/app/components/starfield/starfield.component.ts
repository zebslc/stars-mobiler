import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Star = { cx: number; cy: number; r: number; o: number };

function mulberry32(seed: number) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

@Component({
  selector: 'app-starfield',
  standalone: true,
  imports: [CommonModule],
  template: `
<svg
  class="starfield"
  [attr.viewBox]="'0 0 ' + vbWidth + ' ' + vbHeight"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <defs>
    <radialGradient id="bgGradient" cx="55%" cy="45%" r="80%">
      <stop offset="0%" stop-color="#0b1030"></stop>
      <stop offset="45%" stop-color="#05081a"></stop>
      <stop offset="100%" stop-color="#02030a"></stop>
    </radialGradient>

    <filter id="spaceNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.8"
        numOctaves="3"
        seed="7"
        result="noise"
      ></feTurbulence>
      <feColorMatrix
        in="noise"
        type="matrix"
        values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 0.15 0"
        result="noiseAlpha"
      ></feColorMatrix>
      <feComposite in="noiseAlpha" in2="SourceGraphic" operator="over"></feComposite>
    </filter>

    <filter id="starGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.2" result="blur"></feGaussianBlur>
      <feMerge>
        <feMergeNode in="blur"></feMergeNode>
        <feMergeNode in="SourceGraphic"></feMergeNode>
      </feMerge>
    </filter>

    <filter id="nebulaBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18"></feGaussianBlur>
    </filter>

    <!-- Vignette gradient -->
    <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="70%">
      <stop offset="50%" stop-color="#000" stop-opacity="0"></stop>
      <stop offset="100%" stop-color="#000" stop-opacity="0.65"></stop>
    </radialGradient>
  </defs>

  <rect x="0" y="0" [attr.width]="vbWidth" [attr.height]="vbHeight" fill="url(#bgGradient)"></rect>

  <rect
    x="0" y="0"
    [attr.width]="vbWidth"
    [attr.height]="vbHeight"
    filter="url(#spaceNoise)"
    opacity="0.55"
  ></rect>

  <g class="nebula">
    <circle cx="250" cy="260" r="120" fill="#2b3bff" opacity="0.08" filter="url(#nebulaBlur)"></circle>
    <circle cx="920" cy="420" r="160" fill="#ff2bd6" opacity="0.05" filter="url(#nebulaBlur)"></circle>
    <circle cx="650" cy="190" r="140" fill="#2bffd5" opacity="0.04" filter="url(#nebulaBlur)"></circle>
  </g>

  <g class="stars stars--small">
    <circle
      *ngFor="let s of small; trackBy: trackByIndex"
      [attr.cx]="s.cx"
      [attr.cy]="s.cy"
      [attr.r]="s.r"
      fill="white"
      [attr.opacity]="s.o"
    ></circle>
  </g>

  <g class="stars stars--mid" filter="url(#starGlow)">
    <circle
      *ngFor="let s of mid; trackBy: trackByIndex"
      [attr.cx]="s.cx"
      [attr.cy]="s.cy"
      [attr.r]="s.r"
      fill="white"
      [attr.opacity]="s.o"
    ></circle>
  </g>

  <rect x="0" y="0" [attr.width]="vbWidth" [attr.height]="vbHeight" fill="url(#vignetteGradient)"></rect>
</svg>
  `,
  styles: [`
:host { display:block; width:100%; height:100%; }
.starfield { width:100%; height:100%; display:block; background:#02030a; }
.nebula { mix-blend-mode: screen; opacity: 0.9; animation: nebulaFloat 240s ease-in-out infinite; }
.stars--small { animation: driftSmall 120s linear infinite; }
.stars--mid { animation: driftMid 180s linear infinite; }

@keyframes driftSmall { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-30px,18px,0)} }
@keyframes driftMid { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-18px,10px,0)} }
@keyframes nebulaFloat {
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(10px,-6px,0) scale(1.02)}
  100%{transform:translate3d(0,0,0) scale(1)}
}
  `]
})
export class StarfieldComponent implements OnChanges {
  @Input() vbWidth = 1200;
  @Input() vbHeight = 800;
  @Input() smallStars = 900;
  @Input() midStars = 250;
  @Input() seed = 1337;

  small: Star[] = [];
  mid: Star[] = [];

  ngOnChanges(_: SimpleChanges): void {
    this.generate();
  }

  private generate(): void {
    const rand = mulberry32(this.seed);

    const genStars = (count: number, rMin: number, rMax: number, oMin: number, oMax: number): Star[] => {
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const x = rand() * this.vbWidth;
        const y = rand() * this.vbHeight;
        const r = rMin + rand() * (rMax - rMin);
        const o = oMin + rand() * (oMax - oMin);
        stars.push({ cx: x, cy: y, r, o });
      }
      return stars;
    };

    this.small = genStars(this.smallStars, 0.25, 0.9, 0.15, 0.75);
    this.mid = genStars(this.midStars, 0.7, 1.8, 0.25, 0.9);
  }

  trackByIndex(i: number): number {
    return i;
  }
}
