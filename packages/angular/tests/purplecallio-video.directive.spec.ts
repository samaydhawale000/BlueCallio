import { describe, expect, it } from 'vitest';
import { ElementRef } from '@angular/core';

import { PurpleCallioVideoDirective } from '../src/lib/purplecallio-video.directive';

/** A plain object standing in for an `HTMLVideoElement`, no DOM required. */
function fakeVideoElement() {
  return {
    srcObject: null as unknown,
    autoplay: false,
    muted: false,
    playsInline: false,
  };
}

function createDirective(el: ReturnType<typeof fakeVideoElement>) {
  const elementRef = { nativeElement: el } as ElementRef<HTMLVideoElement>;
  return new PurpleCallioVideoDirective(elementRef);
}

describe('PurpleCallioVideoDirective', () => {
  it('attaches the given stream to the video element as srcObject', () => {
    const el = fakeVideoElement();
    const directive = createDirective(el);
    const stream = { id: 'stream-1' } as unknown as MediaStream;

    directive.stream = stream;
    directive.ngOnChanges({
      stream: { currentValue: stream, previousValue: null, firstChange: true, isFirstChange: () => true },
    });

    expect(el.srcObject).toBe(stream);
  });

  it('defaults to autoplay=true, playsInline=true, muted=true', () => {
    const el = fakeVideoElement();
    const directive = createDirective(el);

    directive.ngOnChanges({
      stream: { currentValue: null, previousValue: undefined, firstChange: true, isFirstChange: () => true },
    });

    expect(el.autoplay).toBe(true);
    expect(el.playsInline).toBe(true);
    expect(el.muted).toBe(true);
  });

  it('allows overriding muted (e.g. false for a remote participant video)', () => {
    const el = fakeVideoElement();
    const directive = createDirective(el);
    directive.muted = false;

    directive.ngOnChanges({
      muted: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false },
    });

    expect(el.muted).toBe(false);
  });

  it('clears srcObject when the stream input becomes null', () => {
    const el = fakeVideoElement();
    const directive = createDirective(el);
    const stream = { id: 'stream-1' } as unknown as MediaStream;

    directive.stream = stream;
    directive.ngOnChanges({
      stream: { currentValue: stream, previousValue: null, firstChange: true, isFirstChange: () => true },
    });
    expect(el.srcObject).toBe(stream);

    directive.stream = null;
    directive.ngOnChanges({
      stream: { currentValue: null, previousValue: stream, firstChange: false, isFirstChange: () => false },
    });
    expect(el.srcObject).toBeNull();
  });

  it('clears srcObject on destroy', () => {
    const el = fakeVideoElement();
    const directive = createDirective(el);
    const stream = { id: 'stream-1' } as unknown as MediaStream;

    directive.stream = stream;
    directive.ngOnChanges({
      stream: { currentValue: stream, previousValue: null, firstChange: true, isFirstChange: () => true },
    });

    directive.ngOnDestroy();

    expect(el.srcObject).toBeNull();
  });
});
