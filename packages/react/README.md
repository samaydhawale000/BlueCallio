# @bluecallio/react

Official React components and hooks for BlueCallio, a developer-focused real-time communication infrastructure platform.

The package provides reusable React components, hooks, controls, participant layouts, device management, and meeting state.

## Features

- React meeting provider
- Meeting room
- Participant grid
- Participant tiles
- Active speaker view
- Camera controls
- Microphone controls
- Screen sharing
- Leave/end-call controls
- Device selector
- Waiting room
- Connection status
- Speaking indicator
- Local video preview
- Participant hooks
- Device hooks
- Connection state hooks
- TypeScript support

---

# Installation

```bash
npm install @bluecallio/react
```

`@bluecallio/react` uses the BlueCallio SDK internally.

If you are also using the SDK directly in your application:

```bash
npm install @bluecallio/react @bluecallio/sdk
```

---

# Requirements

- React 18+
- React DOM 18+
- A browser with WebRTC support
- Camera/microphone permissions for audio/video functionality

---

# Basic Architecture

```text
Your React Application
          │
          ▼
   @bluecallio/react
          │
          ▼
    @bluecallio/sdk
          │
          ▼
      BlueCallio
          │
          ▼
        WebRTC
```

`@bluecallio/react` provides the React layer while `@bluecallio/sdk` provides the underlying BlueCallio communication engine.

---

# Meeting Provider

`MeetingProvider` provides meeting state, participant information, media streams, connection state, and meeting controls to your React components.

Basic usage:

```tsx
import {
  MeetingProvider,
  MeetingRoom
} from "@bluecallio/react";

export default function Meeting() {
  return (
    <MeetingProvider>
      <MeetingRoom>
        {/* Your meeting UI */}
      </MeetingRoom>
    </MeetingProvider>
  );
}
```

Components and hooks that depend on meeting state should be rendered inside `MeetingProvider`.

---

# Meeting Hooks

## `useMeeting()`

Returns the complete meeting context.

```tsx
import { useMeeting } from "@bluecallio/react";

function MeetingControls() {
  const {
    callId,
    participantId,
    connectionState,
    participants,
    localStream,
    remoteStream,
    join,
    leave,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare
  } = useMeeting();

  return (
    <div>
      <p>Call: {callId}</p>
      <p>Connection: {connectionState}</p>
      <p>Participants: {participants.length}</p>
    </div>
  );
}
```

The meeting context exposes:

```text
engine
callId
participantId
connectionState
participants
media
remoteStream
localStream
join
leave
toggleCamera
toggleMicrophone
toggleScreenShare
enableCamera
disableCamera
enableMicrophone
disableMicrophone
startScreenShare
stopScreenShare
```

---

# `useParticipants()`

Returns the current participants.

```tsx
import { useParticipants } from "@bluecallio/react";

function Participants() {
  const participants = useParticipants();

  return (
    <div>
      {participants.map((participant) => (
        <div key={participant.participantId}>
          {participant.participantId}
        </div>
      ))}
    </div>
  );
}
```

Return type:

```ts
Participant[]
```

---

# `useParticipant()`

Retrieve a specific participant by participant ID.

```tsx
import { useParticipant } from "@bluecallio/react";

function ParticipantInfo() {
  const participant = useParticipant("participant-123");

  if (!participant) {
    return <div>Participant not found</div>;
  }

  return (
    <div>
      {participant.participantId}
    </div>
  );
}
```

Return type:

```ts
Participant | undefined
```

---

# `useDevices()`

Provides access to available audio and video devices.

```tsx
import { useDevices } from "@bluecallio/react";

function Devices() {
  const {
    audioInputs,
    audioOutputs,
    videoInputs,
    selected,
    loading,
    refresh,
    setAudioInput,
    setAudioOutput,
    setVideoInput
  } = useDevices();

  return (
    <div>
      <p>
        Device loading:
        {loading ? "Yes" : "No"}
      </p>

      {audioInputs.map((device) => (
        <button
          key={device.deviceId}
          onClick={() => setAudioInput(device.deviceId)}
        >
          {device.label}
        </button>
      ))}
    </div>
  );
}
```

## Device Information

```ts
interface DeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
}
```

## Device Result

```ts
interface DevicesResult {
  audioInputs: DeviceInfo[];
  audioOutputs: DeviceInfo[];
  videoInputs: DeviceInfo[];

  selected: {
    audioInput: string;
    audioOutput: string;
    videoInput: string;
  };

  loading: boolean;

  refresh: () => Promise<void>;

  setAudioInput: (deviceId: string) => void;
  setAudioOutput: (deviceId: string) => void;
  setVideoInput: (deviceId: string) => void;
}
```

---

# `useConnection()`

Returns the current BlueCallio connection state.

```tsx
import { useConnection } from "@bluecallio/react";

function Connection() {
  const connectionState = useConnection();

  return (
    <div>
      Connection: {connectionState}
    </div>
  );
}
```

Return type:

```ts
ConnectionState
```

---

# Layout Components

## `MeetingRoom`

A high-level meeting container.

```tsx
import {
  MeetingProvider,
  MeetingRoom
} from "@bluecallio/react";

function App() {
  return (
    <MeetingProvider>
      <MeetingRoom>
        {/* Meeting content */}
      </MeetingRoom>
    </MeetingProvider>
  );
}
```

Props:

```ts
interface MeetingRoomProps {
  children?: React.ReactNode;
  className?: string;
  showWaitingRoom?: boolean;
  waitingRoomLabel?: string;
}
```

Defaults:

```text
showWaitingRoom = true
waitingRoomLabel = "Waiting for the other participant…"
```

---

# `ParticipantGrid`

Displays multiple participant streams.

```tsx
import { ParticipantGrid } from "@bluecallio/react";

<ParticipantGrid
  streams={streams}
  names={names}
  localStream={localStream}
/>
```

Props:

```ts
interface ParticipantGridProps {
  streams: Record<string, MediaStream | null>;
  names?: Record<string, string>;
  localStream?: MediaStream | null;
  localName?: string;
  localId?: string;
}
```

Defaults:

```text
localName = "You"
localId = "me"
```

---

# `ParticipantTile`

Displays an individual participant.

```tsx
import { ParticipantTile } from "@bluecallio/react";

<ParticipantTile
  participantId="participant-123"
  name="John"
  stream={remoteStream}
/>
```

Props:

```ts
interface ParticipantTileProps {
  participantId: string;
  name?: string;
  stream?: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

---

# `ActiveSpeakerView`

Displays a primary active speaker.

```tsx
import { ActiveSpeakerView } from "@bluecallio/react";

<ActiveSpeakerView
  stream={speakerStream}
  name="John"
  participantId="participant-123"
  localStream={localStream}
/>
```

Props:

```ts
interface ActiveSpeakerViewProps {
  stream: MediaStream | null;
  name?: string;
  participantId?: string;
  localStream?: MediaStream | null;
}
```

Default:

```text
participantId = "speaker"
```

---

# `Avatar`

Displays a participant avatar.

```tsx
import { Avatar } from "@bluecallio/react";

<Avatar
  id="participant-123"
  size={48}
/>
```

Props:

```ts
id: string;
size?: number;
```

Default:

```text
size = 48
```

---

# Call Controls

## `ControlButton`

Generic reusable meeting control.

```tsx
import { ControlButton } from "@bluecallio/react";

<ControlButton
  label="Camera"
  active={true}
  onClick={() => {
    console.log("Camera clicked");
  }}
>
  Camera
</ControlButton>
```

Props:

```ts
interface ControlButtonProps {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
  children: React.ReactNode;
  title?: string;
}
```

---

# `CameraButton`

Built-in camera toggle control.

```tsx
import { CameraButton } from "@bluecallio/react";

<CameraButton />
```

Custom labels:

```tsx
<CameraButton
  labelOn="Turn camera off"
  labelOff="Turn camera on"
/>
```

Props:

```ts
interface CameraButtonProps {
  labelOn?: string;
  labelOff?: string;
  className?: string;
}
```

Default labels:

```text
Camera on
Camera off
```

---

# `MicrophoneButton`

Built-in microphone toggle control.

```tsx
import { MicrophoneButton } from "@bluecallio/react";

<MicrophoneButton />
```

Custom labels:

```tsx
<MicrophoneButton
  labelOn="Mute"
  labelOff="Unmute"
/>
```

Props:

```ts
interface MicrophoneButtonProps {
  labelOn?: string;
  labelOff?: string;
}
```

Default labels:

```text
Unmute
Mute
```

---

# `ScreenShareButton`

Built-in screen sharing control.

```tsx
import { ScreenShareButton } from "@bluecallio/react";

<ScreenShareButton />
```

The component toggles screen sharing.

Default labels:

```text
Share screen
Stop share
```

---

# `LeaveButton`

Built-in call leave/end control.

```tsx
import { LeaveButton } from "@bluecallio/react";

<LeaveButton />
```

Custom label and callback:

```tsx
<LeaveButton
  label="End call"
  onLeave={() => {
    console.log("Call ended");
  }}
/>
```

Props:

```ts
interface LeaveButtonProps {
  label?: string;
  onLeave?: () => void;
  size?: number;
}
```

Default label:

```text
End call
```

---

# Device Selector

Use the built-in device selector:

```tsx
import { DeviceSelector } from "@bluecallio/react";

<DeviceSelector />
```

Hide the label:

```tsx
<DeviceSelector showLabel={false} />
```

Props:

```ts
interface DeviceSelectorProps {
  showLabel?: boolean;
  className?: string;
}
```

---

# Waiting Room

Display a waiting room while waiting for another participant.

```tsx
import { WaitingRoom } from "@bluecallio/react";

<WaitingRoom
  title="Waiting for participant"
  subtitle="The other participant has not joined yet."
>
  {/* Optional content */}
</WaitingRoom>
```

Props:

```ts
interface WaitingRoomProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}
```

---

# Connection Status

Display the current connection state.

```tsx
import { ConnectionStatus } from "@bluecallio/react";

<ConnectionStatus />
```

---

# Speaking Indicator

Display an indicator when a participant is speaking.

```tsx
import { SpeakingIndicator } from "@bluecallio/react";

<SpeakingIndicator
  active={true}
  label="Speaking"
/>
```

Props:

```ts
interface SpeakingIndicatorProps {
  active?: boolean;
  label?: string;
  color?: string;
}
```

---

# Local Video Preview

Display the local camera stream.

```tsx
import { LocalVideoPreview } from "@bluecallio/react";

<LocalVideoPreview />
```

Custom class:

```tsx
<LocalVideoPreview className="my-preview" />
```

Props:

```ts
interface LocalVideoPreviewProps {
  className?: string;
}
```

---

# Icons

The package exports reusable meeting icons:

```tsx
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneDownIcon,
  ScreenShareIcon
} from "@bluecallio/react";
```

Available icons:

```text
MicIcon
MicOffIcon
VideoIcon
VideoOffIcon
PhoneDownIcon
ScreenShareIcon
```

---

# Complete UI Example

A basic meeting interface can be assembled using the provided components:

```tsx
import {
  MeetingProvider,
  MeetingRoom,
  ParticipantGrid,
  CameraButton,
  MicrophoneButton,
  ScreenShareButton,
  LeaveButton,
  ConnectionStatus,
  DeviceSelector
} from "@bluecallio/react";

export default function Meeting() {
  return (
    <MeetingProvider>
      <MeetingRoom>
        <ConnectionStatus />

        <DeviceSelector />

        <ParticipantGrid
          streams={{}}
          localStream={null}
        />

        <div>
          <CameraButton />
          <MicrophoneButton />
          <ScreenShareButton />
          <LeaveButton />
        </div>
      </MeetingRoom>
    </MeetingProvider>
  );
}
```

The exact meeting configuration and session information depend on how your application creates and joins BlueCallio calls.

---

# Building a Custom UI

You are not required to use all the built-in components.

You can use the hooks to create your own interface:

```tsx
import {
  useMeeting,
  useParticipants,
  useConnection
} from "@bluecallio/react";

function CustomMeetingUI() {
  const meeting = useMeeting();
  const participants = useParticipants();
  const connection = useConnection();

  return (
    <div>
      <div>Connection: {connection}</div>

      <div>
        Participants: {participants.length}
      </div>

      <button onClick={meeting.toggleMicrophone}>
        Toggle microphone
      </button>

      <button onClick={meeting.toggleCamera}>
        Toggle camera
      </button>

      <button onClick={meeting.toggleScreenShare}>
        Toggle screen share
      </button>

      <button onClick={meeting.leave}>
        Leave
      </button>
    </div>
  );
}
```

This approach lets you keep your own application design while using BlueCallio's meeting state and WebRTC functionality.

---

# Meeting Controls Available Through `useMeeting()`

The meeting context provides the following controls:

```text
join()
leave()

toggleCamera()
toggleMicrophone()
toggleScreenShare()

enableCamera()
disableCamera()

enableMicrophone()
disableMicrophone()

startScreenShare()
stopScreenShare()
```

Example:

```tsx
const {
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  enableCamera,
  disableCamera,
  enableMicrophone,
  disableMicrophone,
  startScreenShare,
  stopScreenShare,
  leave
} = useMeeting();
```

---

# Browser Permissions

BlueCallio uses browser media APIs for real-time communication.

Depending on the functionality you use, the browser may request access to:

- Camera
- Microphone
- Screen sharing

Users must grant the required permissions for those features to work.

Your application should handle permission errors and provide an appropriate user experience when access is denied.

---

# API Keys

Do not put your BlueCallio project API key inside React components or browser code.

Bad:

```tsx
const client = new BlueCallioClient({
  apiKey: "YOUR_SECRET_API_KEY"
});
```

Instead, create/manage calls from your backend and provide the required session information to your frontend.

Recommended architecture:

```text
Browser
   │
   │ session information
   ▼
Your Backend
   │
   │ API key
   ▼
BlueCallio API
```

The BlueCallio API key should remain server-side.

---

# TypeScript

The package includes TypeScript declaration files.

Your editor should automatically provide type checking and autocomplete when using:

```tsx
import {
  MeetingProvider,
  MeetingRoom,
  ParticipantGrid,
  CameraButton,
  MicrophoneButton
} from "@bluecallio/react";
```

---

# Available Exports

The package currently exports:

```text
MeetingProvider
useMeetingContext

useMeeting
useParticipants
useParticipant
useDevices
useConnection

MeetingRoom
ParticipantGrid
ParticipantTile
ActiveSpeakerView
Avatar

ControlButton
CameraButton
MicrophoneButton
ScreenShareButton
LeaveButton

MicIcon
MicOffIcon
VideoIcon
VideoOffIcon
PhoneDownIcon
ScreenShareIcon

DeviceSelector
WaitingRoom
ConnectionStatus
SpeakingIndicator
LocalVideoPreview
```

---

# Related Package

BlueCallio JavaScript/TypeScript SDK:

```bash
npm install @bluecallio/sdk
```

The SDK provides:

- REST API client
- Call management
- Participant session handling
- Headless WebRTC meeting functionality
- TypeScript types

---

# Package

```text
@bluecallio/react
```

Current package version:

```text
0.1.2
```

---

# License

MIT
