import { PageHeader } from '@/components/common/page-header';
import { CreateForm } from '@/features/forms/create-form';

export const metadata = { title: 'New form' };

export default function CreateFormPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New form"
        description="Start with a title. You can change everything later."
      />
      <CreateForm />
    </div>
  );
}
