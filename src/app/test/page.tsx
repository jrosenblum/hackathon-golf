export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind CSS Test Page</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-100 p-4 rounded">Red background</div>
        <div className="bg-blue-100 p-4 rounded">Blue background</div>
        <div className="bg-green-100 p-4 rounded">Green background</div>
        <div className="bg-yellow-100 p-4 rounded">Yellow background</div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Text Styles</h2>
        <p className="text-xl text-gray-800">Extra Large Text</p>
        <p className="text-lg text-gray-700">Large Text</p>
        <p className="text-base text-gray-600">Base Text</p>
        <p className="text-sm text-gray-500">Small Text</p>
        <p className="text-xs text-gray-400">Extra Small Text</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Blue Button
        </button>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
          Green Button
        </button>
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Red Button
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Flexbox</h2>
        <div className="flex space-x-4">
          <div className="bg-purple-100 p-4 rounded">Flex Item 1</div>
          <div className="bg-purple-100 p-4 rounded">Flex Item 2</div>
          <div className="bg-purple-100 p-4 rounded">Flex Item 3</div>
        </div>
      </div>
    </div>
  )
}