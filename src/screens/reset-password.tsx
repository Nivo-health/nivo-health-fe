import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useShow } from '@/hooks/use-show';
import {
  SetPasswordFormValues,
  setPasswordSchema,
} from '@/schema/login.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSetPassword } from '../queries/auth.queries';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const restPasswordMutation = useSetPassword();
  const passwordshow = useShow();
  const confirmpasswordshow = useShow();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmpassword: '',
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    if (token) {
      try {
        const result = await restPasswordMutation.mutateAsync({
          new_password: data.password.trim(),
          token: token,
        });

        toast.add({
          title: result.message,
          type: 'success',
        });
        navigate('/login');
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
    } else {
      toast.add({
        title: 'Try sending mail again',
        type: 'error',
      });
    }
  };

  const loading = isSubmitting || restPasswordMutation.isPending;

  return (
    <div className="min-h-screen bg-primary/30 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Set New Password</h1>
        <p className="mt-2 text-sm text-primary">
          Choose a strong password to secure your account.
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
          <Fieldset.Root className="w-full gap-4">
            <Field.Root name="password">
              <Field.Item block>
                <Field.Control
                  id="password"
                  render={
                    <div className="relative w-full">
                      <Input
                        size="lg"
                        id="password"
                        type={passwordshow.shown ? 'text' : 'password'}
                        placeholder="Password"
                        disabled={loading}
                        {...register('password')}
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          passwordshow.toggle();
                        }}
                        className="size-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {passwordshow.shown ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  }
                />
              </Field.Item>

              {errors.password && (
                <Field.Error>{errors.password.message}</Field.Error>
              )}
            </Field.Root>
            <Field.Root name="confirmpassword">
              <Field.Item block>
                <Field.Control
                  id="confirmpassword"
                  render={
                    <div className="relative w-full">
                      <Input
                        size="lg"
                        id="confirmpassword"
                        type={confirmpasswordshow.shown ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        disabled={loading}
                        {...register('confirmpassword')}
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmpasswordshow.toggle();
                        }}
                        className="size-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {confirmpasswordshow.shown ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  }
                />
              </Field.Item>

              {errors.confirmpassword && (
                <Field.Error>{errors.confirmpassword.message}</Field.Error>
              )}
            </Field.Root>
          </Fieldset.Root>

          <Button size="lg" type="submit" disabled={loading} loading={loading}>
            Update Password
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
