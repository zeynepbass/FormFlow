import { BarChart3, Download, Inbox, Keyboard, Link2, ListChecks } from 'lucide-react';

export const highlights = [
  {
    icon: Keyboard,
    title: 'A builder that works with any input',
    body: 'Add, edit, duplicate and reorder fields by dragging, with the keyboard, or with simple move buttons.',
  },
  {
    icon: ListChecks,
    title: 'Eleven field types',
    body: 'Text, email, number, phone, URL, dropdowns, radio buttons, checkboxes, dates and file uploads.',
  },
  {
    icon: Link2,
    title: 'One clean link to share',
    body: 'Every published form gets a short address that loads fast on any phone or connection.',
  },
  {
    icon: Inbox,
    title: 'Responses in one inbox',
    body: 'Search answers, filter by date and open any submission to see every field in context.',
  },
  {
    icon: BarChart3,
    title: 'Numbers that matter',
    body: 'Views, starts, submissions and completion rate, day by day, without extra setup.',
  },
  {
    icon: Download,
    title: 'Export when you need to',
    body: 'Download responses as a CSV that opens safely in Excel, Numbers and Google Sheets.',
  },
];

export const steps = [
  { title: 'Build', body: 'Pick fields, write clear labels and mark what is required.' },
  { title: 'Share', body: 'Publish and send the link. Pause it any time to stop new responses.' },
  { title: 'Understand', body: 'Read responses as they arrive and see how your form performs.' },
];

export const faqs = [
  {
    question: 'Do people need an account to fill in my form?',
    answer: 'No. Anyone with the link can open a published form and submit a response.',
  },
  {
    question: 'Will my forms show up in search engines?',
    answer:
      'Not unless you want them to. Forms are hidden from search engines by default, and you can allow indexing per form in its settings.',
  },
  {
    question: 'What happens when I pause a form?',
    answer:
      'The link keeps working but shows that the form is not accepting responses. Publish it again to reopen it.',
  },
  {
    question: 'Which files can respondents upload?',
    answer: 'PDF, PNG, JPEG, WebP and plain text files up to 5 MB each.',
  },
  {
    question: 'Can I take my data with me?',
    answer: 'Yes. Every form can export its responses as a CSV file at any time.',
  },
];
