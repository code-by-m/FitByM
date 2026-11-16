import { useState } from 'react';
import { isMediaUrl, isDirectVideo } from '../lib/media';
export function ExerciseMedia({
  name,
  imageUrl,
  videoUrl,
}: {
  name: string;
  imageUrl: string;
  videoUrl: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  return (
    <div className="exercise-media">
      {isMediaUrl(imageUrl) && (
        <figure>
          {!imageFailed ? (
            <img
              src={imageUrl}
              alt={`${name} uygulama görseli`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <p role="status">Görsel yüklenemedi. Bağlantıyı ve internet erişimini kontrol edin.</p>
          )}
          <figcaption>
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
              Görsel kaynağını aç
            </a>
          </figcaption>
        </figure>
      )}
      {isMediaUrl(videoUrl) && (
        <div>
          {isDirectVideo(videoUrl) && !videoFailed && (
            <video
              controls
              playsInline
              preload="none"
              aria-label={`${name} uygulama videosu`}
              onError={() => setVideoFailed(true)}
              src={videoUrl}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          )}
          {videoFailed && <p role="status">Video oynatılamadı. Kaynak bağlantısını deneyin.</p>}
          <a className="button" href={videoUrl} target="_blank" rel="noopener noreferrer">
            {isDirectVideo(videoUrl) ? 'Video kaynağını aç' : 'Videoyu yeni sekmede izle'}
          </a>
        </div>
      )}
      {(imageUrl || videoUrl) && (
        <p className="small-note">
          Medya harici kaynaktan yüklenir; internet bağlantısı gerekebilir.
        </p>
      )}
    </div>
  );
}
