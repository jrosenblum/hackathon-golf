export default function TestTailwindPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold underline text-blue-600 mb-4">
        Hello, Tailwind CSS!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-blue-100 rounded-lg">
          <p className="text-blue-800">This should be a blue box with blue text</p>
        </div>
        <div className="p-6 bg-red-100 rounded-lg">
          <p className="text-red-800">This should be a red box with red text</p>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-8">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
          Blue Button
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700">
          Green Button
        </button>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700">
          Red Button
        </button>
      </div>
      
      <p className="text-lg text-gray-700">
        If you can see colored boxes and buttons above, Tailwind CSS is working correctly!
      </p>
    </div>
  );
}