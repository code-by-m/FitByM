import { useEffect, useId, useState } from 'react';
import { getExercisePreview, type Pose } from '../lib/exercise-previews';

function Figure({ pose }: { pose: Pose }) {
  return (
    <g
      fill="none"
      stroke="var(--primary)"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {pose.chains.map((chain, i) => (
        <polyline key={i} points={chain.map((p) => p.join(',')).join(' ')} />
      ))}
      <circle cx={pose.head[0]} cy={pose.head[1]} r="9" fill="var(--accent)" />
    </g>
  );
}
export function ExercisePreview({
  exerciseId,
  name,
  controls = false,
}: {
  exerciseId: string;
  name: string;
  controls?: boolean;
}) {
  const preview = getExercisePreview(exerciseId, name);
  const titleId = useId();
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setFrame((value) => 1 - value), 1600);
    return () => window.clearInterval(timer);
  }, [playing]);
  if (!preview) return null;
  const labels = preview.labels ?? ['Başlangıç', 'Hareket'];
  const poses = [preview.first, preview.second];
  const renderPose = (index: number, x: number) => (
    <g key={index} transform={`translate(${x},12)`}>
      {!preview.view && <path d="M 5 145 H 170" stroke="var(--border)" strokeWidth="2" />}
      {preview.support === 'wall' && (
        <path d="M 149 9 V 145" stroke="var(--muted)" strokeWidth="4" />
      )}
      {preview.support === 'bench' && (
        <path
          d="M 119 103 H 172 M 128 103 V 145 M 166 103 V 145"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="4"
        />
      )}
      <Figure pose={poses[index]} />
      <text x="85" y="166" textAnchor="middle" fill="var(--muted)" fontSize="10">
        {labels[index]}
      </text>
    </g>
  );
  return (
    <figure className={`movement-preview ${controls ? 'movement-preview-detail' : ''}`}>
      <svg viewBox="0 0 360 188" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          {name} — {labels[0]} ve {labels[1]}
          {preview.view ? ' (üstten görünüm)' : ''}
        </title>
        {playing ? (
          renderPose(frame, 95)
        ) : (
          <>
            {renderPose(0, 0)}
            <path
              d="M 174 89 H 186 M 182 85 L 187 89 L 182 93"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
            />
            {renderPose(1, 190)}
          </>
        )}
      </svg>
      {!controls && preview.view && <figcaption>Üstten görünüm · Yüzüstü</figcaption>}
      {controls && (
        <figcaption>
          <div className="row">
            <span>Hazır hareket önizlemesi{preview.view ? ' · Yüzüstü / üstten görünüm' : ''}</span>
            <button
              type="button"
              aria-pressed={playing}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? 'Durdur' : 'Hareketi oynat'}
            </button>
          </div>
          <p className="small-note">
            Şematik iki pozisyon gösterimi. Uygulama adımları için aşağıdaki açıklamayı takip et.
          </p>
        </figcaption>
      )}
    </figure>
  );
}
