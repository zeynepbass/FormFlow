import {
  AlignLeft,
  AtSign,
  Calendar,
  CircleDot,
  Hash,
  Link,
  Phone,
  SquareCheck,
  SquareChevronDown,
  Type,
  Upload,
} from 'lucide-react';

export const FIELD_TYPE_OPTIONS = [
  { type: 'short_text', label: 'Short text', icon: Type },
  { type: 'long_text', label: 'Long text', icon: AlignLeft },
  { type: 'email', label: 'Email', icon: AtSign },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'url', label: 'URL', icon: Link },
  { type: 'select', label: 'Dropdown', icon: SquareChevronDown },
  { type: 'radio', label: 'Single choice', icon: CircleDot },
  { type: 'checkbox', label: 'Checkboxes', icon: SquareCheck },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'file', label: 'File upload', icon: Upload },
];

export const FIELD_TYPE_MAP = Object.fromEntries(
  FIELD_TYPE_OPTIONS.map((option) => [option.type, option]),
);
