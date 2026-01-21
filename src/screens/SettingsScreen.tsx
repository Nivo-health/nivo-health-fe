import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Button } from '../components/ui';

export default function SettingsScreen() {
  const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'Clinic OPD Management';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 mb-6">Settings</h1>
        <Card className="border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
            <CardTitle className="text-teal-900">Clinic Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Input
              label="Clinic Name"
              value={CLINIC_NAME}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-600">
              To change the clinic name, set the VITE_CLINIC_NAME environment variable.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
