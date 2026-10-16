"""Local processing only. Browser supplies decoded WAV; no remote music URLs."""
import argparse
import importlib.util
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.environ['TORCH_HOME'] = str(ROOT / '.engine' / 'models')
READY = ROOT / '.engine' / 'models' / 'mixlab-ready.json'


def emit(phase, message):
    print(json.dumps({'phase': phase, 'message': message}), flush=True)


def check():
    modules = {name: importlib.util.find_spec(name) is not None
               for name in ('torch', 'torchaudio', 'demucs', 'pedalboard', 'soundfile', 'lameenc')}
    return {'dependencies': all(modules.values()), 'modules': modules,
            'separation': all(modules.values()) and READY.exists(),
            'pitch': modules['pedalboard'] and modules['soundfile'] and modules['lameenc']}


def model():
    import torch
    from demucs.pretrained import get_model
    torch.set_num_threads(min(4, max(1, (os.cpu_count() or 2) - 1)))
    return get_model('htdemucs').cpu().eval()


def write_mp3(path, audio, rate):
    import lameenc
    import numpy as np
    audio = np.asarray(audio, dtype=np.float32)
    peak = float(np.max(np.abs(audio))) if audio.size else 0
    if peak > .98:
        audio = audio * (.98 / peak)
    pcm = (np.clip(audio.T, -1, 1) * 32767).astype('<i2').tobytes()
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(192)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(audio.shape[0])
    encoder.set_quality(2)
    Path(path).write_bytes(encoder.encode(pcm) + encoder.flush())


def process(args):
    import numpy as np
    import soundfile as sf
    audio, rate = sf.read(args.input, dtype='float32', always_2d=True)
    if not len(audio) or len(audio) / rate > 900 or audio.shape[1] > 2:
        raise ValueError('El audio debe tener hasta 15 minutos y uno o dos canales.')
    if not np.isfinite(audio).all():
        raise ValueError('El audio contiene muestras inválidas.')
    audio = audio.T.copy()
    if audio.shape[0] == 1:
        audio = np.repeat(audio, 2, axis=0)
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    if args.task == 'pitch':
        from pedalboard import time_stretch
        emit('pitch', 'Adaptando el tono con Rubber Band…')
        result = time_stretch(audio, rate, stretch_factor=1.,
                              pitch_shift_in_semitones=args.semitones,
                              high_quality=True, preserve_formants=True)
        if result.shape[1] < audio.shape[1]:
            result = np.pad(result, ((0, 0), (0, audio.shape[1] - result.shape[1])))
        result = result[:, :audio.shape[1]]
        write_mp3(out / 'result.mp3', result, rate)
    else:
        import torch
        from demucs.apply import apply_model
        from demucs.audio import convert_audio
        emit('model', 'Abriendo el separador de voz local…')
        net = model()
        mix = convert_audio(torch.from_numpy(audio), rate, net.samplerate, net.audio_channels)
        reference = mix.mean(0)
        mean, std = reference.mean(), reference.std()
        if float(std) < 1e-8:
            raise ValueError('El archivo no contiene señal suficiente para separar.')
        normalized = (mix - mean) / std
        emit('separating', 'Separando voz e instrumentos. Esto puede tardar varios minutos…')
        with torch.inference_mode():
            stems = apply_model(net, normalized[None], device='cpu', shifts=1,
                                split=True, overlap=.25, segment=7,
                                progress=False, num_workers=0)[0]
        stems = stems * std + mean / len(net.sources)
        vocal = stems[net.sources.index('vocals')]
        music = stems.sum(0) - vocal
        emit('encoding', 'Guardando las dos pistas separadas…')
        # Preserve the relative stem levels; use one shared scale.
        peak = max(float(vocal.abs().max()), float(music.abs().max()), .98)
        scale = .98 / peak
        write_mp3(out / 'vocals.mp3', (vocal * scale).numpy(), net.samplerate)
        write_mp3(out / 'instrumental.mp3', (music * scale).numpy(), net.samplerate)
    emit('done', 'Pista preparada.')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--check', action='store_true')
    p.add_argument('--prepare', action='store_true')
    p.add_argument('--task', choices=['separate', 'pitch'])
    p.add_argument('--input')
    p.add_argument('--output')
    p.add_argument('--semitones', type=int, choices=range(-6, 7), default=0)
    a = p.parse_args()
    if a.check:
        print(json.dumps(check()), flush=True)
    elif a.prepare:
        emit('install', 'Descargando el modelo oficial de Demucs si hace falta…')
        model()
        READY.parent.mkdir(parents=True, exist_ok=True)
        READY.write_text(json.dumps({'model': 'htdemucs'}), encoding='utf8')
        emit('ready', 'Motor local preparado para trabajar sin conexión.')
    elif a.task and a.input and a.output:
        process(a)
    else:
        p.error('Falta una tarea o un archivo de entrada.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit('error', str(error))
        raise SystemExit(1)
