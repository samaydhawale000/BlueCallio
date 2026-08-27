"""
Synthesizes BlueCallio's original ringback + ringtone cues from scratch —
pure additive sine synthesis with hand-shaped envelopes, no samples, no
external audio, so there is no licensing question: this is 100% original
programmatic composition owned by BlueCallio.

Design rationale (see SOURCE.md for the full writeup):
- Ringback (caller waiting): a flat, calm two-note "doo-doo" pair (G4 -> C5,
  a perfect fourth), soft bell-like timbre, long pause between repeats.
  Static/non-melodic contour by design — it should recede into the
  background over 20-30s of waiting.
- Ringtone (receiver incoming): a brighter three-note ascending phrase
  (C5 -> E5 -> G5, a major triad arpeggio with a small upward flourish on
  the last note), clearly more present and "call to action" than the
  ringback, but still no alarm-like frequencies and no melody borrowed from
  any real product or composition.
"""
import numpy as np
import wave
import struct

SR = 44100


def make_note(freq, duration_ms, amp=0.2, harmonic_amp=0.15, attack_ms=12,
              pitch_bend=0.0, release_k=3.5):
    n = int(SR * duration_ms / 1000)
    if n <= 0:
        return np.zeros(0)
    t = np.arange(n) / SR
    dur_s = duration_ms / 1000.0
    # Gentle upward pitch bend for the "melodic flourish" note only.
    freq_t = freq * (1.0 + pitch_bend * (t / dur_s))
    phase = 2 * np.pi * np.cumsum(freq_t) / SR
    fundamental = np.sin(phase)
    # Soft upper harmonic for a warm, bell-like timbre instead of a flat,
    # robotic sine beep.
    harmonic = np.sin(2 * phase) * harmonic_amp
    wave_data = fundamental + harmonic

    attack_n = min(int(SR * attack_ms / 1000), n)
    env = np.ones(n)
    if attack_n > 0:
        env[:attack_n] = np.linspace(0, 1, attack_n)
    release_len = n - attack_n
    if release_len > 0:
        env[attack_n:] *= np.exp(-release_k * np.arange(release_len) / release_len)

    return wave_data * env * amp


def make_silence(duration_ms):
    return np.zeros(int(SR * duration_ms / 1000))


def write_wav(path, samples):
    # Normalize headroom safety (should already be well under 1.0 by design)
    # and convert to 16-bit PCM mono.
    peak = np.max(np.abs(samples)) if len(samples) else 0
    if peak > 0.95:
        samples = samples * (0.95 / peak)
    pcm = (samples * 32767).astype(np.int16)
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(struct.pack('<%dh' % len(pcm), *pcm))


def ringback_cycle():
    doo1 = make_note(392.00, 140, amp=0.16, harmonic_amp=0.12, attack_ms=12)
    gap1 = make_silence(90)
    doo2 = make_note(523.25, 170, amp=0.16, harmonic_amp=0.12, attack_ms=12)
    pause = make_silence(1500)
    return np.concatenate([doo1, gap1, doo2, pause])


def ringtone_cycle():
    n1 = make_note(523.25, 170, amp=0.20, harmonic_amp=0.18, attack_ms=10)
    g1 = make_silence(55)
    n2 = make_note(659.25, 170, amp=0.20, harmonic_amp=0.18, attack_ms=10)
    g2 = make_silence(55)
    n3 = make_note(783.99, 300, amp=0.22, harmonic_amp=0.20, attack_ms=15,
                   pitch_bend=0.03, release_k=3.0)
    pause = make_silence(1850)
    return np.concatenate([n1, g1, n2, g2, n3, pause])


if __name__ == '__main__':
    rb = ringback_cycle()
    rt = ringtone_cycle()
    write_wav('ringback.wav', rb)
    write_wav('ringtone.wav', rt)
    print('ringback: %.2fs, peak=%.3f' % (len(rb) / SR, np.max(np.abs(rb))))
    print('ringtone: %.2fs, peak=%.3f' % (len(rt) / SR, np.max(np.abs(rt))))
