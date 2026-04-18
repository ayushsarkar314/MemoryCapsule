(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'testai@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login successful');
    const token = loginData.accessToken;
    const cookie = loginRes.headers.get('set-cookie') || '';
    
    console.log('Fetching AI suggestions...');
    const aiRes = await fetch('http://localhost:5000/api/ai/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Cookie: cookie
      },
      body: JSON.stringify({ hint: 'birthday' })
    });
    const aiData = await aiRes.json();
    console.log('AI Response code:', aiRes.status);
    console.log('AI Response:', JSON.stringify(aiData, null, 2));
  } catch(err) {
    console.error('Error:', err.message);
  }
})();
