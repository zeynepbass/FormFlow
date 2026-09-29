import { BarChart3, Download, Inbox, Keyboard, Link2, ListChecks } from 'lucide-react';

export const highlights = [
  {
    icon: Keyboard,
    title: 'Her kullanıcıya uygun form oluşturucu',
    body: 'Alanları sürükleyerek, klavyeyle ya da taşıma butonlarıyla ekle, düzenle, kopyala ve sırala.',
  },
  {
    icon: ListChecks,
    title: 'On bir alan türü',
    body: 'Metin, e-posta, sayı, telefon, URL, açılır liste, tek ve çoklu seçim, tarih ve dosya yükleme.',
  },
  {
    icon: Link2,
    title: 'Paylaşması kolay tek bağlantı',
    body: 'Yayınlanan her form, her telefonda ve bağlantıda hızlı açılan kısa bir adres alır.',
  },
  {
    icon: Inbox,
    title: 'Tüm yanıtlar tek yerde',
    body: 'Yanıtlarda ara, tarihe göre filtrele ve her gönderimi tüm alanlarıyla görüntüle.',
  },
  {
    icon: BarChart3,
    title: 'Önemli olan sayılar',
    body: 'Görüntülenme, başlama, gönderim ve tamamlama oranı; ek kurulum olmadan, gün gün.',
  },
  {
    icon: Download,
    title: 'İstediğin an dışa aktar',
    body: 'Yanıtları Excel, Numbers ve Google Sheets’te güvenle açılan bir CSV dosyası olarak indir.',
  },
];

export const steps = [
  { title: 'Oluştur', body: 'Alanları seç, anlaşılır başlıklar yaz ve zorunlu olanları işaretle.' },
  {
    title: 'Paylaş',
    body: 'Formu yayınla ve bağlantıyı gönder. Yeni yanıtları durdurmak için dilediğin an duraklat.',
  },
  { title: 'Anla', body: 'Yanıtları geldikçe oku ve formunun nasıl performans gösterdiğini gör.' },
];

export const faqs = [
  {
    question: 'Formu dolduracak kişilerin hesap açması gerekiyor mu?',
    answer: 'Hayır. Bağlantıya sahip herkes yayınlanmış bir formu açıp yanıt gönderebilir.',
  },
  {
    question: 'Formlarım arama motorlarında görünür mü?',
    answer:
      'Sen istemedikçe hayır. Formlar varsayılan olarak arama motorlarından gizlenir; istersen her formun ayarlarından dizine eklenmesine izin verebilirsin.',
  },
  {
    question: 'Bir formu duraklatınca ne olur?',
    answer:
      'Bağlantı çalışmaya devam eder ama formun şu an yanıt kabul etmediği gösterilir. Yeniden yayınlayarak tekrar açabilirsin.',
  },
  {
    question: 'Hangi dosyalar yüklenebilir?',
    answer: 'Her biri en fazla 5 MB olan PDF, PNG, JPEG, WebP ve düz metin dosyaları.',
  },
  {
    question: 'Verilerimi dışa aktarabilir miyim?',
    answer: 'Evet. Her formun yanıtlarını dilediğin an CSV dosyası olarak indirebilirsin.',
  },
];
