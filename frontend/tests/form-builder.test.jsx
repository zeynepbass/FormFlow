import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FormBuilder } from '@/features/form-builder/form-builder';

const form = {
  id: '6abc03267892b86e0033f623',
  slug: 'feedback-ab12',
  title: 'Feedback',
  description: '',
  status: 'draft',
  version: 1,
  fields: [
    {
      id: 'fld_aaaaaaaaaa',
      type: 'short_text',
      label: 'First',
      description: '',
      placeholder: '',
      required: false,
      options: [],
      validation: {},
    },
    {
      id: 'fld_bbbbbbbbbb',
      type: 'email',
      label: 'Second',
      description: '',
      placeholder: '',
      required: false,
      options: [],
      validation: {},
    },
  ],
};

const fieldOrder = () =>
  within(screen.getByRole('list', { name: 'Form alanları' }))
    .getAllByRole('button', { name: / alanını sırala$/ })
    .map((button) => button.getAttribute('aria-label').replace(' alanını sırala', ''));

describe('FormBuilder', () => {
  it('adds a field from the palette and marks the form as unsaved', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    expect(screen.getByText('Tüm değişiklikler kaydedildi')).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('region', { name: 'Alan ekle' })).getByRole('button', {
        name: 'Tarih',
      }),
    );

    expect(fieldOrder()).toEqual(['First', 'Tarih', 'Second']);
    expect(screen.getByText('Kaydedilmemiş değişiklikler var')).toBeInTheDocument();
  });

  it('reorders with move buttons and announces the change', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    await user.click(screen.getByRole('button', { name: 'Second alanını yukarı taşı' }));
    expect(fieldOrder()).toEqual(['Second', 'First']);
    expect(screen.getByText('Second, 2 alan içinde 1. sıraya taşındı.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second alanını yukarı taşı' })).toBeDisabled();
  });

  it('blocks saving when a field has no label', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    await user.clear(screen.getByLabelText('Soru'));
    await user.click(screen.getByRole('button', { name: /^Kaydet/ }));

    expect(screen.getByText('Kaydetmeden önce bunları düzelt')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '1. alanın bir başlığı olmalı.' }),
    ).toBeInTheDocument();
  });
});
