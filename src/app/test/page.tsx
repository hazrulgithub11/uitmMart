'use client'

import { useState, useEffect } from 'react'

// Sample data interface
interface User {
  id: number
  name: string
  email: string
}

export default function TestPage() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        const data = await response.json()
        setUsers(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching users:', error)
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Add new user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      
      const newUser = await response.json()
      setUsers([...users, newUser])
      setName('')
      setEmail('')
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Integration Test</h1>
      
      {/* Form to add user */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>
        <div className="mb-4">
          <label className="block mb-1">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add User
        </button>
      </form>

      {/* Display users */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Users from Database</h2>
        {loading ? (
          <p>Loading...</p>
        ) : users.length > 0 ? (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="p-3 border rounded">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No users found</p>
        )}
      </div>
    </div>
  )
}
