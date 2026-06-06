import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_AU_VOICE_ID,
  getElevenLabsVoiceId,
  isElevenLabsTtsConfigured,
  synthesizeElevenLabsSpeech,
} from "./elevenlabs-tts.js";

const originalKey = process.env.ELEVENLABS_API_KEY;
const originalVoice = process.env.ELEVENLABS_VOICE_ID;

test.after(() => {
  if (originalKey === undefined) {
    delete process.env.ELEVENLABS_API_KEY;
  } else {
    process.env.ELEVENLABS_API_KEY = originalKey;
  }
  if (originalVoice === undefined) {
    delete process.env.ELEVENLABS_VOICE_ID;
  } else {
    process.env.ELEVENLABS_VOICE_ID = originalVoice;
  }
});

test("isElevenLabsTtsConfigured reflects trimmed API key", () => {
  delete process.env.ELEVENLABS_API_KEY;
  assert.equal(isElevenLabsTtsConfigured(), false);

  process.env.ELEVENLABS_API_KEY = "  sk-test  ";
  assert.equal(isElevenLabsTtsConfigured(), true);
});

test("getElevenLabsVoiceId defaults to Charlie", () => {
  delete process.env.ELEVENLABS_VOICE_ID;
  assert.equal(getElevenLabsVoiceId(), DEFAULT_AU_VOICE_ID);
});

test("synthesizeElevenLabsSpeech returns audio bytes from first successful model", async () => {
  process.env.ELEVENLABS_API_KEY = "sk-test";
  delete process.env.ELEVENLABS_VOICE_ID;

  const audio = new Uint8Array([1, 2, 3]).buffer;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    assert.match(url, /text-to-speech\/IKne3meq5aSn9XLyUdCD/);
    assert.equal(init?.method, "POST");
    assert.match(String(init?.body), /eleven_turbo_v2_5/);
    return new Response(audio, {
      status: 200,
      headers: { "content-type": "audio/mpeg" },
    });
  };

  const result = await synthesizeElevenLabsSpeech("G'day", fetchImpl);
  assert.equal(result.byteLength, 3);
});
