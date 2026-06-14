import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all')
  const [subFilter, setSubFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    setSubFilter('all')
  }, [filter])

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('triageHistory') || '[]')
    setHistory(savedHistory)
  }

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.setItem('triageHistory', '[]')
      setHistory([])
    }
  }

  const exportFilteredHistory = () => {
    const dataStr = JSON.stringify(filteredHistory, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `triage-history-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const sortedHistory = [...history].sort((a, b) => 
    a.message.localeCompare(b.message)
  )
  
  const filteredHistory = sortedHistory.filter(item => {
    const categoryMatch = filter === 'all' || item.category === filter
    const subcategoryMatch = subFilter === 'all' || item.subcategory === subFilter
    const searchText = searchQuery.trim().toLowerCase()
    const searchMatch = searchText === '' || [
      item.message,
      item.category,
      item.subcategory,
      item.reasoning
    ].some(value => value?.toLowerCase().includes(searchText))
    return categoryMatch && subcategoryMatch && searchMatch
  })

  const categories = [...new Set(history.map(item => item.category))]
  const subcategories = filter === 'all'
    ? [...new Set(history.map(item => item.subcategory || 'General'))]
    : [...new Set(history.filter(item => item.category === filter).map(item => item.subcategory || 'General'))]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
              <p className="text-gray-600">View and manage past message analyses</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {history.length > 0 && (
                <button
                  onClick={exportFilteredHistory}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Export Filtered History
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search history</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by message, category, subcategory, or reasoning..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          {history.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories ({history.length})
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      filter === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({history.filter(h => h.category === category).length})
                  </button>
                ))}
              </div>
              {subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSubFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      subFilter === 'all'
                        ? 'bg-slate-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Subcategories
                  </button>
                  {subcategories.map(subcategory => (
                    <button
                      key={subcategory}
                      onClick={() => setSubFilter(subcategory)}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        subFilter === subcategory
                          ? 'bg-slate-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {subcategory} ({history.filter(h => h.subcategory === subcategory).length})
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* History List */}
        {filteredHistory.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-xl text-gray-600 mb-2">No history yet</div>
            <p className="text-gray-500 mb-6">
              Analyzed messages will appear here
            </p>
            <a
              href="/analyze"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Analyze a Message
            </a>
          </div>
        )}

        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="text-gray-800 font-medium mb-2">
                      "{item.message.substring(0, 100)}{item.message.length > 100 ? '...' : ''}"
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                        {item.category}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-900 px-3 py-1 rounded-full font-semibold">
                        {item.subcategory}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        item.urgency === 'High' ? 'bg-red-200 text-red-900' :
                        item.urgency === 'Medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-green-200 text-green-900'
                      }`}>
                        {item.urgency} Urgency
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 ml-4">
                    {expandedIndex === index ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Full Message</div>
                      <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                        {item.message}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Subcategory</div>
                      <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-200">
                        {item.subcategory}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Recommended Action</div>
                      <div className="text-sm text-gray-800 bg-purple-50 p-3 rounded border border-purple-200">
                        {item.recommendedAction}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">AI Reasoning</div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>
                            {item.reasoning}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage
