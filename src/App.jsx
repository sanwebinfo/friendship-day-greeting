import { useEffect, useState, useRef } from 'preact/hooks';
// @ts-ignore
import DOMPurify from 'dompurify';
import slugify from 'slugify';
import Footer from './components/Footer';
import './index.css';

const sanitizeName = (name) => {
  let cleanName = DOMPurify.sanitize(name).trim();
  cleanName = slugify(cleanName, {
    replacement: ' ',
    remove: /[*+~.()'"!:@]/g,
    lower: false,
    strict: false,
  }) || 'Friend Name';
  cleanName = cleanName.replace(/\++/g, ' '); 
  cleanName = cleanName.replace(/\s+/g, ' ');
  cleanName = cleanName.replace(/%20+/g, ' ');
  cleanName = cleanName.replace(/-+/g, ' ');
  if (cleanName.length < 2 || cleanName.length > 36) {
    return '';
  }
  return cleanName;
};

const updateMetaTags = (cleanName, sanitizedURL) => {
  try {
    document.title = `Happy Friendship Day, ${cleanName}`;
    document.querySelector('meta[name="description"]').setAttribute('content', `A special Friendship Day greeting for ${cleanName}.`);
    document.querySelector('link[rel="canonical"]').setAttribute('href', sanitizedURL.toString());
    document.querySelector('meta[property="og:title"]').setAttribute('content', `Happy Friendship Day, ${cleanName}`);
    document.querySelector('meta[property="og:description"]').setAttribute('content', `A special Friendship Day greeting for ${cleanName}.`);
    document.querySelector('meta[property="og:url"]').setAttribute('content', sanitizedURL.toString());
    document.querySelector('meta[name="twitter:title"]').setAttribute('content', `Happy Friendship Day, ${cleanName}`);
    document.querySelector('meta[name="twitter:description"]').setAttribute('content', `A special Friendship Day greeting for ${cleanName}.`);
    document.querySelector('meta[name="twitter:url"]').setAttribute('content', sanitizedURL.toString());
  } catch (error) {
    console.error("Error updating meta tags: ", error);
  }
};

const App = () => {
  const [friendName, setFriendName] = useState('');
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const chatBoxRef = useRef(null); // Reference to the chat box for scrolling
  const alertRef = useRef(null); // Reference to the alert box

  useEffect(() => {
    try {
      // @ts-ignore
      const url = new URL(window.location);
      const search = new URLSearchParams(url.search);
      const name = search.get('name') || 'Friend Name';
      const user = slugify(name, {
        replacement: '-',
        remove: /[$%*_+~.()'"!\-:@]+/g,
        lower: false,
        strict: false,
      });
      if (user) {
        const cleanName = sanitizeName(name);
        if (cleanName) {
          setFriendName(cleanName);
          // @ts-ignore
          const sanitizedURL = new URL(window.location);
          sanitizedURL.searchParams.set('name', slugify(cleanName, { replacement: '-', remove: /[*+~.()'"!:@]/g, lower: false, strict: false }));
          window.history.replaceState(null, '', sanitizedURL.toString());
          updateMetaTags(cleanName, sanitizedURL);
        } else {
          setError('Invalid name provided. Please ensure it is between 2 to 36 characters.');
        }
      } else {
        setError('No name provided in the URL.');
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("URI malformed")) {
        setError('The URL provided is malformed. Please check the URL and try again.');
      } else {
        setError('Internal server error: An error occurred while processing the name.');
      }
      console.error("Error occurred: ", err);
    }

    // Function to update current time
    const updateTime = () => {
      const now = new Date();
      const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' };
      const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
      // @ts-ignore
      const timeString = now.toLocaleTimeString('en-IN', timeOptions);
      // @ts-ignore
      const dateString = now.toLocaleDateString('en-IN', dateOptions);
      setCurrentTime(`${dateString} ${timeString}`);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputName(newValue);
    setError('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanName = sanitizeName(inputName);
    if (cleanName) {
      // @ts-ignore
      const sanitizedURL = new URL(window.location);
      sanitizedURL.searchParams.set('name', slugify(cleanName, { replacement: '-', remove: /[*+~.()'"!:@]/g, lower: false, strict: false }));
      window.history.replaceState(null, '', sanitizedURL.toString());
      updateMetaTags(cleanName, sanitizedURL);
      setFriendName(cleanName);
      setInputName(''); // Clearing input after successful submission
      setError('');
      setAlertMessage(`Greeting Created for : ${cleanName}`);
      setTimeout(() => setAlertMessage(''), 3000); // Hide alert after 3 seconds

      // Scroll to the chat bubble after successful submission
      setTimeout(() => {
        chatBoxRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300); // Small delay to ensure rendering is complete
    } else {
      setError('Invalid name provided. Please ensure it is between 2 to 36 characters.');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      // @ts-ignore
      const sanitizedURL = new URL(window.location);
      navigator.clipboard.writeText(sanitizedURL.toString())
        .then(() => {
          setAlertMessage('Greeting URL copied to clipboard');
          setTimeout(() => setAlertMessage(''), 3000); // Hide alert after 3 seconds
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          setAlertMessage('Failed to copy the URL. Please try again.');
          setTimeout(() => setAlertMessage(''), 3000); // Hide alert after 3 seconds
        });
    } catch (error) {
      setAlertMessage('An error occurred while copying the URL.');
      setTimeout(() => setAlertMessage(''), 3000); // Hide alert after 3 seconds
    }
  };

  return (
    <div class="chat-container relative">
     {alertMessage && (
        <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div
          ref={alertRef}
          class="bg-yellow-500 text-black py-3 px-4 rounded-lg shadow-lg max-w-xs w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex items-center"
        >
        <p class="flex-grow break-words">{alertMessage}</p>
        <button
          class="ml-4 text-black p-2 rounded-full focus:outline-none"
          onClick={() => setAlertMessage('')}
        >
         &times;
        </button>
      </div>
      </div>
    )}
      <br />
      <br />
      <div class="chat-box" ref={chatBoxRef}>
        <div class="chat-header">Happy Friendship Day 🥳</div>
        <br />
        {error ? (
          <p class="chat-error">{error}</p>
        ) : (
          <>
            <div class="chat-bubble right">
              {friendName ? `😉 ${friendName} 👋` : 'Dear Friend, Happy Friendship Day'}
              <div class="chat-time">{currentTime}</div>
            </div>
            <div class="chat-bubble left">
              <p>Happy Friendship Day 🥳</p>
              <div class="chat-time">{currentTime}</div>
            </div>
            <div class="chat-bubble right">
              <p>Friendship is a symbol of unity, always preserve it 💜</p>
              <div class="chat-time">{currentTime}</div>
            </div>
            <div class="chat-bubble left">
              <p>In the garden of life, friends are the flowers that make it bloom with joy 🎁</p>
              <div class="chat-time">{currentTime}</div>
            </div>
            <br />
          </>
        )}
      </div>
      <button type="button" onClick={handleCopyToClipboard} class="px-6 py-3 mt-4 rounded-full bg-blue-600 text-white font-bold uppercase border border-green-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
      Copy Greeting URL
      </button>
      <br />
      <div class="form-box">
        <form onSubmit={handleFormSubmit} class="mt-6 flex flex-col items-center gap-4">
          <input
            type="text"
            onChange={handleInputChange}
            placeholder="Enter your friend's name"
            class="text-center rounded-full p-3 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            required
          />
          <button type="submit" class="px-6 py-3 rounded-full bg-purple-600 text-white font-bold uppercase border border-green-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
            Submit
          </button>
        </form>
      </div>
      <br />
      <br />
      <Footer />
    </div>
  );
};

export default App;
