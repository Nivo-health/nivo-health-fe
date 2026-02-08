import { Card } from '@/components/ui/card';

export default function StatsScreen() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 mb-6">Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card.Root className="border-teal-200">
            <Card.Header className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100">
              <Card.Title className="text-teal-900">Total Patients</Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">Registered patients</p>
            </Card.Panel>
          </Card.Root>
          <Card.Root className="border-teal-200">
            <Card.Header className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100">
              <Card.Title className="text-teal-900">Today's Visits</Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">Visits today</p>
            </Card.Panel>
          </Card.Root>
          <Card.Root className="border-teal-200">
            <Card.Header className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100">
              <Card.Title className="text-teal-900">Active Visits</Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">In progress</p>
            </Card.Panel>
          </Card.Root>
          <Card.Root className="border-teal-200">
            <Card.Header className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100">
              <Card.Title className="text-teal-900">Completed</Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">This month</p>
            </Card.Panel>
          </Card.Root>
        </div>
      </div>
    </div>
  );
}
