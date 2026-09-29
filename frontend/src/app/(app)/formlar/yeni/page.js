import { PageHeader } from '@/components/common/page-header';
import { CreateForm } from '@/features/forms/create-form';

export const metadata = { title: 'Yeni form' };

export default function CreateFormPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Yeni form"
        description="Bir başlıkla başla. Her şeyi sonra değiştirebilirsin."
      />
      <CreateForm />
    </div>
  );
}
