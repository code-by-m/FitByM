import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../src/database/db';
import { repository } from '../src/database/repository';
import Dashboard from '../src/features/Dashboard';
import Workout from '../src/features/Workout';
import { Notices } from '../src/components/Notices';
import Exercises from '../src/features/Exercises';

beforeAll(async () => {
  await db.open();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => cleanup());
afterAll(async () => {
  await db.delete();
});
const wrap = (component: React.ReactNode) =>
  render(
    <MemoryRouter>
      <Notices>{component}</Notices>
    </MemoryRouter>,
  );
describe('Günlük kullanım ekranları', () => {
  it('ana sayfada ilk açılışta tamamlanmış antrenman veya ölçüm uydurmaz', async () => {
    wrap(<Dashboard />);
    expect(await screen.findByText('Henüz ölçüm eklenmedi')).toBeInTheDocument();
    expect(screen.getByText('Hikâyen ilk antrenmanla başlıyor.')).toBeInTheDocument();
  });
  it('form üzerinden özel egzersiz oluşturur ve aramada bulur', async () => {
    wrap(<Exercises />);
    fireEvent.click(screen.getByRole('button', { name: 'Egzersiz oluştur' }));
    fireEvent.change(screen.getByLabelText('Egzersiz adı'), {
      target: { value: 'Özel test hareketi' },
    });
    fireEvent.change(screen.getByLabelText('Uygulama adımları'), {
      target: { value: 'Kontrollü hareket edin.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(async () =>
      expect(await db.exercises.where('name').equals('Özel test hareketi').count()).toBe(1),
    );
    fireEvent.change(screen.getByPlaceholderText('Örn. squat'), { target: { value: 'Özel test' } });
    expect(await screen.findByRole('heading', { name: 'Özel test hareketi' })).toBeInTheDocument();
  });
  it('aktif antrenmanda girilen tekrarı otomatik kaydeder ve ekran yeniden açıldığında sürdürür', async () => {
    const id = await repository.startSession('plan-A');
    const view = wrap(<Workout />);
    await screen.findByRole('heading', { name: 'FULL BODY A' });
    const input = screen.getAllByLabelText('Tekrar')[0];
    fireEvent.change(input, { target: { value: '9' } });
    await waitFor(async () => {
      const ex = await db.workoutSessionExercises
        .where('workoutSessionId')
        .equals(id)
        .sortBy('sortOrder');
      const first = await db.workoutSets
        .where('workoutSessionExerciseId')
        .equals(ex[0].id)
        .sortBy('setNumber');
      expect(first[0].repetitions).toBe(9);
    });
    view.unmount();
    wrap(<Workout />);
    await screen.findByRole('heading', { name: 'FULL BODY A' });
    expect(screen.getAllByLabelText('Tekrar')[0]).toHaveValue(9);
    fireEvent.click(screen.getAllByRole('button', { name: '1. set tamamla' })[0]);
    await waitFor(() => expect(screen.getByText('1 / 12 set tamamlandı')).toBeInTheDocument());
  });
});
