interface TagListProps {
  tags: string[]
  limit?: number
}

export default function TagList({ tags, limit }: TagListProps) {
  const visible = limit ? tags.slice(0, limit) : tags
  const remaining = limit ? tags.length - limit : 0

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(tag => (
        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-2 py-0.5 text-xs text-gray-500">+{remaining} more</span>
      )}
    </div>
  )
}
