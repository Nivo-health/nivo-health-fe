import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
  RestPasswordFormValues,
  restPasswordSchema,
} from '@/schema/login.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useRestPassword } from '../queries/auth.queries';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const restPasswordMutation = useRestPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RestPasswordFormValues>({
    resolver: zodResolver(restPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RestPasswordFormValues) => {
    try {
      const result = await restPasswordMutation.mutateAsync({
        email: data.email.trim(),
      });

      toast.add({
        title: result.message,
        type: 'success',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.';
      toast.add({
        title: errorMessage,
        type: 'error',
      });
    }
  };

  const loading = isSubmitting || restPasswordMutation.isPending;

  return (
    <div className="min-h-screen bg-primary/30 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Reset Password</h1>
        <p className="mt-2 text-sm text-primary">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>
      <div className="w-full max-w-md bg-primary-foreground rounded-2xl shadow-lg border border-primary/30 p-6 md:p-8">
        <div className="text-center mb-8 flex justify-center items-center gap-3">
          <img
            src="/logo.png"
            alt="Nivo health"
            className="size-9 rounded-full object-contain border border-primary"
          />
          <h1 className="text-xl font-bold text-primary">Nivo health</h1>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Fieldset.Root className="w-full">
            <Field.Root name="email">
              <Field.Item block>
                <Field.Control
                  id="email"
                  render={
                    <Input
                      size="lg"
                      id="email"
                      type="email"
                      placeholder="Email"
                      autoFocus
                      disabled={loading}
                      {...register('email')}
                    />
                  }
                />
              </Field.Item>

              {errors.email && (
                <Field.Error>{errors.email.message}</Field.Error>
              )}
            </Field.Root>
          </Fieldset.Root>

          <Button size="lg" type="submit" disabled={loading} loading={loading}>
            Send Reset Link
          </Button>
        </Form>
        <Button
          className="w-full mt-3"
          type="submit"
          variant="link"
          onClick={() => navigate('/login')}
        >
          <div className="flex gap-2 items-center">
            <ArrowLeftIcon />
            <div>Back to login</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
