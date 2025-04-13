import { DockDemoTwo } from "@/components/ui/dock-demo-two"

export default function DockDemoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Dock Component Demo</h1>
      
      <div className="w-full max-w-4xl">
        <p className="mb-12 text-center text-lg">
          Navigate using the dock at the top of the page
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10"
            >
              <h2 className="text-xl font-semibold mb-4">Feature {i + 1}</h2>
              <p className="text-gray-300">
                This is a placeholder content card to demonstrate the dock component in action.
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <DockDemoTwo />
    </div>
  )
} 