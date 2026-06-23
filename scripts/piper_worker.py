import json
import os
import sys
import wave

from piper import PiperVoice, SynthesisConfig


def send(message):
    print(json.dumps(message, separators=(",", ":")), flush=True)


def main():
    if len(sys.argv) != 2:
        raise RuntimeError("Piper model path is required")

    model_path = os.path.abspath(sys.argv[1])
    voice = PiperVoice.load(model_path)
    config = SynthesisConfig(length_scale=0.95, volume=1.0)
    send({"type": "ready"})

    for line in sys.stdin:
        request_id = ""
        try:
            request = json.loads(line)
            request_id = str(request.get("id", ""))
            text = str(request.get("text", "")).strip()
            output_path = os.path.abspath(str(request.get("outputPath", "")))
            if not request_id or not text or not output_path:
                raise ValueError("invalid synthesis request")

            with wave.open(output_path, "wb") as wav_file:
                voice.synthesize_wav(text, wav_file, syn_config=config)
            send({"id": request_id, "ok": True})
        except Exception as error:
            send({"id": request_id, "ok": False, "error": str(error)[:300]})


if __name__ == "__main__":
    main()
