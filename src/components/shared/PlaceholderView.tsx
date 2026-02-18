interface PlaceholderViewProps {
  tabName: string
}

export default function PlaceholderView({ tabName }: PlaceholderViewProps) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center">
        <p className="text-xl font-semibold mb-2">{tabName}</p>
        <p className="text-sm">Coming soon</p>
      </div>
    </div>
  )
}
