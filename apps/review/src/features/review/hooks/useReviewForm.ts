import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import type { DocumentDetails, DocumentReviewProps } from '@ordo/contracts';
import {
  parseCents,
  toDocumentFields,
  toFormValues,
  validateReviewValues,
  type ReviewFormValues,
} from '../review-values';

const resolver: Resolver<ReviewFormValues> = (values) => {
  const messages = validateReviewValues(values);
  return {
    values: Object.keys(messages).length ? {} : values,
    errors: Object.fromEntries(
      Object.entries(messages).map(([field, message]) => [field, { type: 'validate', message }]),
    ),
  };
};

export function useReviewForm(document: DocumentDetails, onSave: DocumentReviewProps['onSave']) {
  const [revision, setRevision] = useState(document.revision);
  const [saved, setSaved] = useState(false);
  const form = useForm<ReviewFormValues>({
    defaultValues: toFormValues(document.fields),
    resolver,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const amounts = useWatch({
    control: form.control,
    name: ['subtotalCents', 'taxCents', 'totalCents'],
  });
  const subtotal = parseCents(amounts[0]);
  const tax = parseCents(amounts[1]);
  const total = parseCents(amounts[2]);
  const balanced =
    subtotal !== null && tax !== null && total !== null ? subtotal + tax === total : undefined;
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    setSaved(false);
    try {
      const result = await onSave({ revision, fields: toDocumentFields(values) });
      setRevision(result.revision);
      form.reset(toFormValues(result.fields));
      setSaved(true);
    } catch (error) {
      form.setError('root.server', {
        type: 'server',
        message:
          error instanceof Error
            ? error.message
            : 'Your changes could not be saved. Please try again.',
      });
    }
  });
  return {
    register: form.register,
    formState: form.formState,
    submit,
    balanced,
    saved: saved && !form.formState.isDirty,
    hasNewerVersion: document.revision > revision && !form.formState.isSubmitting,
  };
}
