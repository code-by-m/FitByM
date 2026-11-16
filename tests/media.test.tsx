import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ExerciseMedia } from '../src/components/ExerciseMedia';
import { exerciseMediaSchema, isDirectVideo } from '../src/lib/media';
afterEach(cleanup);
it('HTTPS doğrular, tehlikeli veya kimlik bilgisi içeren adresleri reddeder', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:image/png;base64,a',
    'http://media.example.test/a.png',
    'https://user:password@media.example.test/a.png',
  ])
    expect(exerciseMediaSchema.safeParse({ imageUrl: url, videoUrl: '' }).success).toBe(false);
  expect(
    exerciseMediaSchema.parse({ imageUrl: ' https://media.example.test/a.png ', videoUrl: '' })
      .imageUrl,
  ).toBe('https://media.example.test/a.png');
  expect(isDirectVideo('https://media.example.test/a.mp4?token=test')).toBe(true);
  expect(isDirectVideo('https://video.example.test/watch')).toBe(false);
});
it('görsel hatasını açıklar ve video sayfasını iframe yerine güvenli bağlantıyla açar', () => {
  render(
    <ExerciseMedia
      name="Squat"
      imageUrl="https://media.example.test/squat.png"
      videoUrl="https://video.example.test/watch"
    />,
  );
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('status')).toHaveTextContent('Görsel yüklenemedi');
  expect(screen.getByRole('link', { name: 'Videoyu yeni sekmede izle' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  expect(document.querySelector('iframe')).toBeNull();
});
it('video controls/playsinline kullanır, otomatik indirme veya oynatma başlatmaz', () => {
  render(
    <ExerciseMedia name="Squat" imageUrl="" videoUrl="https://media.example.test/squat.mp4" />,
  );
  const video = document.querySelector('video')!;
  expect(video.controls).toBe(true);
  expect(video.playsInline).toBe(true);
  expect(video.preload).toBe('none');
  expect(video.autoplay).toBe(false);
  fireEvent.error(video);
  expect(screen.getByRole('status')).toHaveTextContent('Video oynatılamadı');
});
it('eski yedekteki geçersiz adresleri medya olarak yüklemez', () => {
  render(
    <ExerciseMedia name="Squat" imageUrl="javascript:alert(1)" videoUrl="data:text/html,test" />,
  );
  expect(document.querySelector('img,video,iframe,a')).toBeNull();
});
