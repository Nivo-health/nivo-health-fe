import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { LoginFormValues, loginSchema } from '@/schema/login.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../queries/auth.queries';
import { useAuthStore } from '../stores/auth.store';

export default function LoginScreen() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const setTokens = useAuthStore((state) => state.setTokens);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email.trim(),
        password: data.password,
      });

      setTokens(result.access, result.refresh);

      toast.add({
        title: 'Login successful!',
        type: 'success',
      });

      navigate('/');
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

  const loading = isSubmitting || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border border-teal-200 p-6 md:p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-teal-900 mb-2">
              Clinic Management
            </h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset.Root className="w-full">
              <Field.Root name="email">
                <Field.Label htmlFor="email">Email *</Field.Label>

                <Field.Item block>
                  <Field.Control
                    id="email"
                    render={
                      <Input
                        size="lg"
                        id="email"
                        type="email"
                        placeholder="Enter your email"
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

              <Field.Root name="password">
                <Field.Label htmlFor="password">Password *</Field.Label>

                <Field.Item block>
                  <Field.Control
                    id="password"
                    render={
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        disabled={loading}
                        {...register('password')}
                      />
                    }
                  />
                </Field.Item>

                {errors.password && (
                  <Field.Error>{errors.password.message}</Field.Error>
                )}
              </Field.Root>
            </Fieldset.Root>

            {/* Submit */}
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
