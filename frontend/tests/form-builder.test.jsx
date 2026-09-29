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
  within(screen.getByRole('list', { name: 'Form fields' }))
    .getAllByRole('button', { name: /^Reorder / })
    .map((button) => button.getAttribute('aria-label').replace('Reorder ', ''));

describe('FormBuilder', () => {
  it('adds a field from the palette and marks the form as unsaved', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    expect(screen.getByText('All changes saved')).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('region', { name: 'Add a field' })).getByRole('button', {
        name: 'Date',
      }),
    );

    expect(fieldOrder()).toEqual(['First', 'Date', 'Second']);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('reorders with move buttons and announces the change', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    await user.click(screen.getByRole('button', { name: 'Move Second up' }));
    expect(fieldOrder()).toEqual(['Second', 'First']);
    expect(screen.getByText('Second moved to position 1 of 2.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Second up' })).toBeDisabled();
  });

  it('blocks saving when a field has no label', async () => {
    const user = userEvent.setup();
    render(<FormBuilder form={form} />);

    await user.clear(screen.getByLabelText('Question'));
    await user.click(screen.getByRole('button', { name: /^Save/ }));

    expect(screen.getByText('Fix these before saving')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Field 1 needs a label.' })).toBeInTheDocument();
  });
});
