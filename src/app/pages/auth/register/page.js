'use client'; // This marks the file as a Client Component

import 'bootstrap/dist/css/bootstrap.min.css';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import './Register.css';
import { useRouter } from 'next/navigation';


// Dynamically load Bootstrap JS to avoid SSR issues
const Bootstrap = dynamic(() => import('bootstrap/dist/js/bootstrap.bundle.min.js'), { ssr: false });

export default function SignUp() {
  // Define state for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !name ) {
      alert('All fields are required');
      return;
    }

    const userData = { email, password, name };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message); // Success message
        router.push('./login');
      } else {
        alert(result.error); // Error message
      }
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  return (
    <div className="w-1/2 row justify-center place-self-center">
      <div className="col-md-4 p-5">
        <h2 className="text-center">Sign Up</h2>
      </div>
      <form className="border-2 py-5 w-75 place-items-center rounded shadow-sm" onSubmit={handleSubmit}>
        <div className="col-10">
          <label htmlFor="inputEmail4" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="inputEmail4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="col-10">
          <label htmlFor="inputPassword4" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="inputPassword4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="col-10">
          <label htmlFor="inputName" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="inputName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="col-10 py-4">
        </div>
        <div className="col-10">
          <button type="submit" className="btn btn-primary">Sign Up</button>
        </div>
      </form>
    </div>
  );
}
