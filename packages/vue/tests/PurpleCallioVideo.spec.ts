import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import PurpleCallioVideo from '../src/components/PurpleCallioVideo.vue';

/**
 * A real `MediaStream` has `Symbol.toStringTag === 'MediaStream'`, which is
 * what makes Vue's reactivity system treat it as an opaque host object and
 * leave it un-proxied when it flows through `props`/`reactive()` (Vue only
 * wraps values whose tag resolves to a plain Object/Array/Map/Set/etc — see
 * `@vue/reactivity`'s `getTargetType`). A plain `{ id }` object literal does
 * NOT have that tag, so Vue *would* wrap it in a reactive `Proxy`, breaking
 * `toBe`/`===` identity checks below in a way a real `MediaStream` never
 * would. Setting the tag here makes the fixture behave like the real thing.
 */
function fakeStream(id: string): MediaStream {
  return { id, [Symbol.toStringTag]: 'MediaStream' } as unknown as MediaStream;
}

describe('PurpleCallioVideo', () => {
  it('attaches the given stream to the video element as srcObject on mount', () => {
    const stream = fakeStream('stream-1');
    const wrapper = mount(PurpleCallioVideo, { props: { stream } });

    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.srcObject).toBe(stream);
  });

  it('renders no stream (srcObject stays null) when stream is null/undefined', () => {
    const wrapper = mount(PurpleCallioVideo, { props: { stream: null } });
    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.srcObject).toBeNull();
  });

  it('defaults to muted=true, autoplay=true, playsInline=true', () => {
    const wrapper = mount(PurpleCallioVideo, { props: { stream: null } });
    const video = wrapper.find('video').element as HTMLVideoElement;

    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.playsInline).toBe(true);
  });

  it('allows overriding muted (e.g. false for a remote participant video)', () => {
    const wrapper = mount(PurpleCallioVideo, { props: { stream: null, muted: false } });
    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.muted).toBe(false);
  });

  it('updates srcObject when the stream prop changes', async () => {
    const streamA = fakeStream('stream-a');
    const streamB = fakeStream('stream-b');
    const wrapper = mount(PurpleCallioVideo, { props: { stream: streamA } });

    await wrapper.setProps({ stream: streamB });

    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.srcObject).toBe(streamB);
  });

  it('clears srcObject when the stream prop becomes null', async () => {
    const stream = fakeStream('stream-1');
    const wrapper = mount(PurpleCallioVideo, { props: { stream } });

    await wrapper.setProps({ stream: null });

    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.srcObject).toBeNull();
  });

  it('clears srcObject on unmount', () => {
    const stream = fakeStream('stream-1');
    const wrapper = mount(PurpleCallioVideo, { props: { stream } });
    const video = wrapper.find('video').element as HTMLVideoElement;
    expect(video.srcObject).toBe(stream);

    wrapper.unmount();

    expect(video.srcObject).toBeNull();
  });
});
