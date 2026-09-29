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
  { type: 'short_text', label: 'Kısa metin', icon: Type },
  { type: 'long_text', label: 'Uzun metin', icon: AlignLeft },
  { type: 'email', label: 'E-posta', icon: AtSign },
  { type: 'number', label: 'Sayı', icon: Hash },
  { type: 'phone', label: 'Telefon', icon: Phone },
  { type: 'url', label: 'URL', icon: Link },
  { type: 'select', label: 'Açılır liste', icon: SquareChevronDown },
  { type: 'radio', label: 'Tek seçim', icon: CircleDot },
  { type: 'checkbox', label: 'Çoklu seçim', icon: SquareCheck },
  { type: 'date', label: 'Tarih', icon: Calendar },
  { type: 'file', label: 'Dosya yükleme', icon: Upload },
];

export const FIELD_TYPE_MAP = Object.fromEntries(
  FIELD_TYPE_OPTIONS.map((option) => [option.type, option]),
);
