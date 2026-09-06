import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import type { DocumentDetails, ReviewDocumentInput } from '@ordo/contracts';
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

export function useReviewForm(
  document: DocumentDetails,
  onSave: (input: ReviewDocumentInput) => Promise<DocumentDetails>,
) {
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
  const [subtotal, tax, total] = amounts.map(parseCents);
  const balanced =
    subtotal !== null &&
    subtotal !== undefined &&
    tax !== null &&
    tax !== undefined &&
    total !== null &&
    total !== undefined
      ? subtotal + tax === total
      : undefined;
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
    ...form,
    submit,
    balanced,
    saved: saved && !form.formState.isDirty,
    hasNewerVersion: document.revision > revision && !form.formState.isSubmitting,
  };
}
