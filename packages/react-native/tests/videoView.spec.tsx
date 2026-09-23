import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-webrtc', () => import('./mocks/react-native-webrtc'));

import { PurpleCallioVideoView } from '../src/components/VideoView';
import { createFakeStream } from './fake-meeting';

function render(element: React.ReactElement) {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(element);
  });
  return renderer;
}

describe('PurpleCallioVideoView', () => {
  it('renders an empty placeholder View when stream is null', () => {
    const renderer = render(<PurpleCallioVideoView stream={null} testID="video" />);

    const root = renderer.root;
    expect(() => root.findByType('RTCView')).toThrow();
    const placeholder = root.findByType('RNView');
    expect(placeholder.props.testID).toBe('video');
  });

  it('renders an empty placeholder View when stream is undefined', () => {
    const renderer = render(<PurpleCallioVideoView stream={undefined} testID="video" />);
    expect(() => renderer.root.findByType('RTCView')).toThrow();
  });

  it('renders RTCView with streamURL from stream.toURL(), defaulting objectFit to cover and mirror to false', () => {
    const stream = createFakeStream();
    const renderer = render(<PurpleCallioVideoView stream={stream as unknown as MediaStream} testID="video" />);

    const rtcView = renderer.root.findByType('RTCView');
    expect(rtcView.props.streamURL).toBe('fake-stream-url://local');
    expect(rtcView.props.objectFit).toBe('cover');
    expect(rtcView.props.mirror).toBe(false);
  });

  it('passes through objectFit, mirror, and zOrder props', () => {
    const stream = createFakeStream();
    const renderer = render(
      <PurpleCallioVideoView stream={stream as unknown as MediaStream} objectFit="contain" mirror zOrder={2} />,
    );

    const rtcView = renderer.root.findByType('RTCView');
    expect(rtcView.props.objectFit).toBe('contain');
    expect(rtcView.props.mirror).toBe(true);
    expect(rtcView.props.zOrder).toBe(2);
  });
});
