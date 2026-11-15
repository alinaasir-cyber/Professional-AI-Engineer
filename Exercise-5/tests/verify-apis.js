async function main() {
  console.log('Testing OMDb API...');
  const omdbKey = process.env.OMDB_API_KEY || 'demo-key';
  const omdbRes = await fetch(`http://www.omdbapi.com/?t=Inception&apikey=${omdbKey}`);
  const omdbData = await omdbRes.json();
  console.log('OMDb Result:', omdbData.Response === 'True' ? `Found: ${omdbData.Title} (${omdbData.Year}) - Director: ${omdbData.Director}` : omdbData.Error);

  console.log('Testing icanhazdadjoke API...');
  const jokeRes = await fetch('https://icanhazdadjoke.com/', {
    headers: { Accept: 'application/json' },
  });
  const jokeData = await jokeRes.json();
  console.log('Joke Result:', jokeData.joke ? `Success: "${jokeData.joke.slice(0, 50)}..."` : 'Failed');
}

main().catch(console.error);
