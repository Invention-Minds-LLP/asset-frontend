import {
  AfterViewInit, Directive, ElementRef, NgZone, OnDestroy
} from '@angular/core';

/**
 * Auto-applies a native browser tooltip (`title` attribute) to an element
 * whose text content is being truncated by CSS (e.g. `text-overflow: ellipsis`).
 * The tooltip shows ONLY when the rendered text is wider than the box — so
 * short values don't get a redundant tooltip.
 *
 * Usage:
 *   <td appOverflowTooltip>{{ asset.name }}</td>
 *   <span appOverflowTooltip class="text-truncate">{{ longValue }}</span>
 *
 * Works with dynamic content: it observes both element resize and content
 * mutations, so re-renders after async data loads update the tooltip too.
 */
@Directive({
  selector: '[appOverflowTooltip]',
  standalone: true,
})
export class OverflowTooltipDirective implements AfterViewInit, OnDestroy {
  private resizeObs?: ResizeObserver;
  private mutationObs?: MutationObserver;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    // Initial sync
    this.sync();

    // Re-check on size changes (column resize, viewport resize, etc.)
    this.zone.runOutsideAngular(() => {
      this.resizeObs = new ResizeObserver(() => this.sync());
      this.resizeObs.observe(this.el.nativeElement);

      // Re-check on content changes (text re-binding from async data)
      this.mutationObs = new MutationObserver(() => this.sync());
      this.mutationObs.observe(this.el.nativeElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.mutationObs?.disconnect();
  }

  private sync(): void {
    const host = this.el.nativeElement;
    const overflowing = host.scrollWidth > host.clientWidth + 1;
    const fullText = (host.textContent || '').trim();
    if (overflowing && fullText) {
      if (host.getAttribute('title') !== fullText) host.setAttribute('title', fullText);
    } else {
      if (host.hasAttribute('title')) host.removeAttribute('title');
    }
  }
}
